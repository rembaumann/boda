import { expect, test, type Page } from "@playwright/test";

const questionsPerSet = 10;

async function answerQuestion(page: Page, index: number): Promise<void> {
  await expect(page.locator("[data-screen='drill']")).toBeVisible();
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
