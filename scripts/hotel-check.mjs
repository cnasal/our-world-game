import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.GAME_TEST_URL ?? "http://localhost:5175";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const saved = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("our-world-preview-v1")));
const restControls = page.getByRole("navigation", { name: "Places to rest" });
const hotelControls = page.getByRole("navigation", { name: "Hotel rooms" });
async function lobby() {
  await page.locator(".back-town").click();
  await page
    .getByRole("heading", { name: /The Nasal Hotel · Lobby/ })
    .waitFor();
}
try {
  await page.goto(`${base}/?preview`);
  await page.waitForSelector("canvas");
  await page.getByRole("button", { name: /The Nasal Hotel/ }).click();
  await page
    .getByRole("heading", { name: /The Nasal Hotel · Lobby/ })
    .waitFor({ timeout: 20000 });
  assert.equal(await page.locator("dialog").count(), 0);
  await page.screenshot({
    path: "/tmp/our-world-hotel-lobby.png",
    fullPage: true,
  });
  for (const [name, room] of [
    ["Cloud room", "hotel:cloud"],
    ["Sunflower room", "hotel:sunflower"],
    ["Star room", "hotel:star"],
  ]) {
    await hotelControls.getByRole("button", { name, exact: true }).click();
    await page
      .getByRole("heading", { name: new RegExp(name) })
      .waitFor({ timeout: 10000 });
    assert.equal((await saved()).character.room, room);
    await restControls
      .getByRole("button", { name: "Lie on bed", exact: true })
      .click();
    await restControls
      .getByRole("button", { name: "Stand up", exact: true })
      .waitFor({ timeout: 10000 });
    assert.equal((await saved()).character.restId, "bed");
    // Leaving a room while resting clears the pose.
    await lobby();
    assert.equal((await saved()).character.restId, undefined);
  }
  for (const [name, width, height] of [
    ["desktop", 1440, 1050],
    ["ipad", 834, 1112],
    ["phone", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await hotelControls
      .getByRole("button", { name: "Dining room", exact: true })
      .click();
    await page
      .getByRole("heading", { name: /Hotel dining room/ })
      .waitFor({ timeout: 10000 });
    await hotelControls
      .getByRole("button", { name: "Free buffet", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Help yourself!", exact: true })
      .waitFor({ timeout: 10000 });
    const before = await saved();
    await page
      .getByRole("button", { name: "Enjoy free spaghetti", exact: true })
      .click();
    await page.getByRole("status").filter({ hasText: "Yum!" }).waitFor();
    let after = await saved();
    assert.equal(after.character.balance, before.character.balance);
    assert.deepEqual(after.character.inventory, before.character.inventory);
    await page.getByRole("button", { name: "Close dialog" }).click();
    await restControls
      .getByRole("button", { name: "Sit on left chair", exact: true })
      .click();
    await restControls
      .getByRole("button", { name: "Stand up", exact: true })
      .waitFor({ timeout: 10000 });
    await hotelControls
      .getByRole("button", { name: "Free menu", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Enjoy free pancakes", exact: true })
      .click();
    await page.getByRole("status").filter({ hasText: "pancakes" }).waitFor();
    after = await saved();
    assert.equal(after.character.balance, before.character.balance);
    assert.equal(after.character.restId, "hotel-chair-1");
    assert.equal(
      await page
        .locator("dialog")
        .evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth),
      false,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: `/tmp/our-world-hotel-${name}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Close dialog" }).click();
    await lobby();
  }
  await page.locator(".back-town").click();
  assert.equal((await saved()).character.room, "town");
  await page.reload();
  await page.waitForSelector("canvas");
  assert.equal((await saved()).character.balance, 50);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: hotel entry, three guest rooms, beds, lobby returns, free dining, eating while seated, room exit, saved coins, desktop/tablet/phone layouts, no page errors.",
  );
} finally {
  await browser.close();
}
