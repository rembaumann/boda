#!/usr/bin/env node
// Boda design tokens v1 build.
//   in:  config/boda.theme.json  (couple-specific: players, seasons, activeSeason, brand roles)
//   out: tokens.json (DTCG / Style Dictionary v4 format), tokens.css, tailwind.theme.css,
//        contrast-report.md, contrast.json
// Exits 1 if any text pair is below WCAG AA (4.5:1) or UI pair below 3:1, in ANY season x mode,
// or if a tap-target size token is below 44px.
import fs from 'node:fs';
import path from 'node:path';
// usage: node build-tokens.mjs [--config config/boda.theme.json] [--out .]   (paths relative to cwd)
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const CONFIG = arg('--config', 'config/boda.theme.json'), OUT = arg('--out', '.');
fs.mkdirSync(OUT, { recursive: true });
const out = f => path.join(OUT, f);
const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const seasonIds = cfg.seasons.map(s => s.id);
if (!seasonIds.includes(cfg.activeSeason)) { console.error(`activeSeason "${cfg.activeSeason}" is not one of ${seasonIds.join(', ')}`); process.exit(1); }

// ---------- Base system (shared by every season) ----------
const neutrals = {
  light: { bg: '#E9E9E4', surface: '#F4F4F0', 'surface-sunken': '#DADAD3', border: '#BBBBB2', 'border-strong': '#74746B', text: '#1A1C19', 'text-muted': '#55564E', focus: '#1D4FA3' },
  dark:  { bg: '#121411', surface: '#1B1E1A', 'surface-sunken': '#242823', border: '#343A33', 'border-strong': '#858A7E', text: '#EEEBE3', 'text-muted': '#ABA79A', focus: '#8DB1F7' },
};
const feedback = {
  correct: { light: { fill: '#13735E', on: '#FFFFFF', text: '#0F6A56', soft: '#DDF1EA' }, dark: { fill: '#13735E', on: '#FFFFFF', text: '#6FD3B5', soft: '#123029' } },
  wrong:   { light: { fill: '#B3261E', on: '#FFFFFF', text: '#B3261E', soft: '#FBE3E0' }, dark: { fill: '#C2372E', on: '#FFFFFF', text: '#FF9B91', soft: '#3D1A17' } },
};
const why = {
  bg: 'Cool lime plaster sampled from the steel-corridor photo at Casa de la Bola; deliberately not the cream AI default.',
  surface: 'One step lighter plaster for the solid nav and sheets; no cards.',
  'surface-sunken': 'Cantera paving tone for empty window panes.',
  border: 'Plaster seam; decorative only (not relied on for meaning).',
  'border-strong': 'Weathered stone; the lowest-contrast line that still meets 3:1 for UI.',
  text: 'Iron-black with a green cast, from the steel frames, not pure black.',
  'text-muted': 'Mortar grey for secondary sentences; passes AA on every ground.',
  focus: 'Talavera cobalt ring; visible on plaster and steel-night.',
  ink: 'Hierro forjado: the black steel frames both venues share; the one primary action.',
  brand: 'Bugambilia from CASO\'s walls; wordmark and rare brand moments only.',
  celebrate: 'Luz de vela / cempasúchil: candle-glow gold that means a win and nothing else.',
  correct: 'Jade pushed toward blue so it separates from red for deuteranopes; always with ✓.',
  wrong: 'Chile red; always with ✕.',
  'player-a': 'Rem: talavera cobalt + filled circle.',
  'player-b': 'Shannon: ocre (CASO mustard velvet) + diamond + hatch; blue vs ochre stays 22+ apart in every colour-vision simulation.',
};
const fonts = {
  sans: { value: "'Archivo Variable', 'Archivo', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", why: 'Archivo (Omnibus-Type, Google Fonts, OFL): grotesque with a width axis, condensed for scores and signage, normal for reading; tabular figures; full Spanish set.' },
  serif: { value: "'Alegreya', Georgia, 'Times New Roman', serif", why: 'Alegreya (Huerta Tipográfica, Google Fonts, OFL): built for Spanish text; used for ONE invitation line per screen, never italic.' },
};
// [px, line-height, weight, tracking(em), stretch(%), family]
const type = {
  caption:    [12, 1.33, 500, 0, 100, 'sans'],
  'body-sm':  [14, 1.43, 400, 0, 100, 'sans'],
  body:       [16, 1.5, 400, 0, 100, 'sans'],
  'body-lg':  [18, 1.45, 400, 0, 100, 'sans'],
  label:      [15, 1.3, 600, 0, 100, 'sans'],
  title:      [20, 1.3, 600, 0, 100, 'sans'],
  headline:   [24, 1.2, 700, -0.005, 100, 'sans'],
  invitation: [31, 1.1, 500, 0, 100, 'serif'],
  season:     [32, 1.0, 700, -0.01, 75, 'sans'],
  score:      [128, 0.86, 800, -0.02, 62, 'sans'],
};
const space = { 0: 0, px: 1, '0.5': 2, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 13: 52, 14: 56, 16: 64, 20: 80 };
const size = { // all interactive sizes are space-scale references; build fails if any is < 44px
  'tap-min': ['11', 'Apple HIG / WCAG 2.5.5 minimum: every tappable thing is at least this tall and wide.'],
  nav: ['13', 'Bottom tab height (before the safe-area inset).'],
  control: ['14', 'Primary iron button height, in the thumb zone.'],
};
const radius = { none: [0, 'Default: steel frames, panes, the season wall, the CTA.'], sm: [2, 'Inputs, so the caret area reads as a field.'], md: [4, 'Sheets and dialogs only.'] };
const shadow = { light: 'none', dark: 'none', overlay: '0 24px 48px -24px rgb(18 20 17 / 0.45)' };
const motion = {
  duration: { instant: 80, fast: 150, base: 240, slow: 400, celebrate: 900 },
  easing: { standard: [0.2, 0, 0, 1], decelerate: [0.05, 0.7, 0.1, 1], accelerate: [0.3, 0, 0.8, 0.15], spring: [0.34, 1.56, 0.64, 1] },
};

