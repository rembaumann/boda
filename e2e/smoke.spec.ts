import { expect, test, type Locator, type Page } from "@playwright/test";

const questionsPerSet = 10;

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

async function expectBugButtonClear(page: Page, bug: Locator): Promise<void> {
  const bugBox = await bug.boundingBox();
  expect(bugBox).not.toBeNull();
  if (!bugBox) return;
  expect(bugBox.x).toBeGreaterThan(393 / 2);
  expect(bugBox.y).toBeGreaterThan(852 - 160);
  expect(bugBox.x + bugBox.width).toBeLessThanOrEqual(393);
  expect(bugBox.y + bugBox.height).toBeLessThanOrEqual(852);
  const controls = page.locator("[data-choice], .question .primary, .answer-input, .speaker");
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const box = await controls.nth(index).boundingBox();
    if (!box) continue;
    expect(overlaps(bugBox, box)).toBe(false);
  }
}

async function answerQuestion(page: Page, index: number): Promise<void> {
  await expect(page.locator("[data-screen='drill']")).toBeVisible();
  await expect(page.getByRole("button", { name: "Report a bug" })).toBeVisible();
  await expect(page.getByText(`${index + 1} of ${questionsPerSet}`, { exact: true })).toBeVisible();

  const kind = await page.locator("[data-drill]").getAttribute("data-drill");
  if (kind === "typeAnswer") {
    await page.getByLabel("Spanish").fill("respuesta");
    await page.getByRole("button", { name: "Check", exact: true }).click();
  } else if (kind === "multipleChoice" || kind === "listen") {
    await page.locator("[data-choice]").first().click();
  } else {
    throw new Error(`Unexpected question type on question ${index + 1}: ${String(kind)}`);
  }

  const advance = index + 1 === questionsPerSet ? "See results" : "Next";
  await page.getByRole("button", { name: advance, exact: true }).click();
}

