import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.GAME_TEST_URL ?? "http://localhost:5176";
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("our-world-preview-v1")));
async function observeScene() {
  await page.waitForFunction(() => {
    const host = document.querySelector(".game-canvas");
    const key = Object.keys(host).find((key) => key.startsWith("__reactFiber"));
    let fiber = host[key];
    while (fiber) {
      if (fiber.memoizedProps?.sceneRef?.current) {
        window.petTestScene = fiber.memoizedProps.sceneRef.current;
        return Boolean(window.petTestScene.avatar);
      }
      fiber = fiber.return;
    }
    return false;
  });
}
async function petPosition() {
  return page.evaluate(() => {
    const scene = window.petTestScene;
    const pet = scene.pets.get(scene.current.character.id);
    return {
      x: pet.view.x,
      y: pet.view.y,
      ownerX: scene.avatar.x,
      ownerY: scene.avatar.y,
      id: pet.petId,
      count: scene.pets.size,
    };
  });
}
try {
  await page.goto(`${base}/?preview`);
  await page.waitForSelector("canvas");
  await observeScene();
  // Fund only this browser's isolated development save.
  await page.evaluate(() => {
    const saved = structuredClone(window.petTestScene.current);
    saved.character.balance = 200;
    localStorage.setItem("our-world-preview-v1", JSON.stringify(saved));
  });
  await page.reload();
  await page.waitForSelector("canvas");
  await observeScene();
  await page.getByRole("button", { name: /The Nasal Animal Shelter/ }).click();
  await page
    .getByRole("heading", { name: /The Nasal Animal Shelter/, level: 1 })
    .waitFor({ timeout: 25000 });
  assert.equal((await state()).character.room, "shop:shelter");
  await page
    .getByRole("navigation", { name: "Shop counter" })
    .getByRole("button", { name: "Meet the pets", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Cat", exact: true })
    .waitFor({ timeout: 15000 });
  assert.equal(
    await page.getByRole("button", { name: "80 Adopt", exact: true }).count(),
    3,
  );
  await page
    .locator(".shop-item")
    .filter({ has: page.getByRole("heading", { name: "Cat", exact: true }) })
    .getByRole("button")
    .click();
  await page.waitForSelector("dialog", { state: "detached" });
  await page.waitForFunction(() => window.petTestScene.pets.size === 1);
  assert.equal((await state()).character.balance, 120);
  assert.equal((await state()).character.petId, "pet-cat");
  assert.deepEqual((await state()).character.inventory, {});
  const before = await petPosition();
  await page
    .getByRole("button", { name: "Sit on left chair", exact: true })
    .click();
  const stand = page
    .getByRole("navigation", { name: "Places to rest" })
    .getByRole("button", { name: "Stand up", exact: true });
  await stand.waitFor({ timeout: 15000 });
  const after = await petPosition();
  assert.ok(
    Math.hypot(after.x - before.x, after.y - before.y) > 45,
    "pet follows the owner's footsteps",
  );
  assert.ok(Math.hypot(after.x - after.ownerX, after.y - after.ownerY) < 150);
  assert.equal((await petPosition()).count, 1);
  await stand.click();
  await page.getByRole("button", { name: /The Nasal School/ }).click();
  await page
    .getByRole("heading", { name: /The Nasal School/, level: 1 })
    .waitFor();
  await page.waitForTimeout(300);
  assert.equal((await petPosition()).id, "pet-cat");
  await page.getByRole("button", { name: "My home", exact: true }).click();
  await page.waitForTimeout(500);
  assert.match((await state()).character.room, /^home:/);
  assert.equal((await petPosition()).id, "pet-cat");
  await page.reload();
  await page.waitForSelector("canvas");
  await observeScene();
  await page.waitForFunction(() => window.petTestScene.pets.size === 1);
  assert.equal((await state()).character.petId, "pet-cat");
  await page.getByRole("button", { name: /The Nasal Animal Shelter/ }).click();
  await page
    .getByRole("heading", { name: /The Nasal Animal Shelter/, level: 1 })
    .waitFor();
  await page
    .getByRole("navigation", { name: "Shop counter" })
    .getByRole("button", { name: "Meet the pets", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Cat", exact: true })
    .waitFor({ timeout: 15000 });
  for (const button of await page
    .getByRole("button", { name: "80 Adopt", exact: true })
    .all())
    assert.equal(await button.isDisabled(), true);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/our-world-shelter.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  // Exercise the other animal drawings and shared companions without changing a live world.
  await page.evaluate(() => {
    const scene = window.petTestScene;
    scene.sync(scene.current, [
      {
        id: "test-dog-owner",
        name: "Dog friend",
        color: "#78a58d",
        petId: "pet-dog",
        room: scene.current.character.room,
        x: 500,
        y: 550,
        updatedAt: Date.now(),
      },
      {
        id: "test-duck-owner",
        name: "Duck friend",
        color: "#8c95cc",
        petId: "pet-duck",
        room: scene.current.character.room,
        x: 930,
        y: 550,
        updatedAt: Date.now(),
      },
    ]);
  });
  await page.waitForFunction(() => window.petTestScene.pets.size === 3);
  await page.screenshot({
    path: "/tmp/our-world-shared-pets.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: shelter entry, 80-coin pets, adoption, one-pet limit, no backpack items, following, chairs, room changes, reload persistence, shared animal drawings, phone layout, no page errors.",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/pet-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
