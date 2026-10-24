import { test, expect } from "@playwright/test";
test("website design library, preview, themes and published CSS survive reopening", async ({
  page,
}) => {
  page.setDefaultTimeout(15000);
  const stamp = Date.now(),
    headers = { origin: "http://localhost:3000" };
  await page.request.post("/api/v1/auth/register", {
    data: {
      name: "Designer",
      email: `designer-${stamp}@example.com`,
      password: "designer-strong-password",
    },
  });
  const w = await (
    await page.request.post("/api/v1/workspaces", {
      headers,
      data: {
        name: "Designer School",
        slug: `designer-${stamp}`,
        template_id: "yirobot",
        include_sample_content: false,
      },
    })
  ).json();
  await page.goto(`/builder/${w.id}`);
  await expect(page.locator(".gjs-frame")).toBeVisible();
  await expect(page.locator(".gadget-tile")).toHaveCount(23);
  await expect(page.locator(".gadget-miniature")).toHaveCount(23);
  const buttonBlock = page
    .locator(".gadget-tile")
    .filter({ hasText: "Nút bấm" })
    .locator(".gadget-drag-preview");
  await buttonBlock.dragTo(
    page.frameLocator(".gjs-frame").locator(".wrap").first(),
  );
  await expect(
    page.frameLocator(".gjs-frame").locator('[data-gadget="yiedu.button"]'),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Bố cục mẫu", exact: true }).click();
  await expect(page.locator(".gadget-tile")).toHaveCount(8);
  await page.getByLabel("Tìm gadget", { exact: true }).fill("Hero");
  await expect(page.locator(".gadget-tile")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Thêm Hero hai cột", exact: true })
    .click();
  await expect(
    page.frameLocator(".gjs-frame").locator('[data-gadget="yiedu.hero-split"]'),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Giao diện", exact: true }).click();
  await page.getByRole("button", { name: /Indigo/ }).click();
  await expect(
    page.frameLocator(".gjs-frame").locator(".button").first(),
  ).toHaveCSS("background-color", "rgb(86, 94, 183)");

  await page.getByRole("button", { name: "Xem trước", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Xem trước website" }),
  ).toBeVisible();
  await expect(
    page.frameLocator(".website-preview-content iframe").locator(".robot-core"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Đã xuất bản" }),
  ).toBeVisible();
  const saved = await (
    await page.request.get(`/api/v1/workspaces/${w.id}`)
  ).json();
  expect(saved.data.pages[0].vi.css).toContain("--accent");
  await page.reload();
  await expect(
    page.frameLocator(".gjs-frame").locator('[data-gadget="yiedu.hero-split"]'),
  ).toHaveCount(1);
  await expect(
    page.frameLocator(".gjs-frame").locator(".button").first(),
  ).toHaveCSS("background-color", "rgb(86, 94, 183)");
  await page.screenshot({
    path: "../.build/screenshots/website-studio-library.png",
    fullPage: true,
  });
  await page.goto(`/t/${w.slug}`);
  await expect(
    page.frameLocator("iframe.tenant-canvas").locator(".robot-core"),
  ).toBeVisible();
  await expect(
    page
      .frameLocator("iframe.tenant-canvas")
      .locator('[data-gadget="yiedu.hero-split"]'),
  ).toHaveCount(1);
  await expect(
    page.frameLocator("iframe.tenant-canvas").locator(".button").first(),
  ).toHaveCSS("background-color", "rgb(86, 94, 183)");
});

test("long course lists keep lesson editing visible and retain course context", async ({
  page,
}) => {
  page.setDefaultTimeout(15000);
  test.setTimeout(120000);
  const stamp = Date.now(),
    slug = `lessons-${stamp}`,
    headers = { origin: "http://localhost:3000" };
  await page.request.post("/api/v1/auth/register", {
    data: {
      name: "Teacher",
      email: `teacher-${stamp}@example.com`,
      password: "teacher-strong-password",
    },
  });
  const w = await (
    await page.request.post("/api/v1/workspaces", {
      headers,
      data: {
        name: "Course School",
        slug,
        template_id: "academy",
        include_sample_content: false,
      },
    })
  ).json();
  const published = await (
      await page.request.post(`/api/v1/workspaces/${w.id}/publish`, { headers })
    ).json(),
    base = `/api/v1/runtime/${published.tenant.id}`;
  let target: any;
  for (let i = 0; i < 30; i++) {
    const response = await page.request.post(base + "/courses", {
      headers,
      data: {
        title: `Course ${String(i).padStart(2, "0")}`,
        slug: `course-${i}`,
        published: true,
      },
    });
    expect(response.status()).toBe(201);
    target = await response.json();
  }
  for (let i = 0; i < 25; i++)
    expect(
      (
        await page.request.post(`${base}/courses/${target.id}/lessons`, {
          headers,
          data: {
            title: `Lesson ${String(i).padStart(2, "0")}`,
            content: `Original content ${i}`,
            position: i,
          },
        })
      ).status(),
    ).toBe(201);
  await page.goto(`/t/${slug}/administrator?tab=courses`);
  await page.locator(".cw-course").filter({ hasText: "Course 29" }).click();
  await page
    .locator(".cw-lesson-select")
    .filter({ hasText: "Lesson 24" })
    .click();
  await expect(
    page.locator('.lesson-workbench input[name="title"]'),
  ).toHaveValue("Lesson 24");
  expect(
    (await page.locator(".lesson-workbench-header").boundingBox())!.y,
  ).toBeLessThan(250);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(150);
  await page
    .getByRole("textbox", { name: "Nội dung", exact: true })
    .fill("Updated without scrolling past courses");
  await page.locator('.lesson-workbench input[name="title"]').press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "Đã lưu bài học" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/administrator\?tab=courses/);
  await page
    .locator(".lesson-browser")
    .getByRole("button", { name: "Thêm bài học", exact: true })
    .click();
  await page
    .getByLabel("Tiêu đề", { exact: true })
    .fill("A new lesson in the same course");
  await page
    .getByRole("textbox", { name: "Nội dung", exact: true })
    .fill("Preserved in full-page Studio");
  await page
    .getByRole("button", { name: "Mở Studio toàn màn hình", exact: true })
    .click();
  await expect(page).toHaveURL(/\/studio\/lesson\//);
  await expect(
    page.getByRole("textbox", { name: "Nội dung", exact: true }),
  ).toContainText("Preserved in full-page Studio");
  await page.getByRole("link", { name: "Quản trị", exact: true }).click();
  await expect(
    page.locator('.lesson-workbench input[name="title"]'),
  ).toHaveValue("A new lesson in the same course");
  await expect(page.locator(".cw-course.active")).toContainText("Course 29");
  await page.screenshot({
    path: "../.build/screenshots/course-lesson-workspace.png",
    fullPage: true,
  });
});