// ---------- colour math ----------
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = h => { const [r, g, b] = hex2rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const oklab = v => { const [r, g, b] = v.map(x => Math.min(1, Math.max(0, x)));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
const sim = (h, M) => { const v = hex2rgb(h).map(lin); return M ? M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]) : v; };
const dE = (a, b, M) => { const [p, q] = [oklab(sim(a, M)), oklab(sim(b, M))]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * 100; };

// ---------- semantic palette per mode ----------
const [pa, pb] = cfg.players;
const roleSrc = mode => ({ ink: cfg.ink[mode], brand: cfg.brand[mode], celebrate: cfg.celebrate[mode], correct: feedback.correct[mode], wrong: feedback.wrong[mode], 'player-a': pa[mode], 'player-b': pb[mode] });
function palette(mode) {
  const c = { ...neutrals[mode] };
  for (const [r, v] of Object.entries(roleSrc(mode))) { c[r] = v.fill; c[`on-${r}`] = v.on; c[`${r}-text`] = v.text; c[`${r}-soft`] = v.soft; }
  return c;
}
const pal = { light: palette('light'), dark: palette('dark') };
const seasonVars = a => ({ season: a.fill, 'on-season': a.on, 'season-text': a.text, 'season-soft': a.soft });

// ---------- checks: every season x every mode ----------
const checks = [];
const add = (theme, mode, fg, fgHex, bg, bgHex, min, kind) => checks.push({ theme, mode, fg, bg, fgHex, bgHex, ratio: +ratio(fgHex, bgHex).toFixed(2), min, kind });
for (const s of cfg.seasons) for (const mode of ['light', 'dark']) {
  const c = { ...pal[mode], ...seasonVars(s[mode]) };
  const grounds = ['bg', 'surface', 'surface-sunken'];
  const textRoles = ['text', 'text-muted', 'ink-text', 'brand-text', 'celebrate-text', 'correct-text', 'wrong-text', 'player-a-text', 'player-b-text', 'season-text'];
  for (const g of grounds) {
    for (const t of textRoles) add(s.id, mode, t, c[t], g, c[g], 4.5, 'text');
    // the season wall is a decorative plane, not a UI component (WCAG 1.4.11); its text is checked as on-season
    for (const u of ['border-strong', 'focus', 'player-a', 'player-b', 'ink']) add(s.id, mode, u, c[u], g, c[g], 3, 'ui');
  }
  for (const r of ['ink', 'brand', 'celebrate', 'correct', 'wrong', 'player-a', 'player-b', 'season']) {
    add(s.id, mode, `on-${r}`, c[`on-${r}`], r, c[r], 4.5, 'text');
    add(s.id, mode, `${r}-text`, c[`${r}-text`], `${r}-soft`, c[`${r}-soft`], 4.5, 'text');
    add(s.id, mode, 'text', c.text, `${r}-soft`, c[`${r}-soft`], 4.5, 'text');
  }
  // PR #1 compatibility pairs: it paints var(--on-primary) text on var(--correct) / var(--incorrect)
  add(s.id, mode, 'on-ink (PR --on-primary)', c['on-ink'], 'correct-text (PR --correct)', c['correct-text'], 4.5, 'text');
  add(s.id, mode, 'on-ink (PR --on-primary)', c['on-ink'], 'wrong-text (PR --incorrect)', c['wrong-text'], 4.5, 'text');
}
const fails = checks.filter(x => x.ratio < x.min);
const sizeFails = Object.entries(size).filter(([, [k]]) => space[k] < 44);
const cvd = [], cw = [];
for (const mode of ['light', 'dark']) for (const t of [null, 'protan', 'deutan', 'tritan']) {
  cvd.push({ mode, vision: t || 'typical', dE: +dE(pa[mode].fill, pb[mode].fill, t && CVD[t]).toFixed(1) });
  cw.push({ mode, vision: t || 'typical', dE: +dE(feedback.correct[mode].fill, feedback.wrong[mode].fill, t && CVD[t]).toFixed(1) });
}

