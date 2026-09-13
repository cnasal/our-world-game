import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.GAME_TEST_URL ?? "http://localhost:5175";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(`${base}/?preview`);
  await page.waitForSelector("canvas");
  await page.getByRole("button", { name: "Edit character" }).click();
  await page.getByLabel("What should we call you?").fill("");
  await page.getByLabel("What should we call you?").pressSequentially("Daisy");
  assert.equal(
    await page.getByLabel("What should we call you?").inputValue(),
    "Daisy",
  );
  await page
    .getByRole("button", { name: "Avatar color #8c95cc", exact: true })
    .click();
  await page.getByRole("button", { name: "That’s me!" }).click();
  await page.waitForSelector("dialog", { state: "detached" });
  assert.match(await page.locator(".profile-top").innerText(), /Daisy/);
  await page.getByRole("button", { name: "Let’s help out" }).click();
  await page
    .getByRole("button", { name: "I’ll take the parcel" })
    .waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "I’ll take the parcel" }).click();
  await page.getByRole("button", { name: "Take it to the café" }).click();
  await page
    .getByRole("button", { name: "Deliver · +15" })
    .waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Deliver · +15" }).click();
  assert.match(await page.locator(".profile-bottom").innerText(), /65/);
  await page.getByRole("button", { name: "8 Buy" }).click();
  assert.match(await page.locator(".profile-bottom").innerText(), /57/);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "My bag" }).click();
  await page.getByRole("button", { name: "Enjoy", exact: true }).click();
  assert.match(
    await page.locator("dialog").innerText(),
    /A little room for lovely things/,
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "My home", exact: true }).click();
  await page.getByRole("heading", { name: "Daisy’s home" }).waitFor();
  await page.screenshot({ path: "/tmp/our-world-home.png", fullPage: true });
  await page.getByRole("button", { name: "Back to town", exact: true }).click();
  await page.reload();
  await page.waitForSelector("canvas");
  assert.match(await page.locator(".profile-top").innerText(), /Daisy/);
  assert.match(await page.locator(".profile-bottom").innerText(), /57/);
  await page.screenshot({ path: "/tmp/our-world-desktop.png", fullPage: true });
  for (const [name, width, height] of [
    ["ipad", 834, 1112],
    ["phone", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(250);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${name}: no horizontal overflow`,
    );
    await page.getByRole("button", { name: "Neighbors", exact: true }).click();
    await page
      .locator(".neighbor-row")
      .nth(1)
      .getByRole("button", { name: "Visit" })
      .click();
    await page.getByRole("heading", { name: "Neighbor 2’s home" }).waitFor();
    await page
      .getByRole("button", { name: "Back to town", exact: true })
      .click();
    await page.screenshot({
      path: `/tmp/our-world-${name}.png`,
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: editable profile, path navigation, delivery, purchase, consumption, home visits, saved progress, tablet/phone layout, no page errors.",
  );
  await page.goto(base);
  await page
    .getByRole("button", { name: "Open the garden gate" })
    .waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Open the garden gate" }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/our-world-signin.png", fullPage: true });
  console.log(
    "Clerk sign-in rendered:",
    await page.locator(".cl-signIn-root").count(),
  );
} finally {
  await browser.close();
}
