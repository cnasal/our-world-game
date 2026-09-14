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
async function paint() {
  return page.evaluate(() => {
    const host = document.querySelector(".game-canvas");
    let fiber =
      host[Object.keys(host).find((key) => key.startsWith("__reactFiber"))];
    while (fiber) {
      if (fiber.memoizedProps?.sceneRef?.current)
        return fiber.memoizedProps.sceneRef.current.homePaint;
      fiber = fiber.return;
    }
  });
}
try {
  await page.goto(
    `${process.env.GAME_TEST_URL ?? "http://localhost:5176"}/?preview`,
  );
  await page.waitForSelector("canvas");
  await page.getByRole("button", { name: "My home", exact: true }).click();
  await page
    .getByRole("button", { name: "Decorate my home", exact: true })
    .click();
  await page.getByRole("button", { name: "Sky blue", exact: true }).click();
  await page.getByRole("button", { name: "Walnut wood", exact: true }).click();
  await page.screenshot({
    path: "/tmp/our-world-home-colors-menu.png",
    fullPage: true,
  });
  assert.equal(
    await page
      .locator("dialog")
      .evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth),
    false,
  );
  await page
    .getByRole("button", { name: "Save my colors", exact: true })
    .click();
  await page.waitForSelector("dialog", { state: "detached" });
  assert.equal(await paint(), "#cfe3ef:#ae8a6b");
  assert.equal((await state()).character.balance, 50);
  assert.equal((await state()).homes[0].homeStyle.wallColor, "#cfe3ef");
  await page.getByRole("button", { name: "Lie on bed", exact: true }).click();
  const stand = page
    .getByRole("navigation", { name: "Places to rest" })
    .getByRole("button", { name: "Stand up", exact: true });
  await stand.waitFor({ timeout: 15000 });
  await page
    .getByRole("button", { name: "Decorate my home", exact: true })
    .click();
  await page.getByRole("button", { name: "Lavender", exact: true }).click();
  await page
    .getByRole("button", { name: "Save my colors", exact: true })
    .click();
  await page.waitForSelector("dialog", { state: "detached" });
  assert.equal((await state()).character.restId, "bed");
  assert.equal(await paint(), "#ded5ed:#ae8a6b");
  await page.reload();
  await page.waitForSelector("canvas");
  await page.waitForTimeout(500);
  assert.equal(await paint(), "#ded5ed:#ae8a6b");
  await page.screenshot({
    path: "/tmp/our-world-home-colors.png",
    fullPage: true,
  });
  await stand.click();
  // Visit a neighbor through the same room interaction used by the UI.
  await page.getByRole("button", { name: "Neighbors", exact: true }).click();
  await page
    .locator(".neighbor-row")
    .nth(1)
    .getByRole("button", { name: "Visit", exact: true })
    .click();
  await page.waitForSelector("dialog", { state: "detached" });
  assert.equal(
    await page
      .getByRole("button", { name: "Decorate my home", exact: true })
      .count(),
    0,
  );
  assert.equal(await paint(), "#d9dfc3:#dfbd96");
  await page.getByRole("button", { name: "My home", exact: true }).click();
  await page
    .getByRole("button", { name: "Decorate my home", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Original colors", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  assert.equal(
    await paint(),
    "#ded5ed:#ae8a6b",
    "closing without saving keeps the saved colors",
  );
  await page
    .getByRole("button", { name: "Decorate my home", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Original colors", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save my colors", exact: true })
    .click();
  await page.waitForSelector("dialog", { state: "detached" });
  assert.equal(await paint(), "#d9dfc3:#dfbd96");
  assert.deepEqual(errors, []);
  console.log(
    "PASS: home colors, live repaint while resting, persistence, free changes, neighbor isolation, cancel, original colors, phone layout, no page errors.",
  );
} catch (error) {
  await page.screenshot({
    path: "/tmp/home-colors-failure.png",
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
}
