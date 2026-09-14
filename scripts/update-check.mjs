import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const base = process.env.GAME_TEST_URL ?? "http://localhost:5180";
let mode = "current";
let checks = 0;
try {
  const response = await page.request.get(`${base}/version.json`);
  const current = await response.json();
  assert.ok(Number.isFinite(Date.parse(current.builtAt)));
  await page.route("**/version.json?*", async (route) => {
    checks++;
    if (mode === "offline") return route.abort();
    return route.fulfill({
      contentType: "application/json",
      body:
        mode === "invalid"
          ? "<html>Unavailable</html>"
          : JSON.stringify({
              builtAt:
                mode === "new" ? "2099-01-01T00:00:00.000Z" : current.builtAt,
            }),
    });
  });
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector(".build-version"));
  assert.equal(
    await page.locator(".build-version").getAttribute("datetime"),
    current.builtAt,
  );
  const check = async (next) => {
    mode = next;
    const previous = checks;
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForTimeout(300);
    assert.ok(checks > previous);
  };
  assert.equal(await page.locator(".update-notice").count(), 0);
  await check("offline");
  assert.equal(await page.locator(".update-notice").count(), 0);
  await check("invalid");
  assert.equal(await page.locator(".update-notice").count(), 0);
  await check("new");
  await page.getByRole("button", { name: "Refresh game" }).waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  mode = "current";
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Refresh game" }).click(),
  ]);
  await page.waitForTimeout(300);
  assert.equal(await page.locator(".update-notice").count(), 0);
  console.log(
    "PASS: production version matches footer; current, offline and invalid responses stay quiet; new release shows a mobile-friendly notice; refresh reloads and clears it.",
  );
} finally {
  await browser.close();
}
