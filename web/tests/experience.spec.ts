import { test, expect, Page } from "@playwright/test";
import { galleryReturnURL, tenantReturnURL } from "../lib/navigation";

async function makeSite(page: Page, template = "academy", samples = false) {
  const stamp = Date.now(),
    slug = `experience-${stamp}`,
    headers = { origin: "http://localhost:3000" };
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        headers,
        data: {
          name: "Experience owner",
          email: `experience-${stamp}@example.com`,
          password: "experience-strong-password",
        },
      })
    ).status(),
  ).toBe(201);
  const response = await page.request.post("/api/v1/workspaces", {
    headers,
    data: {
      name: "Experience School",
      slug,
      template_id: template,
      include_sample_content: samples,
    },
  });
  expect(response.status()).toBe(201);
  const workspace = await response.json();
  const published = await page.request.post(
    `/api/v1/workspaces/${workspace.id}/publish`,
    { headers },
  );
  expect(published.status()).toBe(200);
  return {
    slug,
    tenant: (await published.json()).tenant,
    headers,
    email: `experience-${stamp}@example.com`,
  };
}

test("return URLs reject external and cross-tenant destinations", () => {
  for (const value of [
    "https://evil.invalid",
    "//evil.invalid",
    "/t/other/administrator",
    "/t/school/administrator-evil",
    "/t/school/administrator/../learn",
    "/t/school/administrator\\evil",
  ])
    expect(tenantReturnURL("school", value)).toBe(
      "/t/school/administrator?tab=studio",
    );
  expect(
    tenantReturnURL(
      "school",
      "/t/school/administrator?tab=studio&studio_kind=video",
    ),
  ).toContain("studio_kind=video");
  expect(galleryReturnURL("//evil.invalid")).toBe("/#templates");
  expect(galleryReturnURL("/?group=wellness&q=yoga&unknown=value")).toBe(
    "/?group=wellness&q=yoga#templates",
  );
});

test("template groups, soft hover and faithful Yoga preview retain the gallery context", async ({
  page,
}) => {
  page.setDefaultTimeout(15000);
  await page.goto("/");
  await expect(page.locator(".template-group")).toHaveCount(8);
  await page.getByRole("button", { name: /Robotics & STEM/ }).click();
  await expect(page.locator(".template-card")).toHaveCount(3);
  await page.getByRole("button", { name: /AI & Dữ liệu/ }).click();
  await expect(page.locator(".template-card")).toHaveCount(1);
  await page.getByRole("button", { name: /Yoga & Sống khỏe/ }).click();
  await page.getByRole("searchbox").fill("an nhien");
  const card = page.locator(".template-card");
  await expect(card).toHaveCount(1);
  await card.hover();
  await expect(card.locator(".template-card-peek")).toHaveCSS("opacity", "1");
  await page
    .locator("#templates")
    .screenshot({ path: "../.build/screenshots/template-groups-yoga.png" });
  await card.getByRole("link", { name: "Xem website và bài học ↗" }).click();
  await expect(page.locator(".site-nav .tenant-brand")).toContainText(
    "An Nhiên Yoga",
  );
  await expect(page.locator(".site-nav .tenant-logo-mark")).toHaveCount(1);
  const frame = page.frameLocator("iframe.tenant-canvas");
  await expect(frame.locator(".y-art img")).toBeVisible();
  await expect
    .poll(() =>
      frame
        .locator(".y-art img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.evaluate(() => {
    (window as any).__experienceMarker = "still-here";
  });
  await page.screenshot({
    path: "../.build/screenshots/yoga-template-preview.png",
    fullPage: true,
  });
  await page
    .locator(".site-nav")
    .getByRole("link", { name: "Khóa học", exact: true })
    .click();
  await expect(frame.locator(".yd-course")).toHaveCount(4);
  for (const label of [
    "Lộ trình 4 tuần",
    "Nhật ký thực hành",
    "Về chúng tôi",
    "Trang chủ",
  ]) {
    await page
      .locator(".site-nav")
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(frame.locator(".yoga-academy")).toBeVisible();
  }
  expect(await page.evaluate(() => (window as any).__experienceMarker)).toBe(
    "still-here",
  );
  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  await page
    .getByRole("button", { name: "Mở menu website", exact: true })
    .click();
  await expect(page.locator(".site-nav nav")).toBeVisible();
  await page
    .locator(".site-nav")
    .getByRole("link", { name: "Khóa học", exact: true })
    .click();
  await expect(frame.locator(".yd-course")).toHaveCount(4);
  await page.locator(".preview-back").click();
  await expect(page).toHaveURL(/group=wellness.*q=an\+nhien/);
  await expect(page.getByRole("searchbox")).toHaveValue("an nhien");
  await expect(page.locator(".template-card")).toHaveCount(1);
});

