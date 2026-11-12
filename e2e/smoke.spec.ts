import { expect, test, type Page } from "@playwright/test";

const questionsPerSet = 10;

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

async function expectNoFixedOrSticky(page: Page): Promise<void> {
  const covering = await page.evaluate(() =>
    [...document.body.querySelectorAll("*")]
      .filter((el) => {
        const position = getComputedStyle(el).position;
        return position === "fixed" || position === "sticky";
      })
      .map((el) => el.tagName.toLowerCase()),
  );
  expect(covering).toEqual([]);
}

async function expectControlsReachable(page: Page): Promise<void> {
  const controls = page.locator(".screen").locator("button, a, input, textarea");
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if ((await control.getAttribute("aria-hidden")) === "true") continue;
    if (!(await control.isVisible())) continue;
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    const scrollBox = await page.locator(".app-scroll").boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(scrollBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (!box || !scrollBox || !viewport) return;
    expect(box.x).toBeGreaterThanOrEqual(-2);
    expect(box.y).toBeGreaterThanOrEqual(scrollBox.y - 2);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
    expect(box.y + box.height).toBeLessThanOrEqual(Math.min(viewport.height, scrollBox.y + scrollBox.height) + 2);
  }
}

async function expectNoOverlaps(page: Page): Promise<void> {
  const boxes = await page.evaluate(() => {
    const scroll = document.querySelector(".app-scroll");
    if (!(scroll instanceof HTMLElement)) return [];
    const clip = scroll.getBoundingClientRect();
    const found: { x: number; y: number; width: number; height: number }[] = [];
    for (const node of scroll.querySelectorAll("button, a, input, textarea")) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.getAttribute("aria-hidden") === "true") continue;
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = node.getBoundingClientRect();
      const x = Math.max(rect.left, clip.left);
      const y = Math.max(rect.top, clip.top);
      const right = Math.min(rect.right, clip.right);
      const bottom = Math.min(rect.bottom, clip.bottom);
      if (right - x < 1 || bottom - y < 1) continue;
      found.push({ x, y, width: right - x, height: bottom - y });
    }
    return found;
  });
  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const a = boxes[left];
      const b = boxes[right];
      if (!a || !b) continue;
      expect(overlaps(a, b)).toBe(false);
    }
  }
}

async function expectScreenClear(page: Page): Promise<void> {
  await expectNoFixedOrSticky(page);
  await expectNoOverlaps(page);
  await expectControlsReachable(page);
  await page.locator(".app-scroll").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expectNoOverlaps(page);
  await expectNoFixedOrSticky(page);
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

test("feedback opens in the page and nothing covers the controls", async ({ page }) => {
  for (const viewport of [
    { width: 393, height: 852 },
    { width: 375, height: 667 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("[data-screen='home']")).toBeVisible();
    await expect(page.locator("[data-bug-button]")).toHaveCount(0);
    await expectScreenClear(page);

    const send = page.getByRole("button", { name: "Send feedback", exact: true });
    await send.click();
    const homeForm = page.locator("[data-send-feedback]");
    await expect(homeForm.getByLabel("Description")).toBeVisible();
    await expect(homeForm.locator("form")).toHaveAttribute("data-feedback-kind", "bug");
    await homeForm.getByRole("button", { name: "Idea", exact: true }).click();
    await expect(homeForm.locator("form")).toHaveAttribute("data-feedback-kind", "feature");
    await expectScreenClear(page);

    await page.getByRole("button", { name: "Start practice", exact: true }).click();
    await expect(page.locator("[data-screen='drill']")).toBeVisible();
    const bug = page.getByRole("button", { name: "Report a bug" });
    await expect(bug).toBeVisible();
    await expectScreenClear(page);
    await bug.click();
    const drillForm = page.locator("[data-bug-sheet]");
    await expect(drillForm.getByRole("heading", { name: "Report a bug", exact: true })).toBeVisible();
    await expect(drillForm.locator("form")).toHaveAttribute("data-feedback-kind", "bug");
    await expectScreenClear(page);

    await page.goto("/");
    await page.getByRole("button", { name: "Play today's duel", exact: true }).click();
    await expect(page.locator("[data-screen='drill']")).toBeVisible();
    const duelBug = page.getByRole("button", { name: "Report a bug" });
    await expect(duelBug).toBeVisible();
    await expectScreenClear(page);
    await duelBug.click();
    await expect(page.locator("[data-bug-sheet] form")).toHaveAttribute("data-feedback-kind", "bug");
    await expectScreenClear(page);
  }
});

test("opens the app, picks a player, and finishes a 10-question set", async ({ page }) => {
  expect(page.viewportSize()).toEqual({ width: 393, height: 852 });

  await page.goto("/");
  await expect(page.locator("[data-screen='home']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "boda", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send feedback", exact: true })).toBeVisible();
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

  await bug.click();
  const sheet = page.locator("[data-bug-sheet]");
  await expect(sheet.getByRole("heading", { name: "Report a bug", exact: true })).toBeVisible();
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
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  const sheet = page.locator("[data-send-feedback]");
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
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  const sheet = page.locator("[data-send-feedback]");
  const field = sheet.getByLabel("Description");
  await field.fill("The board never loaded.");
  await sheet.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(sheet.getByText("You're offline, try again when connected.")).toBeVisible();
  await expect(field).toHaveValue("The board never loaded.");
  expect(calls).toBe(0);
});
