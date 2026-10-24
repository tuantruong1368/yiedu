import { test, expect } from "@playwright/test";
test("signed-in template opens studio; bilingual HTML import, pages, events and tenant branding persist", async ({
  page,
}) => {
  const stamp = Date.now();
  const signup = await page.request.post("/api/v1/auth/register", {
    data: {
      email: `studio-${stamp}@example.com`,
      password: "studio-strong-password",
      name: "Studio owner",
    },
  });
  expect(signup.status()).toBe(201);
  await page.goto("/");
  await page.locator(".template-select").first().click();
  await expect(page).toHaveURL(/\/builder\//);
  await expect(page.locator(".gjs-frame")).toBeVisible();
  await page
    .getByRole("button", { name: "Nhập HTML/CSS", exact: true })
    .click();
  await page
    .getByLabel("HTML import")
    .fill(
      '<section><h1>Imported school</h1><button data-event="click" data-action="message" data-message="Event works">Try event</button><img src="x" onerror="alert(1)"><script>window.BAD=true</script></section>',
    );
  await page
    .getByLabel("CSS import")
    .fill("section{padding:40px}h1{color:#215d4c}button{padding:20px}");
  await page.getByRole("button", { name: "Phân tích thành template" }).click();
  await expect(
    page
      .frameLocator(".gjs-frame")
      .getByRole("heading", { name: "Imported school" }),
  ).toBeVisible();
  await page
    .frameLocator(".gjs-frame")
    .getByRole("button", { name: "Try event" })
    .click();
  await expect(page.getByLabel("Event", { exact: true })).toHaveValue("click");
  await page.getByLabel("Vị trí", { exact: true }).selectOption("absolute");
  await expect(
    page.frameLocator(".gjs-frame").getByRole("button", { name: "Try event" }),
  ).toHaveCSS("position", "absolute");
  const width = page.locator(".gjs-sm-property__width input").first();
  await width.fill("260");
  await width.press("Tab");
  await expect(
    page.frameLocator(".gjs-frame").getByRole("button", { name: "Try event" }),
  ).toHaveCSS("width", "260px");
  const beforeZoom = Number(
    (await page.locator(".studio-toolbar>span").textContent())!.replace(
      "%",
      "",
    ),
  );
  await page
    .locator(".studio-toolbar")
    .getByRole("button", { name: "+", exact: true })
    .click();
  await expect(page.locator(".studio-toolbar>span")).toHaveText(
    `${Math.min(200, beforeZoom + 10)}%`,
  );
  await page.getByRole("button", { name: "Trang/Menu/Logo" }).click();
  await page.getByLabel("Chữ thương hiệu / tạo logo").fill("My School");
  await page.getByRole("button", { name: "Thêm trang", exact: false }).click();
  await page.getByLabel("Tiêu đề trang").fill("Giới thiệu");
  await page.getByLabel("Slug", { exact: true }).fill("custom-about");
  await page.getByLabel("Menu 1").fill("Giới thiệu");
  await page.getByLabel("Page", { exact: true }).selectOption("home");
  await page.getByLabel("Content language").selectOption("en");
  await page
    .getByRole("button", { name: "Nhập HTML/CSS", exact: true })
    .click();
  await page
    .getByLabel("HTML import")
    .fill(
      '<section><h1>English school</h1><button data-event="click" data-action="message" data-message="Event works">Try event</button></section>',
    );
  await page.getByRole("button", { name: "Phân tích thành template" }).click();
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Đã xuất bản" }),
  ).toBeVisible();
  await page.screenshot({
    path: "../.build/screenshots/studio-desktop.png",
    fullPage: true,
  });
  const href = await page
    .getByRole("link", { name: /Xem trang/ })
    .getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page.locator(".tenant-brand")).toContainText("My School");
  await expect(
    page
      .frameLocator("iframe.tenant-canvas")
      .getByRole("heading", { name: "Imported school" }),
  ).toBeVisible();
  await page.getByLabel("Language / Ngôn ngữ").selectOption("en");
  await expect(
    page
      .frameLocator("iframe.tenant-canvas")
      .getByRole("heading", { name: "English school" }),
  ).toBeVisible();
  await page
    .frameLocator("iframe.tenant-canvas")
    .getByRole("button", { name: "Try event" })
    .click();
  await expect(
    page.frameLocator("iframe.tenant-canvas").getByRole("status"),
  ).toHaveText("Event works");
  await page.goto(href + "/p/about");
  await expect(page.locator("iframe.tenant-canvas")).toBeVisible();
  await page.goto(href + "/administrator");
  await expect(
    page.getByRole("heading", { name: "Overview.", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /YiEdu/ })).toHaveCount(0);
  await expect(page).not.toHaveTitle(/YiEdu/);
  await expect(page.locator(".tenant-brand")).toContainText("My School");
  await page.screenshot({
    path: "../.build/screenshots/admin-english.png",
    fullPage: true,
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Create your own/, level: 1 }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Create your own/, level: 1 }),
  ).toBeVisible();
});