// ---------- tokens.json (DTCG; Style Dictionary v4 reads it as-is) ----------
const tok = (type, value, description) => ({ $type: type, $value: value, ...(description ? { $description: description } : {}) });
const colorGroup = mode => Object.fromEntries(Object.entries(pal[mode]).map(([k, v]) => [k, tok('color', v, mode === 'light' ? (why[k] || why[k.replace(/^on-|-text$|-soft$/g, '')] && undefined) ?? why[k] : undefined)]));
const tokens = {
  $description: 'Boda design tokens v1. GENERATED by build-tokens.mjs from config/boda.theme.json; edit the config, not this file.',
  color: { light: colorGroup('light'), dark: colorGroup('dark') },
  season: Object.fromEntries(cfg.seasons.map(s => [s.id, {
    $description: `${s.nameEn} (${s.nameEs}), ${s.accentName}. Overrides only the four season colour tokens.`,
    light: Object.fromEntries(Object.entries(seasonVars(s.light)).map(([k, v]) => [k, tok('color', v)])),
    dark: Object.fromEntries(Object.entries(seasonVars(s.dark)).map(([k, v]) => [k, tok('color', v)])),
  }])),
  player: Object.fromEntries(cfg.players.map(p => [p.slot, {
    $description: `${p.name}: ${p.colorName}. Identity = colour + shape + pattern; never colour alone.`,
    id: { $value: p.id }, name: { $value: p.name }, initial: { $value: p.initial }, shape: { $value: p.shape }, pattern: { $value: p.pattern },
  }])),
  font: {
    family: { sans: tok('fontFamily', fonts.sans.value, fonts.sans.why), serif: tok('fontFamily', fonts.serif.value, fonts.serif.why) },
    style: Object.fromEntries(Object.entries(type).map(([k, [px, lh, w, tr, st, fam]]) => [k, tok('typography', { fontFamily: `{font.family.${fam}}`, fontSize: `${px}px`, lineHeight: lh, fontWeight: w, letterSpacing: `${tr}em`, fontStretch: `${st}%` })])),
  },
  space: Object.fromEntries(Object.entries(space).map(([k, v]) => [k, tok('dimension', `${v}px`)])),
  size: Object.fromEntries(Object.entries(size).map(([k, [ref, d]]) => [k, tok('dimension', `{space.${ref}}`, d)])),
  radius: Object.fromEntries(Object.entries(radius).map(([k, [v, d]]) => [k, tok('dimension', `${v}px`, d)])),
  shadow: { overlay: tok('shadow', shadow.overlay, 'The only shadow: sheets over content. Everything else is flat, grouped by type and iron rules.') },
  motion: {
    duration: Object.fromEntries(Object.entries(motion.duration).map(([k, v]) => [k, tok('duration', `${v}ms`)])),
    easing: Object.fromEntries(Object.entries(motion.easing).map(([k, v]) => [k, tok('cubicBezier', v)])),
    'reduced-duration': tok('duration', '1ms', 'Every duration collapses to this under prefers-reduced-motion: state still changes, nothing travels.'),
  },
  'safe-area': Object.fromEntries(['top', 'right', 'bottom', 'left'].map(s => [s, { $value: `env(safe-area-inset-${s}, 0px)`, $description: 'iOS notch / home indicator; needs viewport-fit=cover.' }])),
};
// drop undefined descriptions
const clean = o => JSON.parse(JSON.stringify(o));

