import { test, expect, Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { accountReturnURL, checkoutReturnURL } from "../lib/navigation";
const headers = { origin: "http://localhost:3000" };
async function account(page: Page, tag = "business") {
  const email = `${tag}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}@example.com`;
  const password = "business-browser-password";
  const r = await page.request.post("/api/v1/auth/register", {
    headers,
    data: { name: "Business owner", email, password },
  });
  expect(r.status()).toBe(201);
  return { email, password };
}
async function site(page: Page) {
  const owner = await account(page),
    slug = "business-" + Date.now();
  const r = await page.request.post("/api/v1/workspaces", {
    headers,
    data: {
      name: "Business Academy",
      slug,
      template_id: "academy",
      include_sample_content: false,
    },
  });
  expect(r.status()).toBe(201);
  const w = await r.json();
  const p = await page.request.post(`/api/v1/workspaces/${w.id}/publish`, {
    headers,
  });
  expect(p.status()).toBe(200);
  return { ...owner, slug, workspace: w, tenant: (await p.json()).tenant };
}
test("account returns stay local", () => {
  expect(checkoutReturnURL("school", "/t/school/learn?course=one")).toBe(
    "/t/school/learn?course=one",
  );
  expect(checkoutReturnURL("school", "/t/other/administrator")).toBe("/orders");
  expect(checkoutReturnURL("school", "//evil.invalid")).toBe("/orders");
  for (const input of [
    "https://evil.invalid",
    "//evil.invalid",
    "/t/other/administrator",
    "/platform/../evil",
    "/checkout/javascript:alert(1)",
  ])
    expect(accountReturnURL(input)).toBe("/dashboard");
  expect(accountReturnURL("/platform?tab=templates")).toBe(
    "/platform?tab=templates",
  );
});
test("new identity, full-width hero and transparent annual pricing are responsive", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".brand .yiedu-symbol")).toBeVisible();
  const bounds = await page.locator(".hero-band").boundingBox();
  expect(bounds!.width).toBeGreaterThan(1200);
  await page.screenshot({ path: "../.build/screenshots/yiedu-brand-hero.png" });
  await page
    .locator("#pricing")
    .getByRole("button", { name: /Hàng năm/ })
    .click();
  await expect(page.locator(".pricing-card").first()).toContainText(
    "2.990.000",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const wide = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth + 1,
  );
  if (wide)
    console.log(
      "OVERFLOW",
      await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter(
            (e) =>
              e.getBoundingClientRect().right > innerWidth + 1 &&
              !e.closest("iframe"),
          )
          .slice(0, 20)
          .map((e) => ({
            tag: e.tagName,
            cls: e.className,
            right: e.getBoundingClientRect().right,
          })),
      ),
    );
  expect(wide).toBe(false);
  await page.screenshot({
    path: "../.build/screenshots/yiedu-brand-mobile.png",
  });
});
test("dashboard designs and systems can be archived and restored without losing the website", async ({
  page,
}) => {
  const s = await site(page);
  await page.goto("/dashboard");
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Xóa bản thiết kế", exact: true })
    .click();
  await expect(page.locator(".managed-draft-row")).toHaveCount(0);
  await page.getByRole("button", { name: "Thùng rác", exact: true }).click();
  await page
    .getByRole("button", { name: "Khôi phục bản thiết kế", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Trở về đang hoạt động", exact: true })
    .click();
  await expect(page.locator(".managed-draft-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Xóa hệ thống", exact: true }).click();
  expect((await page.request.get(`/api/v1/sites/${s.slug}`)).status()).toBe(
    404,
  );
  await page.getByRole("button", { name: "Thùng rác", exact: true }).click();
  await page.getByRole("button", { name: "Khôi phục", exact: true }).click();
  expect((await page.request.get(`/api/v1/sites/${s.slug}`)).status()).toBe(
    200,
  );
});
test("seller configures bank and paid offer; learner pays and gains access after seller review", async ({
  page,
  browser,
}) => {
  page.setDefaultTimeout(15000);
  const s = await site(page),
    base = `/api/v1/runtime/${s.tenant.id}`;
  const c = await (
    await page.request.post(base + "/courses", {
      headers,
      data: {
        title: "Professional course",
        slug: "professional",
        published: true,
      },
    })
  ).json();
  const l = await page.request.post(base + `/courses/${c.id}/lessons`, {
    headers,
    data: {
      title: "The first paid lesson",
      content: "The original restricted lesson is now available.",
    },
  });
  expect(l.status()).toBe(201);
  await page.goto(`/t/${s.slug}/administrator?tab=connections`);
  const form = page.locator(".connection-card").filter({
    has: page.getByRole("heading", {
      name: "Chuyển khoản ngân hàng",
      exact: true,
    }),
  });
  await form
    .getByLabel("Tên ngân hàng", { exact: true })
    .fill("Test Local Bank");
  await form.getByLabel("Số tài khoản", { exact: true }).fill("1234567890");
  await form.getByLabel("Chủ tài khoản", { exact: true }).fill("TEST ACADEMY");
  await form.getByLabel("Bật kết nối", { exact: true }).check();
  await form.getByRole("button", { name: "Lưu cấu hình", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu kết nối");
  await page.getByRole("button", { name: "Bán khóa học", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Khóa học hoặc lộ trình", exact: true })
    .selectOption(`course:${c.id}`);
  await page
    .getByRole("combobox", { name: "Hình thức", exact: true })
    .selectOption("paid");
  await page.getByLabel("Giá VND", { exact: true }).fill("299000");
  await page.getByLabel("Giá USD cho PayPal", { exact: true }).fill("15");
  await page
    .getByRole("button", { name: "Lưu hình thức bán", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Đã lưu hình thức bán");
  const learner = await browser.newContext(),
    lp = await learner.newPage();
  await account(lp, "buyer");
  await lp.goto(`/t/${s.slug}/learn?course=${c.id}`);
  await lp
    .getByRole("button", { name: "Mua và bắt đầu học", exact: true })
    .click();
  await expect(lp).toHaveURL(/checkout\//);
  await expect(lp.locator(".bank-details")).toContainText("TEST ACADEMY");
  await expect(
    lp.getByText("The original restricted lesson", { exact: false }),
  ).toHaveCount(0);
  const id = lp.url().split("/checkout/")[1];
  await lp
    .getByRole("button", { name: "Kiểm tra thanh toán", exact: true })
    .click();
  await expect(lp.locator(".status-badge")).toHaveText("Chờ thanh toán");
  await page.reload();
  await page.getByRole("button", { name: "Đối soát", exact: true }).click();
  await page
    .getByLabel("Mã giao dịch trong sao kê", { exact: true })
    .fill("bank-statement-" + Date.now());
  await page
    .getByLabel("Số tiền thực nhận (VND)", { exact: true })
    .fill("299000");
  await page
    .getByLabel("Ghi chú đối soát", { exact: true })
    .fill("Verified against bank statement and order reference");
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Xác nhận và cấp quyền", exact: true })
    .click();
  await expect(page.locator(".business-table .status-badge")).toHaveText(
    "Đã thanh toán",
  );
  await lp
    .getByRole("button", { name: "Kiểm tra thanh toán", exact: true })
    .click();
  await expect(
    lp.getByRole("heading", {
      name: "Thanh toán đã được xác nhận.",
      exact: true,
    }),
  ).toBeVisible();
  await lp.screenshot({ path: "../.build/screenshots/verified-checkout.png" });
  await lp.getByRole("link", { name: "Vào học ngay", exact: true }).click();
  await lp.getByRole("button", { name: /The first paid lesson/ }).click();
  await expect(lp.locator(".lesson-content")).toContainText(
    "original restricted lesson",
  );
  await learner.close();
});
test("platform owner edits appearance and a copied template in Website Studio", async ({
  page,
}) => {
  page.setDefaultTimeout(20000);
  const a = await account(page, "platform");
  execFileSync(
    "python",
    ["scripts/provision_platform_admin.py", "--email", a.email],
    { cwd: path.resolve(process.cwd(), ".."), env: process.env },
  );
  expect(
    (
      await page.request.post("/api/v1/auth/login", {
        headers,
        data: { email: a.email, password: a.password },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/platform?tab=appearance");
  const original = await (
    await page.request.get("/api/v1/platform/public")
  ).json();
  const form = page.locator(".appearance-form");
  await form
    .locator('textarea[name="headline_vi"]')
    .fill("Tạo hệ thống học tập của riêng bạn.");
  await form
    .getByRole("button", { name: "Lưu giao diện", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Đã cập nhật giao diện");
  const now = await (await page.request.get("/api/v1/platform/public")).json();
  expect(
    (
      await page.request.put("/api/v1/platform/appearance", {
        headers,
        data: { ...original.appearance, revision: now.appearance.revision },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/platform?tab=templates");
  await page.getByRole("button", { name: "Tạo template", exact: true }).click();
  await expect(page.locator(".template-editor-grid")).toBeVisible();
  const id = await page.getByLabel("Mã template", { exact: true }).inputValue();
  await page
    .getByRole("button", { name: "Mở Website Studio", exact: true })
    .click();
  await expect(page).toHaveURL(/builder\//);
  await page
    .getByRole("button", { name: "Áp dụng template", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Đã áp dụng giao diện vào template",
  );
  await page
    .getByRole("link", { name: "← Thư viện template", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`platform\\?tab=templates&template=${id}`),
  );
  await page
    .getByLabel("Tên template", { exact: true })
    .fill("Original professional template");
  await page.getByRole("button", { name: "Lưu template", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu template");
  await page.screenshot({
    path: "../.build/screenshots/platform-template-editor.png",
  });
  const latest = await (
    await page.request.get(`/api/v1/platform/templates/${id}`)
  ).json();
  expect(
    (
      await page.request.delete(
        `/api/v1/platform/templates/${id}?revision=${latest.revision}`,
        { headers },
      )
    ).status(),
  ).toBe(200);
  // A deterministic provider-result fixture exercises review/apply without an external charge.
  const me = await (await page.request.get("/api/v1/auth/me")).json();
  const content = {
    name: "AI review academy",
    description:
      "Original learning with worked examples and practical exercises.",
    color: "#205b4b",
    pages: Array.from({ length: 3 }, (_, i) => ({
      title: `Page ${i + 1}`,
      headline: "Learn through practice",
      body: "Develop concrete skills through original explanations, examples and exercises.",
      highlights: ["Original examples", "Applied practice"],
    })),
    courses: [
      {
        title: "Sorting fundamentals",
        description: "Learn sorting with examples and interactive practice.",
        lessons: Array.from({ length: 2 }, (_, i) => ({
          title: `Sorting lesson ${i + 1}`,
          explanation:
            "Compare adjacent values and swap them until the sequence is ordered.",
          example: "In [3, 1, 2], compare 3 and 1, swap, then compare 3 and 2.",
          exercise: "Sort [4, 2, 1, 3] and record each comparison and swap.",
          answer:
            "The sorted sequence is [1, 2, 3, 4]. Show each intermediate step.",
          simulation: "sorting",
        })),
      },
    ],
  };
  execFileSync(
    "python",
    [
      "-c",
      "import sys,json,uuid; from sqlalchemy.orm import Session; from yiedu.db import get_engine; from yiedu.business_models import AIDraft; db=Session(get_engine()); db.add(AIDraft(scope='platform',actor_id=uuid.UUID(sys.argv[1]),kind='template',prompt='Create a practical academy for sorting lessons.',status='ready',request_key=str(uuid.uuid4()),result={'locale':'vi','base_template':'academy','content':json.loads(sys.argv[2])})); db.commit(); db.close()",
      me.id,
      JSON.stringify(content),
    ],
    { cwd: path.resolve(process.cwd(), ".."), env: process.env },
  );
  await page.goto("/platform?tab=ai");
  await expect(
    page.getByRole("button", { name: "Tạo bản nháp bằng AI", exact: true }),
  ).toBeVisible();
  await page
    .locator(".ai-draft-list")
    .getByRole("button", { name: /AI review academy/ })
    .click();
  await expect(page.locator(".ai-preview")).toContainText(
    "Sorting fundamentals",
  );
  const aiKey = "ai-reviewed-" + Date.now();
  await page.getByLabel("Mã template mới", { exact: true }).fill(aiKey);
  await page.screenshot({
    path: "../.build/screenshots/platform-ai-studio.png",
  });
  await page
    .getByRole("button", { name: "Đã duyệt · Lưu bản nháp", exact: true })
    .click();
  await expect(page.locator(".ai-preview .notice")).toContainText("Đã lưu");
  expect(
    (await page.request.get(`/api/v1/catalog/templates/${aiKey}`)).status(),
  ).toBe(404);
  const aiTemplate = await (
    await page.request.get(`/api/v1/platform/templates/${aiKey}`)
  ).json();
  expect(aiTemplate.courses[0].lessons).toHaveLength(2);
  expect(
    (
      await page.request.delete(
        `/api/v1/platform/templates/${aiKey}?revision=${aiTemplate.revision}`,
        { headers },
      )
    ).status(),
  ).toBe(200);
});