test("Content Studio stays in the right panel and returns with its filters and single tenant logo", async ({
  page,
}) => {
  page.setDefaultTimeout(15000);
  const { slug, headers, email } = await makeSite(page);
  await page.goto(`/t/${slug}/administrator`);
  await expect(page.locator(".sidebar nav button.active")).toContainText(
    "Tổng quan",
  );
  await page.evaluate(() => {
    (window as any).__experienceMarker = "still-here";
    (window as any).__sidebar = document.querySelector(".sidebar");
  });
  await page.getByRole("button", { name: "Khóa học", exact: true }).click();
  await page
    .getByRole("button", { name: "Studio nội dung", exact: true })
    .click();
  await expect(page.locator(".admin-main .embedded-studio")).toBeVisible();
  await expect(page.locator(".sidebar .tenant-logo-mark")).toHaveCount(1);
  await expect(page.locator(".sidebar .tenant-brand")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.querySelector(".sidebar") === (window as any).__sidebar,
    ),
  ).toBe(true);
  for (const label of ["Tạo slide", "Tạo video", "Tạo mô phỏng"])
    await expect(
      page
        .locator(".studio-tool-grid")
        .getByRole("link", { name: new RegExp(label) }),
    ).toBeVisible();
  await page.goBack();
  await expect(page.locator(".sidebar nav button.active")).toContainText(
    "Khóa học",
  );
  await page.goForward();
  await expect(page.locator(".admin-main .embedded-studio")).toBeVisible();
  await page
    .locator(".studio-kind-tabs")
    .getByRole("button", { name: /Video/ })
    .click();
  await page.getByRole("searchbox", { name: "Tìm dự án" }).fill("New context");
  await expect(page).toHaveURL(/studio_q=New\+context/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "../.build/screenshots/embedded-content-studio.png",
    fullPage: true,
  });
  await page
    .locator(".studio-tool-grid")
    .getByRole("link", { name: /Tạo video/ })
    .click();
  await expect(page.locator(".content-studio")).toBeVisible();
  await page.getByLabel("Tên dự án", { exact: true }).fill("New context video");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page).not.toHaveURL(/\/new(?:\?|$)/);
  await expect(page.getByRole("status")).toContainText("Đã lưu");
  await page
    .getByRole("link", { name: "Quay lại Studio", exact: true })
    .click();
  await expect(page).toHaveURL(
    /tab=studio.*studio_kind=video.*studio_q=New\+context/,
  );
  await expect(page.getByRole("searchbox", { name: "Tìm dự án" })).toHaveValue(
    "New context",
  );
  await expect(page.locator(".studio-project-grid")).toContainText(
    "New context video",
  );
  expect(await page.evaluate(() => (window as any).__experienceMarker)).toBe(
    "still-here",
  );
  await page.reload();
  await expect(page.locator(".sidebar nav button.active")).toContainText(
    "Studio nội dung",
  );
  await expect(page.getByRole("searchbox", { name: "Tìm dự án" })).toHaveValue(
    "New context",
  );
  expect(
    (await page.request.post("/api/v1/auth/logout", { headers })).status(),
  ).toBe(200);
  await page.reload();
  await page.getByRole("link", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/login.*returnTo=/);
  await page.locator('input[name="email"]').fill(email);
  await page
    .locator('input[name="password"]')
    .fill("experience-strong-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(
    /tab=studio.*studio_kind=video.*studio_q=New\+context/,
  );
  await expect(page.locator(".admin-main .embedded-studio")).toBeVisible();
});

test("Yoga learners can study text, load the attributed video on demand and revisit a lesson", async ({
  page,
  browser,
}) => {
  page.setDefaultTimeout(15000);
  const { slug, tenant, headers } = await makeSite(page, "yoga-studio", true);
  const overview = await (
    await page.request.get(`/api/v1/runtime/${tenant.id}/overview`)
  ).json();
  expect(overview.courses).toHaveLength(4);
  expect(overview.lessons).toHaveLength(16);
  const course = overview.courses.find(
    (c: any) => c.curriculum_meta.module_id === "yoga-foundations",
  );
  const context = await browser.newContext(),
    learner = await context.newPage();
  await learner.request.post("/api/v1/auth/register", {
    headers,
    data: {
      name: "Yoga learner",
      email: `yogastudy-${Date.now()}@example.com`,
      password: "yoga-learner-strong-password",
    },
  });
  await learner.goto(`/t/${slug}/learn?course=${course.id}`);
  await learner
    .getByRole("button", { name: "Ghi danh miễn phí", exact: true })
    .click();
  await learner
    .getByRole("button", { name: /01 · Buổi đầu trên thảm/ })
    .click();
  await expect(learner).toHaveURL(/lesson=/);
  await expect(learner.locator(".lesson-content .tiptap")).toContainText(
    "Hướng dẫn thực hành",
  );
  await expect(learner.locator(".external-video iframe")).toHaveCount(0);
  await learner.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body>Provider frame</body></html>",
    }),
  );
  await learner.getByRole("button", { name: /Phát video/ }).click();
  await expect(learner.locator(".external-video iframe")).toHaveAttribute(
    "src",
    /j7rKKpwdXNE/,
  );
  await expect(
    learner.getByRole("link", { name: "Mở video nguồn" }),
  ).toHaveAttribute("href", /youtube\.com\/watch/);
  await learner
    .getByRole("button", { name: "Đánh dấu hoàn thành", exact: true })
    .click();
  await expect(
    learner.getByRole("button", { name: "Đã hoàn thành", exact: true }),
  ).toBeVisible();
  await learner.reload();
  await expect(learner.locator(".lesson-content h1")).toContainText(
    "Buổi đầu trên thảm",
  );
  await learner
    .getByRole("button", { name: "Danh sách khóa học", exact: true })
    .click();
  await expect(learner).toHaveURL(new RegExp(`course=${course.id}$`));
  await learner.screenshot({
    path: "../.build/screenshots/yoga-learner-course.png",
    fullPage: true,
  });
  await context.close();
});