// ---------- tokens.css ----------
const P = '--boda';
const cv = (c, ind = '  ') => Object.entries(c).map(([k, v]) => `${ind}${P}-color-${k}: ${v};`).join('\n');
const sv = (a, ind = '  ') => cv(seasonVars(a), ind);
const active = cfg.seasons.find(s => s.id === cfg.activeSeason);
const pxr = v => (v === 0 ? '0' : `${v / 16}rem`);
const css = `/* Boda design tokens v1. GENERATED by build-tokens.mjs from config/boda.theme.json. Do not edit by hand.
   Theme switch: ONE value, config.activeSeason ("${cfg.activeSeason}"), which is also the :root default.
   At runtime: document.documentElement.dataset.season = activeSeason. Optional data-theme="light|dark" overrides the OS. */

:root {
  color-scheme: light dark;

  /* colour: light (base) */
${cv(pal.light)}

  /* season: default = activeSeason (${active.nameEn}) */
${sv(active.light)}

  /* roles */
  ${P}-color-primary: var(${P}-color-ink);
  ${P}-color-on-primary: var(${P}-color-on-ink);
  ${P}-color-accent: var(${P}-color-season-text);

  /* type: Archivo (sans) + Alegreya (serif, one line per screen) */
  ${P}-font-sans: ${fonts.sans.value};
  ${P}-font-serif: ${fonts.serif.value};
${Object.entries(type).map(([k, [px, lh, w, tr, st, fam]]) => `  ${P}-text-${k}: ${pxr(px)};\n  ${P}-leading-${k}: ${lh};\n  ${P}-weight-${k}: ${w};\n  ${P}-tracking-${k}: ${tr}em;\n  ${P}-stretch-${k}: ${st}%;\n  ${P}-family-${k}: var(${P}-font-${fam});`).join('\n')}

  /* space (4pt) */
${Object.entries(space).map(([k, v]) => `  ${P}-space-${String(k).replace('.', '_')}: ${k === 'px' ? '1px' : pxr(v)};`).join('\n')}

  /* sizes (tap targets) */
${Object.entries(size).map(([k, [ref]]) => `  ${P}-size-${k}: var(${P}-space-${ref});`).join('\n')}

  /* radius */
${Object.entries(radius).map(([k, [v]]) => `  ${P}-radius-${k}: ${v}px;`).join('\n')}

  /* elevation */
  ${P}-shadow-overlay: ${shadow.overlay};

  /* motion */
${Object.entries(motion.duration).map(([k, v]) => `  ${P}-duration-${k}: ${v}ms;`).join('\n')}
${Object.entries(motion.easing).map(([k, v]) => `  ${P}-ease-${k}: cubic-bezier(${v.join(', ')});`).join('\n')}

  /* iOS safe areas */
${['top', 'right', 'bottom', 'left'].map(s => `  ${P}-safe-${s}: env(safe-area-inset-${s}, 0px);`).join('\n')}

  /* player identity (shape/pattern names for components; colours above) */
${cfg.players.map(p => `  ${P}-player-${p.slot}-shape: ${p.shape};\n  ${P}-player-${p.slot}-pattern: ${p.pattern};`).join('\n')}
}

/* seasons: each overrides only the four season colours */
${cfg.seasons.map(s => `:root[data-season="${s.id}"] { /* ${s.nameEn} / ${s.nameEs}: ${s.accentName} */\n${sv(s.light)}\n}`).join('\n')}

/* dark: follows the OS unless data-theme="light" */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${cv(pal.dark, '    ')}
${sv(active.dark, '    ')}
  }
${cfg.seasons.map(s => `  :root:not([data-theme="light"])[data-season="${s.id}"] {\n${sv(s.dark, '    ')}\n  }`).join('\n')}
}
:root[data-theme="dark"] {
${cv(pal.dark)}
${sv(active.dark)}
}
${cfg.seasons.map(s => `:root[data-theme="dark"][data-season="${s.id}"] {\n${sv(s.dark)}\n}`).join('\n')}

/* reduced motion: state changes stay, travel/flip/confetti go */
@media (prefers-reduced-motion: reduce) {
  :root {
${Object.keys(motion.duration).map(k => `    ${P}-duration-${k}: 1ms;`).join('\n')}
    ${P}-ease-spring: linear;
  }
}

/* compatibility with REM-5 / PR #1 (src/config/app.config.ts -> CSS vars). Remove once components use --boda-* */
:root {
  --background: var(${P}-color-bg);
  --surface: var(${P}-color-surface);
  --ink: var(${P}-color-text);
  --muted: var(${P}-color-text-muted);
  --primary: var(${P}-color-ink);
  --on-primary: var(${P}-color-on-ink);
  --accent: var(${P}-color-season-text);
  --gold: var(${P}-color-celebrate);
  --line: var(${P}-color-border);
  --correct: var(${P}-color-correct-text);
  --correct-bg: var(${P}-color-correct-soft);
  --incorrect: var(${P}-color-wrong-text);
  --incorrect-bg: var(${P}-color-wrong-soft);
}
`;

