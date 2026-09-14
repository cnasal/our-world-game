import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("our-world-preview-v1")));
try {
  await page.goto(
    `${process.env.GAME_TEST_URL ?? "http://localhost:5176"}/?preview`,
  );
  await page.waitForSelector("canvas");
  await page.getByRole("button", { name: /The Nasal Bank/ }).click();
  await page
    .getByRole("heading", { name: /The Nasal Bank/, level: 1 })
    .waitFor({ timeout: 30000 });
  assert.equal((await state()).character.room, "shop:bank");
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
    .getByRole("button", { name: "Visit the bank counter", exact: true })
    .click();
  await page.getByLabel("How many coins?").waitFor({ timeout: 15000 });
  await page.getByLabel("How many coins?").fill("20");
  await page
    .getByRole("button", { name: "Put into savings", exact: true })
    .click();
  assert.equal((await state()).character.balance, 30);
  assert.equal((await state()).character.savings, 20);
  await page.getByLabel("How many coins?").fill("100");
  assert.equal(
    await page
      .getByRole("button", { name: "Put into savings", exact: true })
      .isDisabled(),
    true,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Take out of savings", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByLabel("How many coins?").fill("7");
  await page
    .getByRole("button", { name: "Take out of savings", exact: true })
    .click();
  assert.equal((await state()).character.balance, 37);
  assert.equal((await state()).character.savings, 13);
  await page.screenshot({
    path: "/tmp/our-world-bank-menu.png",
    fullPage: true,
  });
  assert.equal(
    await page
      .locator("dialog")
      .evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth),
    false,
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await page.waitForSelector("canvas");
  assert.equal((await state()).character.savings, 13);
  await page.screenshot({ path: "/tmp/our-world-bank.png", fullPage: true });
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
    .selectOption("bank");
  await page
    .getByRole("button", { name: "I’ll take the parcel", exact: true })
    .click();
  await page.getByRole("button", { name: /^Take it to/ }).click();
  await page
    .getByRole("button", { name: "Deliver · +15", exact: true })
    .click();
  assert.equal((await state()).character.balance, 52);
  assert.equal((await state()).character.savings, 13);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: bank entry, chairs, deposits, withdrawals, balance limits, saved savings, deliveries, phone layout, no page errors.",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/bank-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
