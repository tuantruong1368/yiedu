import { test, expect } from "@playwright/test";
test("published content survives client navigation, administration and browser history", async ({
  page,
}) => {
  page.setDefaultTimeout(12000);
  const stamp = Date.now(),
    slug = `render-${stamp}`,
    headers = { origin: "http://localhost:3000" };
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        data: {
          name: "Render owner",
          email: `render-${stamp}@example.com`,
          password: "render-strong-password",
        },
      })
    ).status(),
  ).toBe(201);
  const w = await (
    await page.request.post("/api/v1/workspaces", {
      headers,
      data: {
        name: "Render School",
        slug,
        template_id: "yirobot",
        include_sample_content: false,
      },
    })
  ).json();
  const published = await page.request.post(
    `/api/v1/workspaces/${w.id}/publish`,
    { headers },
  );
  expect(published.status()).toBe(200);
  await page.goto(`/t/${slug}`);
  const frame = page.frameLocator("iframe.tenant-canvas");
  await expect(frame.locator(".robot-core")).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await page
      .locator(".site-nav")
      .getByRole("link", { name: "Chương trình", exact: true })
      .click();
    await expect(
      frame.getByRole("heading", { name: "Chương trình học", exact: true }),
    ).toBeVisible();
    await page.locator(".tenant-brand").first().click();
    await expect(frame.locator(".robot-core")).toBeVisible();
    await page
      .getByRole("link", { name: "Quản trị hệ thống ↗", exact: true })
      .click();
    await expect(page).toHaveURL(`/t/${slug}/administrator`);
    await page.locator(".tenant-brand").first().click();
    await expect(frame.locator(".robot-core")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(`/t/${slug}/administrator`);
    await page.goForward();
    await expect(frame.locator(".robot-core")).toBeVisible();
  }
  await page.getByLabel("Language / Ngôn ngữ").selectOption("en");
  await expect(
    frame.getByRole("link", { name: "Explore programs ↗" }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(frame.locator(".robot-core")).toBeVisible();
  await page.screenshot({
    path: "../.build/screenshots/site-return-regression.png",
    fullPage: true,
  });
});
