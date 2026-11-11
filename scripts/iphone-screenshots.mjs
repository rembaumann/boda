// iPhone 15 captures against `npm run preview`. Install playwright separately; it is not an app dependency.
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BODA_URL ?? "http://127.0.0.1:4173/";
const out = "/opt/cursor/artifacts";
await mkdir(out, { recursive: true });

const names = {
  multipleChoice: "screenshot_multiple_choice.png",
  typeAnswer: "screenshot_type_answer.png",
  listen: "screenshot_listen.png",
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
});
const page = await context.newPage();
page.setDefaultTimeout(15000);

await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await navigator.serviceWorker?.ready;
  await document.fonts.ready;
});
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("heading", { name: "boda" }).waitFor();
const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
if (!controlled) throw new Error("Service worker is not controlling the page after reload.");

await page.screenshot({ path: `${out}/screenshot_home.png` });
await page.getByRole("button", { name: "Start practice" }).click();
await page.locator("[data-drill]").waitFor();

const captured = new Set();
for (let index = 0; index < 10; index += 1) {
  const drill = await page.locator("[data-drill]").getAttribute("data-drill");
  if (!drill || !(drill in names)) throw new Error(`Unexpected drill on question ${index + 1}: ${drill}`);
  if (!captured.has(drill)) {
    await page.screenshot({ path: `${out}/${names[drill]}` });
    captured.add(drill);
  }
  if (drill === "typeAnswer") {
    await page.getByLabel("Spanish").fill("respuesta de prueba");
    await page.getByRole("button", { name: "Check" }).click();
  } else {
    await page.locator("[data-choice]").first().click();
  }
  await page.getByRole("button", { name: /Next|See results/ }).click();
}

for (const drill of Object.keys(names)) {
  if (!captured.has(drill)) throw new Error(`Never saw a ${drill} question.`);
}

await page.getByRole("heading", { name: "Set complete" }).waitFor();
await page.screenshot({ path: `${out}/screenshot_summary.png` });

await context.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "boda" }).waitFor();
await page.getByRole("button", { name: "Start practice" }).waitFor();
const offlineText = await page.locator("body").innerText();
if (!offlineText.includes("Last set")) {
  throw new Error("Offline reload did not restore the saved set from localStorage.");
}
console.log("offline navigation ok");
await browser.close();
