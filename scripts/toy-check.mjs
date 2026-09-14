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
  await page.getByRole("button", { name: /The Nasal Toy Store/ }).click();
  await page
    .getByRole("heading", { name: /The Nasal Toy Store/, level: 1 })
    .waitFor({ timeout: 20000 });
  assert.equal((await state()).character.room, "shop:toys");
  assert.equal(await page.locator("dialog").count(), 0);
  await page
    .getByRole("button", { name: "Sit on left chair", exact: true })
    .click();
  const stand = page
    .getByRole("navigation", { name: "Places to rest" })
    .getByRole("button", { name: "Stand up", exact: true });
  await stand.waitFor({ timeout: 15000 });
  assert.equal((await state()).character.restId, "hotel-chair-1");
  await stand.click();
  await page
    .getByRole("navigation", { name: "Shop counter" })
    .getByRole("button", { name: "Browse toys", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Teddy bear", exact: true })
    .waitFor({ timeout: 10000 });
  await page
    .locator(".shop-item")
    .filter({
      has: page.getByRole("heading", { name: "Teddy bear", exact: true }),
    })
    .getByRole("button")
    .click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  assert.equal((await state()).character.balance, 40);
  await page.getByRole("button", { name: "My bag" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  assert.equal((await state()).character.inventory["toy-teddy"], 1);
  await page.reload();
  await page.waitForSelector("canvas");
  assert.equal((await state()).character.inventory["toy-teddy"], 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/our-world-toy-store.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Our town", exact: true }).click();
  await page
    .getByRole("button", { name: "Let’s help out", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Pick up a package", exact: true })
    .waitFor({ timeout: 15000 });
  await page
    .getByRole("button", { name: "Pick up a package", exact: true })
    .click();
  await page
    .getByLabel("Where would you like to deliver?")
    .waitFor({ timeout: 10000 });
  await page
    .getByLabel("Where would you like to deliver?")
    .selectOption("toys");
  await page
    .getByRole("button", { name: "I’ll take the parcel", exact: true })
    .click();
  await page.getByRole("button", { name: /^Take it to/ }).click();
  await page
    .getByRole("button", { name: "Deliver · +15", exact: true })
    .click();
  await page.waitForTimeout(300);
  assert.equal((await state()).character.balance, 55);
  assert.equal((await state()).character.delivery, "none");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: toy store entry, chairs, counter, purchase, reusable toys, saved progress, mobile layout, package delivery, no page errors.",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/toy-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
