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
  await page.getByRole("button", { name: /Little Bloom Garden Shop/ }).click();
  await page
    .getByRole("heading", { name: "Little Bloom Garden Shop", level: 1 })
    .waitFor({ timeout: 30000 });
  await page
    .getByRole("button", { name: "Choose seed pots", exact: true })
    .click();
  await page.locator(".shop-item").first().getByRole("button").click();
  assert.equal((await state()).character.balance, 45);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "My home", exact: true }).click();
  await page.getByRole("button", { name: /My bag/ }).click();
  await page.getByLabel("Unpack onto…").selectOption("shelf-left");
  await page.getByRole("button", { name: "Unpack", exact: true }).click();
  await page.waitForSelector("dialog", { state: "detached" });
  await page
    .getByRole("button", { name: "Pick up items", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Water and grow", exact: true })
    .click();
  await page.waitForSelector("dialog", { state: "detached" });
  const saved = await state();
  assert.equal(
    saved.homes.find((h) => h.id === saved.character.id).homeItems[
      "shelf-left"
    ],
    "flower-sunflower",
  );
  assert.equal(saved.character.inventory["seed-sunflower"], 0);
  await page.reload();
  await page.waitForSelector("canvas");
  await page
    .getByRole("button", { name: "Pick up items", exact: true })
    .click();
  await page.getByRole("heading", { name: "Sunflower", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Water and grow" }).count(),
    0,
  );
  await page.getByRole("button", { name: "Pick up", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: /My bag/ }).click();
  await page.getByRole("button", { name: "Admire", exact: true }).click();
  assert.equal((await state()).character.inventory["flower-sunflower"], 1);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({ path: "/tmp/our-world-garden.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: garden entry, purchase, planting, watering, saved flower, picking up, admiration, and phone layout.",
  );
} finally {
  await browser.close();
}