// ---------- Tailwind v4 ----------
const twColors = [...Object.keys(pal.light), 'season', 'on-season', 'season-text', 'season-soft', 'primary', 'on-primary', 'accent'];
const tw = `/* Tailwind v4 bridge. GENERATED. In your CSS entry:
   @import "tailwindcss"; @import "./tokens.css"; @import "./tailwind.theme.css";
   Utilities: bg-bg, text-text-muted, bg-ink text-on-ink, bg-season, text-player-b-text, text-score, font-serif, rounded-none, min-h-tap, pb-safe ... */
@theme inline {
${twColors.map(k => `  --color-${k}: var(${P}-color-${k});`).join('\n')}
  --font-sans: var(${P}-font-sans);
  --font-serif: var(${P}-font-serif);
${Object.keys(type).map(k => `  --text-${k}: var(${P}-text-${k});\n  --text-${k}--line-height: var(${P}-leading-${k});\n  --text-${k}--letter-spacing: var(${P}-tracking-${k});\n  --text-${k}--font-weight: var(${P}-weight-${k});`).join('\n')}
  --spacing: 0.25rem;
${Object.keys(radius).map(k => `  --radius-${k}: var(${P}-radius-${k});`).join('\n')}
  --shadow-overlay: var(${P}-shadow-overlay);
${Object.keys(motion.easing).map(k => `  --ease-${k}: var(${P}-ease-${k});`).join('\n')}
}
@utility min-h-tap { min-height: var(${P}-size-tap-min); }
@utility min-w-tap { min-width: var(${P}-size-tap-min); }
@utility h-control { height: var(${P}-size-control); }
@utility pt-safe { padding-top: var(${P}-safe-top); }
@utility pb-safe { padding-bottom: var(${P}-safe-bottom); }
@utility stretch-score { font-stretch: var(${P}-stretch-score); }
@utility stretch-season { font-stretch: var(${P}-stretch-season); }
`;

