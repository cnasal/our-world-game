import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("our-world-preview-v1")));
try {
  await page.goto(
    `${process.env.GAME_TEST_URL ?? "http://localhost:5176"}/?preview`,
  );
  await page.waitForSelector("canvas");
  for (const [index, destination] of [
    "restaurant",
    "school",
    "home:neighbor-2",
    "hotel:dining",
  ].entries()) {
    if (index > 0)
      await page.getByRole("button", { name: "Our town", exact: true }).click();
    if (index === 3) await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "Let’s help out", exact: true })
      .click();
    await page
      .getByLabel("Where would you like to deliver?")
      .waitFor({ timeout: 15000 });
    await page
      .getByLabel("Where would you like to deliver?")
      .selectOption(destination);
    await page
      .getByRole("button", { name: "I’ll take the parcel", exact: true })
      .click();
    await page.waitForSelector("dialog", { state: "detached" });
    assert.equal((await state()).character.deliveryTarget, destination);
    if (index === 1) {
      await page.reload();
      await page.waitForSelector("canvas");
      assert.equal((await state()).character.deliveryTarget, destination);
    }
    await page.getByRole("button", { name: /^Take it to/ }).click();
    await page
      .getByRole("button", { name: "Deliver · +15", exact: true })
      .waitFor({ timeout: 15000 });
    await page
      .getByRole("button", { name: "Deliver · +15", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Deliver · +15", exact: true })
      .waitFor({ state: "detached" });
    assert.equal((await state()).character.balance, 50 + (index + 1) * 15);
    assert.equal((await state()).character.delivery, "none");
    if (await page.locator("dialog").count())
      await page.getByRole("button", { name: "Close dialog" }).click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: destination selection, restaurant and school deliveries, specific homes and hotel rooms, reload persistence, rewards, phone layout, no page errors.",
  );
} finally {
  await browser.close();
}