test("opens the app, picks a player, and finishes a 10-question set", async ({ page }) => {
  expect(page.viewportSize()).toEqual({ width: 393, height: 852 });

  await page.goto("/");
  await expect(page.locator("[data-screen='home']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "boda", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Report a bug" })).toBeVisible();
  await expect(page.locator("[data-scoreboard]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play today's duel", exact: true })).toBeVisible();

  const player = page.getByRole("button", { name: /Shannon/ });
  await player.click();
  await expect(player).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Start practice", exact: true }).click();

  for (let index = 0; index < questionsPerSet; index += 1) {
    await answerQuestion(page, index);
  }

  await expect(page.locator("[data-screen='summary']")).toBeVisible();
  await expect(page.getByRole("button", { name: "Report a bug" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Set complete", exact: true })).toBeVisible();
  await expect(page.locator(".for")).toHaveText("Shannon");
  await expect(page.locator("[data-score]")).toHaveAttribute("data-score", /^\d+\/10$/);
  await expect(page.locator("ol.results > li")).toHaveCount(questionsPerSet);
});

test("plays today's duel and shows a share grid", async ({ page }) => {
  expect(page.viewportSize()).toEqual({ width: 393, height: 852 });

  await page.goto("/");
  await page.getByRole("button", { name: /Shannon/ }).click();
  await page.getByRole("button", { name: "Play today's duel", exact: true }).click();

  for (let index = 0; index < questionsPerSet; index += 1) {
    await answerQuestion(page, index);
  }

  await expect(page.locator("[data-screen='summary']")).toBeVisible();
  await expect(page.getByRole("button", { name: "Report a bug" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today's duel", exact: true })).toBeVisible();
  const grid = await page.locator("[data-share-grid]").innerText();
  expect([...grid].filter((symbol) => symbol === "🟩" || symbol === "⬛")).toHaveLength(questionsPerSet);
  await expect(page.locator("[data-score]")).toHaveAttribute("data-score", /^\d+\/10$/);

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy result", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Back home", exact: true }).click();
  await expect(page.locator("[data-scoreboard]")).toContainText("Waiting on Rem");
  await expect(page.getByRole("button", { name: "Play today's duel", exact: true })).toHaveCount(0);
});

test("suggests a feature from home and files one bug from a drill", async ({ page }) => {
  expect(page.viewportSize()).toEqual({ width: 393, height: 852 });
  let bugCalls = 0;
  let drillType = "";
  await page.route("**/api/feedback", async (route) => {
    const body = route.request().postDataJSON() as {
      kind: string;
      description: string;
      company: string;
      screen: string;
      playerId: string;
      drillType: string | null;
      phraseId: string | null;
    };
    expect(body.company).toBe("");
    if (body.kind === "bug") {
      bugCalls += 1;
      expect(body.screen).toBe("drill");
      expect(body.playerId).toBe("rem");
      expect(body.drillType).toBe(drillType);
      expect(body.phraseId).toBeTruthy();
      expect(body.description).toBe("The speaker button did nothing.");
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, identifier: "REM-23" }),
      });
      return;
    }
    expect(body.kind).toBe("feature");
    expect(body.screen).toBe("home");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, identifier: "REM-24" }),
    });
  });

  await page.goto("/");
  const feature = page.locator("[data-feature-form]");
  await feature.scrollIntoViewIfNeeded();
  await expect(feature.getByRole("heading", { name: "Suggest a feature", exact: true })).toBeVisible();
  const featureSubmit = feature.getByRole("button", { name: "Submit", exact: true });
  await expect(featureSubmit).toBeDisabled();
  await feature.getByLabel("Description").fill("Nope");
  await expect(featureSubmit).toBeDisabled();
  await feature.getByLabel("Description").fill("Add a way to save favorite phrases.");
  await expect(featureSubmit).toBeEnabled();
  await featureSubmit.click();
  await expect(feature.getByText("Got it, REM-24")).toBeVisible();

  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  await expect(page.locator("[data-screen='drill']")).toBeVisible();
  const bug = page.getByRole("button", { name: "Report a bug" });
  await expect(bug).toBeVisible();
  drillType = (await page.locator("[data-drill]").getAttribute("data-drill")) ?? "";
  expect(drillType).not.toBe("");
  await expectBugButtonClear(page, bug);

  await bug.click();
  const sheet = page.getByRole("dialog", { name: "Report a bug" });
  await expect(sheet).toBeVisible();
  await sheet.getByLabel("Description").fill("The speaker button did nothing.");
  await page.evaluate(() => {
    const form = document.querySelector("[data-bug-sheet] form");
    if (!(form instanceof HTMLFormElement)) throw new Error("missing bug form");
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(sheet.getByRole("button", { name: "Sending…" })).toBeVisible();
  await expect(sheet.getByText("Got it, REM-23")).toBeVisible();
  expect(bugCalls).toBe(1);
});

test("keeps a bug report when sending fails", async ({ page }) => {
  await page.route("**/api/feedback", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "linear" }),
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Report a bug" }).click();
  const sheet = page.getByRole("dialog", { name: "Report a bug" });
  const field = sheet.getByLabel("Description");
  await field.fill("The score did not update.");
  await sheet.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(sheet.getByText("Couldn't send that. Try again in a moment.")).toBeVisible();
  await expect(field).toHaveValue("The score did not update.");
});

test("says to retry a bug report when offline", async ({ page, context }) => {
  let calls = 0;
  await page.route("**/api/feedback", (route) => {
    calls += 1;
    return route.fulfill({ status: 500, body: "{}" });
  });
  await page.goto("/");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Report a bug" }).click();
  const sheet = page.getByRole("dialog", { name: "Report a bug" });
  const field = sheet.getByLabel("Description");
  await field.fill("The board never loaded.");
  await sheet.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(sheet.getByText("You're offline, try again when connected.")).toBeVisible();
  await expect(field).toHaveValue("The board never loaded.");
  expect(calls).toBe(0);
});