// ---------- report ----------
const tx = checks.filter(c => c.kind === 'text'), ui = checks.filter(c => c.kind === 'ui');
const low = arr => arr.reduce((m, c) => (c.ratio < m.ratio ? c : m));
const lt = low(tx), lu = low(ui);
const perTheme = cfg.seasons.flatMap(s => ['light', 'dark'].map(m => { const a = checks.filter(c => c.theme === s.id && c.mode === m); return { theme: s.id, mode: m, pairs: a.length, fails: a.filter(c => c.ratio < c.min).length, minText: low(a.filter(c => c.kind === 'text')), minUi: low(a.filter(c => c.kind === 'ui')) }; }));
const summary = { pairs: checks.length, failures: fails.length, lowestText: lt, lowestUi: lu, perTheme, cvd, correctWrong: cw, sizeFails: sizeFails.length };
const report = `# Boda contrast report v1 (generated)

${checks.length} pairs checked (${cfg.seasons.length} seasons x light/dark) · ${fails.length} failures
Lowest text: ${lt.ratio}:1 (${lt.fg} ${lt.fgHex} on ${lt.bg} ${lt.bgHex}, ${lt.theme}/${lt.mode}) · Lowest UI: ${lu.ratio}:1 (${lu.fg} ${lu.fgHex} on ${lu.bg} ${lu.bgHex})

| theme | mode | pairs | failures | lowest text | lowest UI |
|---|---|---|---|---|---|
${perTheme.map(p => `| ${p.theme} | ${p.mode} | ${p.pairs} | ${p.fails} | ${p.minText.ratio} (${p.minText.fg} on ${p.minText.bg}) | ${p.minUi.ratio} (${p.minUi.fg} on ${p.minUi.bg}) |`).join('\n')}

## All pairs
| theme | mode | fg | bg | ratio | needs | result |
|---|---|---|---|---|---|---|
${checks.map(c => `| ${c.theme} | ${c.mode} | ${c.fg} ${c.fgHex} | ${c.bg} ${c.bgHex} | ${c.ratio} | ${c.min} | ${c.ratio >= c.min ? 'pass' : '**FAIL**'} |`).join('\n')}
`;

// one token per line keeps the file reviewable; still plain JSON
const fmt = (o, ind = '') => {
  if (o === null || typeof o !== 'object' || Array.isArray(o) || '$value' in o) return JSON.stringify(o);
  const n = ind + '  ';
  return '{\n' + Object.entries(o).map(([k, v]) => `${n}${JSON.stringify(k)}: ${fmt(v, n)}`).join(',\n') + `\n${ind}}`;
};
fs.writeFileSync(out('tokens.json'), fmt(clean(tokens)) + '\n');
fs.writeFileSync(out('tokens.css'), css);
fs.writeFileSync(out('tailwind.theme.css'), tw);
fs.writeFileSync(out('contrast-report.md'), report);
fs.writeFileSync(out('contrast.json'), JSON.stringify({ summary, checks }, null, 2));
console.log(`checked ${checks.length} pairs across ${perTheme.length} theme/mode combos, ${fails.length} failures; lowest text ${lt.ratio}, lowest UI ${lu.ratio}; tap sizes ${sizeFails.length ? 'FAIL' : 'ok'}`);
for (const f of fails) console.log(`FAIL ${f.theme}/${f.mode} ${f.fg} ${f.fgHex} on ${f.bg} ${f.bgHex}: ${f.ratio} < ${f.min}`);
for (const [k] of sizeFails) console.log(`FAIL size.${k} < 44px`);
process.exit(fails.length || sizeFails.length ? 1 : 0);
