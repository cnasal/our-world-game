import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
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
    .waitFor({ timeout: 25000 });
  await page
    .getByRole("navigation", { name: "Shop counter" })
    .getByRole("button", { name: "Browse toys", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Stuffed duck", exact: true })
    .waitFor({ timeout: 15000 });
  await page
    .locator(".shop-item")
    .filter({
      has: page.getByRole("heading", { name: "Stuffed duck", exact: true }),
    })
    .getByRole("button")
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Our town", exact: true }).click();
  await page.getByRole("button", { name: /The Nasal Resale Shop/ }).click();
  await page
    .getByRole("heading", { name: /The Nasal Resale Shop/, level: 1 })
    .waitFor({ timeout: 30000 });
  assert.equal((await state()).character.room, "shop:resale");
  await page
    .getByRole("button", { name: "Sit on left chair", exact: true })
    .click();
  const stand = page
    .getByRole("navigation", { name: "Places to rest" })
    .getByRole("button", { name: "Stand up", exact: true });
  await stand.waitFor({ timeout: 15000 });
  await stand.click();
  await page
    .getByRole("navigation", { name: "Shop counter" })
    .getByRole("button", { name: "Sell my items", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sell one · +7", exact: true })
    .waitFor({ timeout: 15000 });
  await page.screenshot({
    path: "/tmp/our-world-resale-menu.png",
    fullPage: true,
  });
  assert.equal(
    await page
      .locator("dialog")
      .evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth),
    false,
  );
  await page
    .getByRole("button", { name: "Sell one · +7", exact: true })
    .click();
  assert.equal((await state()).character.balance, 42);
  assert.equal((await state()).character.inventory["toy-stuffed-duck"], 0);
  await page
    .getByText("Your backpack has no items to sell right now.", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await page.waitForSelector("canvas");
  assert.equal((await state()).character.balance, 42);
  assert.equal((await state()).character.inventory["toy-stuffed-duck"], 0);
  await page.screenshot({ path: "/tmp/our-world-resale.png", fullPage: true });
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
    .waitFor({ timeout: 15000 });
  await page
    .getByLabel("Where would you like to deliver?")
    .selectOption("resale");
  await page
    .getByRole("button", { name: "I’ll take the parcel", exact: true })
    .click();
  await page.getByRole("button", { name: /^Take it to/ }).click();
  await page
    .getByRole("button", { name: "Deliver · +15", exact: true })
    .click();
  assert.equal((await state()).character.balance, 57);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: resale store entry, chairs, clear selling price, item removal and payout, empty bag, reload persistence, deliveries, phone layout, no page errors.",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/resale-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
