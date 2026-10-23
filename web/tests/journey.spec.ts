import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("owner creates a tenant and lesson, learner completes it, ZIP downloads", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString();
  const slug = "school-" + suffix;
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Tri thức của bạn/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "../.build/screenshots/home-desktop.png",
    fullPage: true,
  });
  await page.goto("/register?template=technology");
  await page.getByLabel("Họ và tên").fill("Owner Test");
  await page
    .getByLabel("Email", { exact: true })
    .fill("owner-" + suffix + "@example.com");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill("strong-browser-password");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await page.locator('input[name="name"]').fill("School " + suffix);
  await page.locator('input[name="slug"]').fill(slug);
  await page.getByRole("button", { name: "Mở trình thiết kế" }).click();
  await expect(page).toHaveURL(/builder/);
  await expect(
    page.getByRole("button", { name: "Xuất bản", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Đã xuất bản" }),
  ).toBeVisible();
  await page.goto("/t/" + slug + "/administrator");
  await page.getByRole("button", { name: "Khóa học", exact: true }).click();
  await page.getByLabel("Tên khóa học", { exact: true }).fill("Python căn bản");
  await page
    .getByLabel("Mô tả", { exact: true })
    .fill("Khóa học đầu tiên được tạo qua giao diện.");
  await page.getByLabel("Xuất bản cho học viên").check();
  await page.getByRole("button", { name: "Lưu khóa học", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Đã lưu khóa học" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bài học", exact: true }).click();
  await page
    .getByLabel("Tiêu đề", { exact: true })
    .fill("Bài 1: Biến và kiểu dữ liệu");
  await page
    .getByLabel("Nội dung", { exact: true })
    .fill("Nội dung bài học thật để kiểm tra luồng học tập.");
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Đã lưu bài học" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tiện ích", exact: true }).click();
  await page
    .locator("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Chứng nhận hoàn thành",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Kích hoạt", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Đã kích hoạt" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Xuất hệ thống", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: /Tải hệ thống ZIP/ }).click();
  const download = await downloadPromise;
  const file = await download.path();
  expect(fs.statSync(file!).size).toBeGreaterThan(1000);
  await page.goto("/t/" + slug + "/administrator");
  await expect(page.getByRole("heading", { name: "Tổng quan." })).toBeVisible();
  await page.screenshot({
    path: "../.build/screenshots/admin-desktop.png",
    fullPage: true,
  });
  const learner = await browser.newContext();
  const student = await learner.newPage();
  await student.goto("/register?site=" + slug);
  await student.getByLabel("Họ và tên").fill("Learner Test");
  await student
    .getByLabel("Email", { exact: true })
    .fill("learner-" + suffix + "@example.com");
  await student
    .getByLabel("Mật khẩu", { exact: true })
    .fill("strong-browser-password");
  await student
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(student).toHaveURL(/learn/);
  await student.getByRole("button", { name: /Ghi danh miễn phí/ }).click();
  await student
    .getByRole("button", { name: "Bài 1: Biến và kiểu dữ liệu", exact: false })
    .click();
  await expect(
    student.getByText("Nội dung bài học thật để kiểm tra luồng học tập."),
  ).toBeVisible();
  await student
    .getByRole("button", { name: "Đánh dấu hoàn thành", exact: true })
    .click();
  await expect(
    student.getByRole("button", { name: "Đã hoàn thành", exact: true }),
  ).toBeVisible();
  await student.setViewportSize({ width: 390, height: 844 });
  await student.screenshot({
    path: "../.build/screenshots/learn-mobile.png",
    fullPage: true,
  });
  await learner.close();
});
