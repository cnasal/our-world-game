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
async function observeScene() {
  await page.waitForFunction(() => {
    const host = document.querySelector(".game-canvas");
    let fiber =
      host[Object.keys(host).find((key) => key.startsWith("__reactFiber"))];
    while (fiber) {
      if (fiber.memoizedProps?.sceneRef?.current) {
        window.costumeScene = fiber.memoizedProps.sceneRef.current;
        return Boolean(window.costumeScene.avatar);
      }
      fiber = fiber.return;
    }
    return false;
  });
}
const openWardrobe = () =>
  page.getByRole("button", { name: "My outfits", exact: true }).click();
async function wear(name, id) {
  await openWardrobe();
  await page
    .locator("dialog .shop-item")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })
    .getByRole("button", { name: "Wear", exact: true })
    .click();
  await page.waitForSelector("dialog", { state: "detached" });
  await page.waitForFunction(
    (id) => window.costumeScene.avatar.getData("outfitId") === id,
    id,
  );
  assert.equal((await state()).character.outfitId, id);
}
try {
  await page.goto(
    `${process.env.GAME_TEST_URL ?? "http://localhost:5176"}/?preview`,
  );
  await page.waitForSelector("canvas");
  await observeScene();
  await page.getByRole("button", { name: /Fancy Dress Boutique/ }).click();
  await page
    .getByRole("heading", { name: "Fancy Dress Boutique", level: 1 })
    .waitFor({ timeout: 30000 });
  assert.equal((await state()).character.room, "shop:costumes");
  await page
    .getByRole("button", { name: "Choose a fancy dress", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Fancy Dress Boutique", level: 2 })
    .waitFor();
  for (const name of [
    "Pink party dress",
    "Yellow sunshine dress",
    "Blue ballroom dress",
  ]) {
    const row = page
      .locator("dialog .shop-item")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await row.getByRole("button", { name: "15 Buy", exact: true }).click();
    assert.equal(
      await row
        .getByRole("button", { name: "15 Owned", exact: true })
        .isDisabled(),
      true,
    );
  }
  assert.equal((await state()).character.balance, 5);
  await page.screenshot({
    path: "/tmp/our-world-costume-shop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Close dialog" }).click();
  await wear("Pink party dress", "dress-pink");
  await page.screenshot({
    path: "/tmp/our-world-pink-dress.png",
    fullPage: true,
  });
  await page.reload();
  await page.waitForSelector("canvas");
  await observeScene();
  await page.waitForFunction(
    () => window.costumeScene.avatar.getData("outfitId") === "dress-pink",
  );
  await wear("Yellow sunshine dress", "dress-yellow");
  await page.getByRole("button", { name: "My home", exact: true }).click();
  await page.getByRole("button", { name: "Sit on sofa", exact: true }).click();
  const stand = page
    .getByRole("navigation", { name: "Places to rest" })
    .getByRole("button", { name: "Stand up", exact: true });
  await stand.waitFor({ timeout: 15000 });
  const before = await page.evaluate(() => ({
    x: window.costumeScene.avatar.x,
    y: window.costumeScene.avatar.y,
  }));
  await wear("Blue ballroom dress", "dress-blue");
  assert.equal((await state()).character.restId, "sofa");
  assert.deepEqual(
    await page.evaluate(() => ({
      x: window.costumeScene.avatar.x,
      y: window.costumeScene.avatar.y,
    })),
    before,
  );
  await stand.click();
  await page.setViewportSize({ width: 390, height: 844 });
  await openWardrobe();
  assert.equal(
    await page
      .locator("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
    true,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: "/tmp/our-world-outfits-phone.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Wear everyday clothes", exact: true })
    .click();
  await page.waitForSelector("dialog", { state: "detached" });
  await page.waitForFunction(
    () => !window.costumeScene.avatar.getData("outfitId"),
  );
  const saved = await state();
  assert.equal(saved.character.balance, 5);
  assert.equal(saved.character.outfitId, undefined);
  for (const id of ["dress-pink", "dress-yellow", "dress-blue"])
    assert.equal(saved.character.inventory[id], 1);
  // Render another member's dress using the same room subscription shape as live play.
  await page.evaluate(() => {
    const scene = window.costumeScene;
    scene.sync(scene.current, [
      {
        id: "dress-visitor",
        name: "Dress friend",
        color: "#8c95cc",
        outfitId: "dress-pink",
        room: scene.current.character.room,
        x: 720,
        y: 620,
        updatedAt: Date.now(),
      },
    ]);
  });
  assert.equal(
    await page.evaluate(() =>
      window.costumeScene.others.get("dress-visitor").view.getData("outfitId"),
    ),
    "dress-pink",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: boutique entry, three purchases, no duplicate purchase, wearing all dress colors, reload, room travel, changing while seated, everyday clothes, shared outfit rendering, mobile layout.",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/costume-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
