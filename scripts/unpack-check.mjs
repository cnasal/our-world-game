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
async function observeScene() {
  await page.waitForFunction(() => {
    const host = document.querySelector(".game-canvas");
    let fiber =
      host[Object.keys(host).find((key) => key.startsWith("__reactFiber"))];
    while (fiber) {
      if (fiber.memoizedProps?.sceneRef?.current) {
        window.unpackTestScene = fiber.memoizedProps.sceneRef.current;
        return Boolean(window.unpackTestScene.avatar);
      }
      fiber = fiber.return;
    }
    return false;
  });
}
try {
  await page.goto(
    `${process.env.GAME_TEST_URL ?? "http://localhost:5176"}/?preview`,
  );
  await page.waitForSelector("canvas");
  await observeScene();
  // Only seed items in this isolated browser preview.
  await page.evaluate(() => {
    const saved = structuredClone(window.unpackTestScene.current);
    saved.character.inventory = {
      "toy-stuffed-duck": 1,
      "icecream-chocolate": 1,
    };
    localStorage.setItem("our-world-preview-v1", JSON.stringify(saved));
  });
  await page.reload();
  await page.waitForSelector("canvas");
  await observeScene();
  await page.getByRole("button", { name: "My home", exact: true }).click();
  await page.getByRole("button", { name: "My bag" }).click();
  await page.getByLabel("Unpack onto…").selectOption("shelf-left");
  await page
    .locator(".shop-item")
    .filter({
      has: page.getByRole("heading", { name: "Stuffed duck", exact: true }),
    })
    .getByRole("button", { name: "Unpack", exact: true })
    .click();
  await page.waitForSelector("dialog", { state: "detached" });
  assert.equal((await state()).character.inventory["toy-stuffed-duck"], 0);
  await page.waitForFunction(
    () => window.unpackTestScene.homeItemViews.length === 1,
  );
  await page
    .getByRole("button", { name: "Things in my home", exact: true })
    .click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForSelector("dialog", { state: "detached" });
  assert.equal(
    (await state()).homes[0].homeItems["shelf-left"],
    "toy-stuffed-duck",
  );
  await page.getByRole("button", { name: "My bag" }).click();
  await page.getByLabel("Unpack onto…").selectOption("table-left");
  await page.getByRole("button", { name: "Unpack", exact: true }).click();
  await page.waitForSelector("dialog", { state: "detached" });
  await page.reload();
  await page.waitForSelector("canvas");
  await observeScene();
  await page.waitForFunction(
    () => window.unpackTestScene.homeItemViews.length === 2,
  );
  await page.screenshot({
    path: "/tmp/our-world-unpacked.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Things in my home", exact: true })
    .click();
  await page.screenshot({
    path: "/tmp/our-world-unpacked-menu.png",
    fullPage: true,
  });
  assert.equal(
    await page
      .locator("dialog")
      .evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth),
    false,
  );
  await page
    .locator(".shop-item")
    .filter({
      has: page.getByRole("heading", { name: "Stuffed duck", exact: true }),
    })
    .getByRole("button", { name: "Put back in backpack", exact: true })
    .click();
  assert.equal((await state()).character.inventory["toy-stuffed-duck"], 1);
  assert.equal((await state()).homes[0].homeItems["shelf-left"], undefined);
  assert.equal(
    (await state()).homes[0].homeItems["table-left"],
    "icecream-chocolate",
  );
  assert.equal((await state()).character.balance, 50);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: unpack toys and treats, render and save items, play outside backpack, pack back, preserve counts and coins, phone layout, no page errors.",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/unpack-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
