import { test, expect } from "@playwright/test";
test("template library previews real bilingual lessons and five pages", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("Yirobot");
  await expect(page.locator(".template-grid article")).toHaveCount(1);
  await page.getByRole("link", { name: "Xem website và bài học ↗" }).click();
  await expect(
    page.getByRole("heading", { name: "Yirobot", exact: true }),
  ).toBeVisible();
  await expect(
    page.frameLocator("iframe.tenant-canvas").locator(".robot-core"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Chương trình", exact: true }).click();
  await expect(
    page.frameLocator("iframe.tenant-canvas").locator(".yd-course"),
  ).toHaveCount(32);
  await page.goto("/templates/software-engineering?course=python");
  await expect(page.locator(".tiptap").first()).toContainText("Python");
  await page.getByLabel("Language / Ngôn ngữ").selectOption("en");
  await expect(
    page.getByRole("heading", { name: "Explore the learning units" }),
  ).toBeVisible();
  await expect(page.locator(".tiptap").first()).toContainText("Python");
});
