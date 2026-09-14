import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const base = process.env.GAME_TEST_URL ?? "http://localhost:5176";
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("our-world-preview-v1")));
async function observeScene() {
  await page.waitForFunction(() => {
    const host = document.querySelector(".game-canvas");
    const key = Object.keys(host).find((key) => key.startsWith("__reactFiber"));
    let fiber = host[key];
    while (fiber) {
      if (fiber.memoizedProps?.sceneRef?.current) {
        window.iceCreamTestScene = fiber.memoizedProps.sceneRef.current;
        return Boolean(window.iceCreamTestScene.avatar);
      }
      fiber = fiber.return;
    }
    return false;
  });
}
try {
  await page.goto(`${base}/?preview`);
  await page.waitForSelector("canvas");
  await observeScene();
  // Give this isolated preview an existing companion to check room travel.
  await page.evaluate(() => {
    const saved = structuredClone(window.iceCreamTestScene.current);
    saved.character.petId = "pet-duck";
    localStorage.setItem("our-world-preview-v1", JSON.stringify(saved));
  });
  await page.reload();
  await page.waitForSelector("canvas");
  await observeScene();
  await page.getByRole("button", { name: /The Nasal Ice Cream Shop/ }).click();
  await page
    .getByRole("heading", { name: /The Nasal Ice Cream Shop/, level: 1 })
    .waitFor({ timeout: 30000 });
  assert.equal((await state()).character.room, "shop:icecream");
  await page.waitForFunction(() => window.iceCreamTestScene.pets.size === 1);
  assert.equal(await page.locator("dialog").count(), 0);
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
    .getByRole("button", { name: "Choose ice cream", exact: true })
    .click();
  await page
    .getByRole("heading", {
      name: "The Nasal Ice Cream Shop",
      exact: true,
      level: 2,
    })
    .waitFor({ timeout: 15000 });
  const flavors = await page.evaluate(
    async () => (await import("/src/content/iceCream.ts")).iceCreams,
  );
  assert.ok(flavors.length, "The family has chosen the flavors");
  for (const flavor of flavors) {
    const row = page
      .locator(".shop-item")
      .filter({
        has: page.getByRole("heading", { name: flavor.name, exact: true }),
      });
    assert.equal(
      await row.getByRole("button", { name: "5 Buy", exact: true }).count(),
      1,
    );
  }
  await page.locator(".shop-item").first().getByRole("button").click();
  assert.equal((await state()).character.balance, 45);
  const first = flavors[0];
  assert.equal((await state()).character.inventory[first.id], 1);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page.waitForSelector("canvas");
  assert.equal((await state()).character.inventory[first.id], 1);
  await page.getByRole("button", { name: "My bag" }).click();
  await page.getByRole("button", { name: "Enjoy", exact: true }).click();
  assert.equal((await state()).character.inventory[first.id], 0);
  assert.equal((await state()).character.petId, "pet-duck");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/our-world-ice-cream.png",
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
    .waitFor({ timeout: 15000 });
  await page
    .getByLabel("Where would you like to deliver?")
    .selectOption("icecream");
  await page
    .getByRole("button", { name: "I’ll take the parcel", exact: true })
    .click();
  await page.getByRole("button", { name: /^Take it to/ }).click();
  await page
    .getByRole("button", { name: "Deliver · +15", exact: true })
    .click();
  assert.equal((await state()).character.balance, 60);
  assert.equal((await state()).character.delivery, "none");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: ice cream shop entry, chairs, companion, flavors and prices, purchase, saved treats, enjoyment, delivery, mobile layout, no page errors.",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/ice-cream-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
