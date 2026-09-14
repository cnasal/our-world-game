import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.GAME_TEST_URL ?? "http://localhost:5175";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const standButton = page
  .getByRole("navigation", { name: "Places to rest" })
  .getByRole("button", { name: "Stand up", exact: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
async function restAt(name, id) {
  await page.getByRole("button", { name, exact: true }).click();
  await standButton.waitFor({ timeout: 15000 });
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("our-world-preview-v1")),
  );
  assert.equal(saved.character.restId, id);
}
async function standUp() {
  await standButton.click();
  await standButton.waitFor({ state: "detached" });
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("our-world-preview-v1")).character
          .restId,
    ),
    undefined,
  );
}
try {
  await page.goto(`${base}/?preview`);
  await page.waitForSelector("canvas");
  const firstBuild = await page
    .locator(".build-version")
    .getAttribute("datetime");
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
    .getByRole("button", { name: "Pick up a package", exact: true })
    .waitFor({ timeout: 15000 });
  assert.equal(await page.locator("dialog").count(), 0);
  await page.screenshot({
    path: "/tmp/our-world-post-inside.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Pick up a package", exact: true })
    .click();
  await page
    .getByRole("button", { name: "I’ll take the parcel" })
    .waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "I’ll take the parcel" }).click();
  await page.getByRole("button", { name: "Take it to the café" }).click();
  await page
    .getByRole("button", { name: "Order drinks", exact: true })
    .waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Order drinks", exact: true }).click();
  await page
    .getByRole("heading", { name: "Something lovely to sip", exact: true })
    .waitFor({ timeout: 10000 });
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
  await page.getByRole("button", { name: /The Nasal Restaurant/ }).click();
  await page
    .getByRole("button", { name: "Order food", exact: true })
    .waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Order food", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "The Nasal Restaurant",
      exact: true,
      level: 2,
    })
    .waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "10 Buy", exact: true }).click();
  assert.match(await page.locator(".profile-bottom").innerText(), /47/);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page.waitForSelector("canvas");
  await page.getByRole("button", { name: "My bag" }).click();
  await page.getByRole("heading", { name: "Pizza" }).waitFor();
  await page.getByRole("button", { name: "Enjoy", exact: true }).click();
  assert.match(
    await page.locator("dialog").innerText(),
    /A little room for lovely things/,
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Our town", exact: true }).click();
  await restAt("Sit on café chair (left)", "cafe-chair-left");
  await standUp();
  await page.getByRole("button", { name: /The Nasal Library/ }).click();
  await page
    .getByRole("button", { name: "Choose a book", exact: true })
    .waitFor({ timeout: 15000 });
  await page
    .getByRole("button", { name: "Choose a book", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Read The Dragon Who Sneezed", exact: true })
    .waitFor({ timeout: 15000 });
  await page
    .getByRole("button", { name: "Read The Dragon Who Sneezed", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Previous", exact: true })
      .isDisabled(),
    true,
  );
  assert.match(await page.locator(".story-page").innerText(), /tickly nose/);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  assert.match(await page.locator(".story-page").innerText(), /three bubbles/);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  assert.match(await page.locator(".story-page").innerText(), /tickly nose/);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  assert.match(await page.locator("dialog").innerText(), /The end!/);
  await page
    .getByRole("button", { name: "Choose another book", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Read The Moon Garden", exact: true })
    .click();
  assert.match(await page.locator(".story-page").innerText(), /silver seed/);
  assert.match(await page.locator(".profile-bottom").innerText(), /47/);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: /The Nasal School/ }).click();
  await page
    .getByRole("heading", { name: /The Nasal School/ })
    .waitFor({ timeout: 20000 });
  assert.equal(await page.locator("dialog").count(), 0);
  await page.getByRole("button", { name: "Math desk", exact: true }).click();
  await page
    .getByRole("button", { name: "4", exact: true })
    .waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "4", exact: true }).click();
  assert.match(
    await page.locator(".school-feedback").innerText(),
    /Have another go!/,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .count(),
    0,
  );
  for (const [index, answer] of ["5", "8", "4"].entries()) {
    await page.getByRole("button", { name: answer, exact: true }).click();
    assert.match(
      await page.locator(".school-feedback").innerText(),
      /That's right!/,
    );
    await page
      .getByRole("button", {
        name: index === 2 ? "Finish lesson" : "Next question",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("heading", { name: "You finished Number fun!" })
    .waitFor();
  await page
    .getByRole("button", { name: "Choose another lesson", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Try Reading fun", exact: true })
    .click();
  await page.getByRole("button", { name: "Hat", exact: true }).click();
  assert.match(
    await page.locator(".school-feedback").innerText(),
    /That's right!/,
  );
  await page
    .getByRole("button", { name: "Back to lessons", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Try Number fun", exact: true })
    .click();
  assert.match(await page.locator(".school-question").innerText(), /3 apples/);
  assert.match(await page.locator(".profile-bottom").innerText(), /47/);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "History desk", exact: true }).click();
  await page
    .getByRole("button", { name: "Their old diary", exact: true })
    .waitFor({ timeout: 10000 });
  await page
    .getByRole("button", { name: "Their old diary", exact: true })
    .click();
  assert.match(
    await page.locator(".school-feedback").innerText(),
    /That's right!/,
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Reading desk", exact: true }).click();
  await page
    .getByRole("button", { name: "Hat", exact: true })
    .waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Hat", exact: true }).click();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page.getByRole("button", { name: "Rainy", exact: true }).click();
  assert.match(
    await page.locator(".school-feedback").innerText(),
    /That's right!/,
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await restAt("Sit on reading chair", "chair-words");
  await page.screenshot({
    path: "/tmp/our-world-sitting-school.png",
    fullPage: true,
  });
  await standUp();
  await page.screenshot({
    path: "/tmp/our-world-classroom.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Back to town", exact: true }).click();
  assert.equal(
    await page.getByRole("navigation", { name: "Classroom desks" }).count(),
    0,
  );
  await page.getByRole("button", { name: "My home", exact: true }).click();
  await page.getByRole("heading", { name: "Daisy’s home" }).waitFor();
  await restAt("Sit on sofa", "sofa");
  await page.screenshot({
    path: "/tmp/our-world-sitting-home.png",
    fullPage: true,
  });
  await standUp();
  await restAt("Lie on bed", "bed");
  await page.screenshot({
    path: "/tmp/our-world-resting-bed.png",
    fullPage: true,
  });
  await page.reload();
  await page.waitForSelector("canvas");
  await standButton.waitFor();
  await page.keyboard.press("ArrowLeft");
  await standButton.waitFor({ state: "detached" });
  await restAt("Sit on comfy chair", "home-chair");
  await standUp();
  await page.screenshot({ path: "/tmp/our-world-home.png", fullPage: true });
  await page.getByRole("button", { name: "Back to town", exact: true }).click();
  await page.reload();
  await page.waitForSelector("canvas");
  assert.match(await page.locator(".profile-top").innerText(), /Daisy/);
  assert.match(await page.locator(".profile-bottom").innerText(), /47/);
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
    await restAt("Lie on bed", "bed");
    await standUp();
    await page
      .getByRole("button", { name: "Back to town", exact: true })
      .click();
    await page.getByRole("button", { name: /The Nasal Library/ }).click();
    await page
      .getByRole("button", { name: "Choose a book", exact: true })
      .waitFor({ timeout: 15000 });
    await page
      .getByRole("button", { name: "Choose a book", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Read The Missing Sock", exact: true })
      .waitFor({ timeout: 15000 });
    await page
      .getByRole("button", { name: "Read The Missing Sock", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.equal(
      await page
        .locator("dialog")
        .evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth),
      false,
    );
    await page.screenshot({
      path: `/tmp/our-world-library-${name}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.getByRole("button", { name: /The Nasal School/ }).click();
    await page
      .getByRole("heading", { name: /The Nasal School/ })
      .waitFor({ timeout: 20000 });
    await page
      .getByRole("button", { name: "Nature desk", exact: true })
      .click();
    await page
      .getByRole("button", { name: "A butterfly or moth", exact: true })
      .waitFor({ timeout: 10000 });
    await page
      .getByRole("button", { name: "A butterfly or moth", exact: true })
      .click();
    assert.match(
      await page.locator(".school-feedback").innerText(),
      /That's right!/,
    );
    assert.equal(
      await page
        .locator("dialog")
        .evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth),
      false,
    );
    await page.screenshot({
      path: `/tmp/our-world-school-${name}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.screenshot({
      path: `/tmp/our-world-${name}.png`,
      fullPage: true,
    });
  }
  const stamp = await page.locator(".build-version").innerText();
  assert.equal(
    await page.locator(".build-version").getAttribute("datetime"),
    firstBuild,
  );
  assert.match(stamp, /Built \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC/);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: editable profile, path navigation, delivery, café and restaurant purchases, saved meals, consumption, library navigation and reading, school entry, classroom walking, hints, lessons and exit, sitting and lying down, standing and saved poses, home visits, saved progress, tablet/phone layout, no page errors.",
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
