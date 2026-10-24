import { test, expect } from "@playwright/test";

test("actual template previews, all tenant menus, independent studio tools and learner media", async ({
  page,
  browser,
}) => {
  test.setTimeout(150000);
  page.setDefaultTimeout(15000);
  const stamp = Date.now(),
    slug = `studio-flow-${stamp}`;
  const signup = await page.request.post("/api/v1/auth/register", {
    headers: { origin: "http://localhost:3000" },
    data: {
      name: "Studio owner",
      email: `studio-flow-${stamp}@example.com`,
      password: "studio-strong-password",
    },
  });
  expect(signup.status()).toBe(201);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tạo hệ thống",
  );
  await page.getByRole("searchbox").fill("Yirobot");
  const shot = page.frameLocator(".template-grid iframe");
  await expect(shot.locator(".robot-core")).toBeVisible();
  await expect(shot.locator(".preview-nav")).toContainText("Yirobot");
  await page.locator(".template-grid article").scrollIntoViewIfNeeded();
  await page
    .locator(".template-grid article")
    .screenshot({ path: "../.build/screenshots/template-website-card.png" });
  await page.screenshot({
    path: "../.build/screenshots/home-actual-preview.png",
    fullPage: true,
  });
  const wr = await page.request.post("/api/v1/workspaces", {
      headers: { origin: "http://localhost:3000" },
      data: {
        name: "Studio School",
        slug,
        template_id: "yirobot",
        include_sample_content: false,
      },
    }),
    w = await wr.json();
  expect(wr.status(), JSON.stringify(w)).toBe(201);
  w.data.pages.find((p: any) => p.id === "programs").slug = "training";
  expect(
    (
      await page.request.put(`/api/v1/workspaces/${w.id}`, {
        headers: { origin: "http://localhost:3000" },
        data: { name: w.name, slug, revision: w.revision, data: w.data },
      })
    ).status(),
  ).toBe(200);
  const published = await (
    await page.request.post(`/api/v1/workspaces/${w.id}/publish`, {
      headers: { origin: "http://localhost:3000" },
    })
  ).json();
  const base = `/api/v1/runtime/${published.tenant.id}`,
    studio = `/t/${slug}/administrator/studio`;
  await page.goto(`/t/${slug}`);
  await page
    .frameLocator("iframe.tenant-canvas")
    .getByRole("link", { name: "Khám phá chương trình ↗" })
    .first()
    .click();
  await expect(page).toHaveURL(`/t/${slug}/p/training`);
  for (const [label, path] of [
    ["Trang chủ", ""],
    ["Lộ trình", "/p/roadmap"],
    ["Dự án", "/p/projects"],
    ["Giới thiệu", "/p/about"],
    ["Chương trình", "/p/training"],
  ]) {
    await page
      .locator(".site-nav")
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL(`/t/${slug}${path}`);
    await expect(page.locator("iframe.tenant-canvas")).toBeVisible();
  }
  const cr = await page.request.post(base + "/courses", {
      headers: { origin: "http://localhost:3000" },
      data: {
        title: "Interactive course",
        slug: "interactive",
        published: true,
      },
    }),
    course = await cr.json();
  await page.goto(studio);
  await page.getByRole("link", { name: /Slide bài giảng/ }).click();
  await page
    .getByLabel("Tên dự án", { exact: true })
    .fill("Reusable slide deck");
  await page
    .getByLabel("Tiêu đề trang/cảnh", { exact: true })
    .fill("A real teaching slide");
  await page
    .getByRole("textbox", { name: "Nội dung trang/cảnh", exact: true })
    .fill("Predict first. Run the experiment. Explain the evidence.");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page).not.toHaveURL(/\/new$/);
  await page.reload();
  await expect(
    page.getByLabel("Tiêu đề trang/cảnh", { exact: true }),
  ).toHaveValue("A real teaching slide");
  await page.screenshot({
    path: "../.build/screenshots/slide-studio.png",
    fullPage: true,
  });
  await page.goto(studio + "/simulation/new");
  await page.getByLabel("Tên dự án", { exact: true }).fill("PID experiment");
  await page.getByLabel("Loại mô phỏng").selectOption("pid");
  await page.getByLabel("Hệ số P", { exact: true }).press("End");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page).not.toHaveURL(/\/new$/);
  await page.reload();
  await expect(page.getByLabel("Hệ số P", { exact: true })).toHaveValue("8");
  await page.goto(studio + "/video/new");
  await page
    .getByLabel("Tên dự án", { exact: true })
    .fill("Video scene export");
  await page
    .getByLabel("Tiêu đề trang/cảnh", { exact: true })
    .fill("Video from real canvas");
  await page.getByLabel("Thời lượng (giây)", { exact: true }).fill("1");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất video", exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/\.(webm|mp4)$/);
  const videoPath = await download.path();
  const { stat } = await import("node:fs/promises");
  expect((await stat(videoPath!)).size).toBeGreaterThan(1000);
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page).not.toHaveURL(/\/new$/);
  await page.goto(`/t/${slug}/administrator`);
  await page.getByRole("button", { name: "Khóa học", exact: true }).click();
  await page.getByRole("button", { name: "Bài học", exact: true }).click();
  await page
    .getByLabel("Tiêu đề", { exact: true })
    .fill("Learning with real media");
  await page
    .getByRole("textbox", { name: "Nội dung", exact: true })
    .fill("Explain the model before trying the controls.");
  await page
    .getByRole("button", { name: /Lưu và mở Studio toàn màn hình/ })
    .click();
  await expect(page).toHaveURL(/\/studio\/lesson\/[a-f0-9-]+$/);
  await expect(page.getByLabel("Tên dự án", { exact: true })).toHaveValue(
    "Learning with real media",
  );
  await page
    .locator(".studio-asset-insert")
    .filter({ hasText: "Reusable slide deck" })
    .click();
  await page
    .locator(".studio-asset-insert")
    .filter({ hasText: "PID experiment" })
    .click();
  const embedded = page.locator(".studio-lesson-node").first();
  await embedded
    .getByRole("button", { name: "Sửa học liệu", exact: true })
    .click();
  await embedded
    .getByLabel("Tiêu đề trang/cảnh", { exact: true })
    .fill("Customized within this lesson");
  await embedded.getByRole("button", { name: "Xong", exact: true }).click();
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByRole("status").filter({hasText:"Đã lưu"})).toContainText("Đã lưu");
  await page.reload();
  await expect(page.locator(".studio-lesson-node")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Xem như học viên", exact: true })
    .click();
  await expect(page.locator(".lesson-document")).toContainText(
    "Explain the model",
  );
  await page.screenshot({
    path: "../.build/screenshots/lesson-studio.png",
    fullPage: true,
  });
  const learnerContext = await browser.newContext(),
    learner = await learnerContext.newPage();
  await learner.request.post("/api/v1/auth/register", {
    headers: { origin: "http://localhost:3000" },
    data: {
      name: "Studio Learner",
      email: `media-learner-${stamp}@example.com`,
      password: "learner-strong-password",
    },
  });
  await learner.goto(`/t/${slug}/learn?course=${course.id}`);
  await learner.getByRole("button", { name: /Ghi danh miễn phí/ }).click();
  await learner
    .getByRole("button", { name: "Learning with real media", exact: true })
    .click();
  await expect(
    learner.locator(".lesson-document .studio-lesson-node"),
  ).toHaveCount(2);
  await learner.getByLabel("Hệ số P", { exact: true }).press("Home");
  await expect(learner.getByLabel("Hệ số P", { exact: true })).toHaveValue("0");
  await learner
    .getByRole("button", { name: "Đánh dấu hoàn thành", exact: true })
    .click();
  await expect(
    learner.getByRole("button", { name: "Đã hoàn thành", exact: true }),
  ).toBeVisible();
  await learner.screenshot({
    path: "../.build/screenshots/learner-interactive-media.png",
    fullPage: true,
  });
  await learnerContext.close();
});
