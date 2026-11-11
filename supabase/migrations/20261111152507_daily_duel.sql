-- Daily duel results and the season theme catalog.
-- Theme rows match src/config/app.config.ts. The running app reads themes,
-- player names, and the points target from that config so a fork can change
-- them without editing screens. Keep this seed in step with the config before
-- applying the file.
--
-- Anon (the public app key) can read both tables and insert a daily result
-- whose fields pass the checks below. Anon cannot update or delete anything.
-- There is no password: do not grant the service role key to the app.

create table public.seasons (
  id text primary key,
  theme text not null,
  sort_order integer not null,
  deck_file text,
  constraint seasons_id_format check (id ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$'),
  constraint seasons_theme_length check (char_length(theme) between 1 and 80),
  constraint seasons_sort_order check (sort_order >= 1),
  constraint seasons_sort_order_unique unique (sort_order),
  constraint seasons_deck_file check (
    deck_file is null or deck_file ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$'
  )
);

insert into public.seasons (id, theme, sort_order, deck_file) values
  ('scouting-mexico-city', 'Scouting Trip', 1, 'scouting-mexico-city'),
  ('vendors-planner', 'Vendors & Planner', 2, null),
  ('family-guests', 'Family & Guests', 3, null),
  ('toast-vows', 'Toast & Vows', 4, null);

create table public.daily_results (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  season_id text not null references public.seasons (id),
  season_number integer not null,
  played_on date not null,
  correct_count integer not null,
  question_count integer not null,
  elapsed_ms integer not null,
  marks text not null,
  created_at timestamptz not null default now(),
  constraint daily_results_player_id_format check (
    player_id ~ '^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$'
  ),
  constraint daily_results_season_number check (season_number between 1 and 10000),
  constraint daily_results_played_on check (played_on >= date '2020-01-01'),
  constraint daily_results_question_count check (question_count between 1 and 100),
  constraint daily_results_correct_count check (correct_count between 0 and question_count),
  constraint daily_results_elapsed_ms check (elapsed_ms between 1 and 86400000),
  constraint daily_results_marks_match check (
    marks ~ '^[01]+$'
    and char_length(marks) = question_count
    and char_length(replace(marks, '0', '')) = correct_count
  ),
  constraint daily_results_one_play unique (player_id, played_on)
);

create index daily_results_season_id_idx on public.daily_results (season_id);

comment on table public.seasons is
  'Season theme catalog. Display copy and the race target live in app config.';
comment on table public.daily_results is
  'One finished daily duel per player per calendar day. Append-only for anon.';

alter table public.seasons enable row level security;
alter table public.seasons force row level security;
alter table public.daily_results enable row level security;
alter table public.daily_results force row level security;

revoke all on table public.seasons from public, anon, authenticated;
revoke all on table public.daily_results from public, anon, authenticated;

grant select on table public.seasons to anon, authenticated;
grant select, insert on table public.daily_results to anon, authenticated;

create policy seasons_select
  on public.seasons
  for select
  to anon, authenticated
  using (true);

create policy daily_results_select
  on public.daily_results
  for select
  to anon, authenticated
  using (true);

create policy daily_results_insert
  on public.daily_results
  for insert
  to anon, authenticated
  with check (
    player_id ~ '^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$'
    and season_number between 1 and 10000
    and played_on >= (timezone('utc', now()))::date - 1
    and played_on <= (timezone('utc', now()))::date + 1
    and question_count between 1 and 100
    and correct_count between 0 and question_count
    and elapsed_ms between 1 and 86400000
    and marks ~ '^[01]+$'
    and char_length(marks) = question_count
    and char_length(replace(marks, '0', '')) = correct_count
  );

-- Intentionally no update or delete policy. RLS denies those operations.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.daily_results;
  end if;
end
$$;
