"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Palette,
  Layers3,
  Sparkles,
  Plug,
  Building2,
  Receipt,
  ScrollText,
  ChevronRight,
  Globe2,
  Save,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { useI18n, LocaleSwitch } from "../locale-provider";
import { Brand, Logout, ErrorBox, Loading } from "../shared";
import TemplateManager from "./template-manager";
import ConnectionsPanel from "./connections-panel";
import AIStudio from "./ai-studio";
import OrderTable from "./order-table";
const tabs = [
  ["overview", "Tổng quan", "Overview", LayoutDashboard],
  ["appearance", "Giao diện YiEdu", "YiEdu appearance", Palette],
  ["templates", "Thư viện template", "Template library", Layers3],
  ["ai", "AI Studio", "AI Studio", Sparkles],
  ["connections", "Kết nối & thu tiền", "Connections & collection", Plug],
  ["tenants", "Khách hàng & gói", "Customers & plans", Building2],
  ["orders", "Hóa đơn dịch vụ", "Service invoices", Receipt],
  ["events", "Nhật ký quản trị", "Audit log", ScrollText],
] as const;
export default function PlatformScreen() {
  const [templateDirty, setTemplateDirty] = useState(false);
  const { t } = useI18n(),
    query = useSearchParams(),
    router = useRouter(),
    tab = tabs.some((x) => x[0] === query.get("tab"))
      ? query.get("tab")!
      : "overview",
    [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [templates, setTemplates] = useState<any[]>([]),
    [tenants, setTenants] = useState<any[]>([]),
    [orders, setOrders] = useState<any[]>([]),
    [search, setSearch] = useState(""),
    [planData, setPlanData] = useState<any>(null);
  async function load() {
    const d = await api("/platform/overview");
    setData(d);
    setPlanData({ ...d.billing.plans, revision: d.billing.revision });
  }
  async function loadTenants(q = search) {
    setTenants(await api(`/platform/tenants?q=${encodeURIComponent(q)}`));
  }
  const loadOrders = () => api("/platform/orders").then(setOrders);
  useEffect(() => {
    load().catch((e) => setError(e.message));
    api("/platform/templates")
      .then(setTemplates)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!data) return;
    if (tab === "tenants") loadTenants().catch((e) => setError(e.message));
    if (tab === "orders") loadOrders().catch((e) => setError(e.message));
  }, [tab, !!data]);
  async function run(fn: () => Promise<any>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await load();
      router.refresh();
      setNotice(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-layout platform-layout">
      <aside
        className="sidebar"
        onClickCapture={(e) => {
          if (
            templateDirty &&
            (e.target as Element).closest("a") &&
            !confirm(
              t(
                "Template có thay đổi chưa lưu. Rời trang?",
                "Leave with unsaved template changes?",
              ),
            )
          ) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <Brand />
        <div className="platform-role">
          <ShieldCheck size={17} />
          <span>YiEdu Platform Admin</span>
        </div>
        <span className="nav-caption">
          {t("ĐIỀU HÀNH NỀN TẢNG", "PLATFORM MANAGEMENT")}
        </span>
        <nav>
          {tabs.map(([id, vi, en, Icon]) => (
            <Link
              className={tab === id ? "active" : ""}
              href={`/platform${id === "overview" ? "" : `?tab=${id}`}`}
              key={id}
              onClick={() => {
                setError("");
                setNotice("");
              }}
            >
              <Icon size={18} />
              {t(vi, en)}
              {tab === id && <ChevronRight size={14} />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/dashboard">
            {t("Không gian của tôi", "My workspace")}
          </Link>
          <Link href="/">
            <Globe2 size={16} />
            {t("Trang chủ YiEdu", "YiEdu homepage")}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <span>
            YiEdu <ChevronRight size={13} />
            {t(
              tabs.find((x) => x[0] === tab)![1],
              tabs.find((x) => x[0] === tab)![2],
            )}
          </span>
          <div className="actions">
            <LocaleSwitch />
            <Logout />
          </div>
        </header>
        <main className="admin-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">PLATFORM CONTROL CENTER</span>
              <h1>
                {t(
                  tabs.find((x) => x[0] === tab)![1],
                  tabs.find((x) => x[0] === tab)![2],
                )}
                <span className="brand-dot">.</span>
              </h1>
              <p>
                {t(
                  "Chăm chút trải nghiệm, vận hành một nền tảng đáng tin cậy.",
                  "Craft the experience. Run a platform people can trust.",
                )}
              </p>
            </div>
            <span className="pill">
              <ShieldCheck size={14} />
              Platform admin
            </span>
          </div>
          <ErrorBox message={error} />
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
          {!data ? (
            error ? (
              <section className="panel">
                <h2>
                  {t(
                    "Khu vực dành cho quản trị YiEdu",
                    "YiEdu administrator access",
                  )}
                </h2>
                <p>
                  {t(
                    "Đăng nhập tài khoản đã được cấp quyền quản trị nền tảng từ máy chủ. Đăng ký email không tự cấp quyền này.",
                    "Sign in with an account granted the platform role from the server console. Registering an email does not grant this role.",
                  )}
                </p>
                <Link
                  className="button"
                  href={`/login?returnTo=${encodeURIComponent("/platform" + (query.size ? `?${query}` : ""))}`}
                >
                  {t("Đăng nhập", "Sign in")}
                </Link>
              </section>
            ) : (
              <Loading />
            )
          ) : (
            <>
              {tab === "overview" && (
                <>
                  <div className="stats-row">
                    {[
                      [
                        data.counts.tenants,
                        t("Hệ thống khách hàng", "Customer systems"),
                        Building2,
                      ],
                      [
                        data.counts.users,
                        t("Tài khoản", "Accounts"),
                        ShieldCheck,
                      ],
                      [
                        data.counts.templates,
                        t("Template đang xuất bản", "Published templates"),
                        Layers3,
                      ],
                      [
                        data.counts.orders,
                        t("Đơn thanh toán", "Payment orders"),
                        Receipt,
                      ],
                    ].map(([value, label, Icon]: any) => (
                      <div key={label}>
                        <Icon />
                        <b>{value}</b>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <section className="platform-welcome">
                    <div>
                      <span className="eyebrow">A PLACE FOR EVERY ACADEMY</span>
                      <h2>
                        {t(
                          "Tri thức lớn lên từ những không gian riêng.",
                          "Knowledge grows in spaces of its own.",
                        )}
                      </h2>
                      <p>
                        {t(
                          "Quản lý nhận diện, xây template và học liệu, kết nối AI và theo dõi phí dịch vụ trong cùng một không gian.",
                          "Manage identity, build templates and curriculum, connect AI and track service fees in one workspace.",
                        )}
                      </p>
                      <Link className="button" href="/platform?tab=appearance">
                        {t("Chỉnh giao diện YiEdu", "Customize YiEdu")}
                        <Palette size={16} />
                      </Link>
                    </div>
                    <img
                      src="/brand/yiedu-symbol.svg"
                      width={180}
                      height={180}
                      alt="YiEdu"
                    />
                  </section>
                  <div className="info-callout">
                    <ShieldCheck />
                    <p>
                      {data.encryption_ready
                        ? t(
                            "Máy chủ đã có khóa mã hóa kết nối. Bạn có thể cấu hình API và tài khoản nhận tiền.",
                            "The connection encryption key is configured. You can add API and payment accounts.",
                          )
                        : t(
                            "Chạy lại scripts/bootstrap.py để bổ sung CONNECTIONS_ENCRYPTION_KEY rồi khởi động lại API trước khi lưu API key.",
                            "Run scripts/bootstrap.py to add CONNECTIONS_ENCRYPTION_KEY, then restart the API before saving credentials.",
                          )}
                    </p>
                  </div>
                </>
              )}
              {tab === "appearance" && (
                <form
                  className="panel appearance-form"
                  key={data.appearance.revision}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run(
                      () =>
                        api("/platform/appearance", {
                          method: "PUT",
                          body: JSON.stringify({
                            ...data.appearance,
                            ...Object.fromEntries(f.entries()),
                            show_pricing: f.get("show_pricing") === "on",
                          }),
                        }),
                      t(
                        "Đã cập nhật giao diện YiEdu.",
                        "YiEdu appearance updated.",
                      ),
                    );
                  }}
                >
                  <div className="section-title">
                    <div>
                      <span className="eyebrow">BRAND & HOMEPAGE</span>
                      <h2>
                        {t(
                          "Một diện mạo, một thông điệp rõ ràng.",
                          "A clear identity. A clear message.",
                        )}
                      </h2>
                    </div>
                    <button className="button" disabled={busy}>
                      <Save size={16} />
                      {t("Lưu giao diện", "Save appearance")}
                    </button>
                  </div>
                  <div className="appearance-grid">
                    <div>
                      <label>
                        {t("Tên thương hiệu", "Brand name")}
                        <input
                          name="name"
                          defaultValue={data.appearance.name}
                          required
                          maxLength={200}
                        />
                      </label>
                      <label>
                        {t("Logo SVG/ảnh HTTPS", "Logo SVG/HTTPS image")}
                        <input
                          name="logo_url"
                          defaultValue={data.appearance.logo_url}
                          required
                        />
                      </label>
                      <div className="form-pair">
                        <label>
                          {t("Màu thương hiệu", "Brand color")}
                          <input
                            type="color"
                            name="color"
                            defaultValue={data.appearance.color}
                          />
                        </label>
                        <label>
                          {t(
                            "Nền section đầu trang",
                            "Hero section background",
                          )}
                          <input
                            type="color"
                            name="hero_background"
                            defaultValue={data.appearance.hero_background}
                          />
                        </label>
                      </div>
                      <label>
                        {t(
                          "Website minh họa đầu trang",
                          "Hero website preview",
                        )}
                        <select
                          name="hero_template"
                          defaultValue={data.appearance.hero_template}
                        >
                          {templates
                            .filter((x) => x.status === "published")
                            .map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          name="show_pricing"
                          defaultChecked={data.appearance.show_pricing}
                        />
                        {t(
                          "Hiển thị bảng giá trên trang chủ",
                          "Show pricing on the homepage",
                        )}
                      </label>
                      <div className="brand-story">
                        <img
                          src="/brand/yiedu-symbol.svg"
                          width={72}
                          height={72}
                          alt=""
                        />
                        <p>
                          {t(
                            "Sách mở là nền tảng tri thức. Chữ Y như một mầm cây vươn lên, thể hiện mỗi học viện phát triển theo hướng riêng. Điểm sáng vàng tượng trưng cho ý tưởng mới.",
                            "An open book represents knowledge. The Y grows like a seedling, reflecting each academy’s own direction. The golden spark represents a new idea.",
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      {["vi", "en"].map((lang) => (
                        <div key={lang}>
                          <span className="eyebrow">
                            {lang === "vi" ? "TIẾNG VIỆT" : "ENGLISH"}
                          </span>
                          <label>
                            {t("Tiêu đề đầu trang", "Hero headline")}
                            <textarea
                              name={`headline_${lang}`}
                              defaultValue={data.appearance[`headline_${lang}`]}
                              required
                              rows={2}
                              maxLength={180}
                            />
                          </label>
                          <label>
                            {t("Nội dung giới thiệu", "Hero description")}
                            <textarea
                              name={`description_${lang}`}
                              defaultValue={
                                data.appearance[`description_${lang}`]
                              }
                              required
                              rows={4}
                              maxLength={1000}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              )}
              {tab === "templates" && (
                <TemplateManager onDirtyChange={setTemplateDirty} />
              )}
              {tab === "ai" && (
                <AIStudio
                  scope="platform"
                  onApplied={() =>
                    api("/platform/templates").then(setTemplates)
                  }
                />
              )}
              {tab === "connections" && <ConnectionsPanel scope="platform" />}
              {tab === "tenants" && (
                <div className="business-stack">
                  <section className="panel">
                    <div className="section-title">
                      <h2>{t("Hệ thống khách hàng", "Customer systems")}</h2>
                      <form
                        className="actions"
                        onSubmit={(e) => {
                          e.preventDefault();
                          loadTenants().catch((e) => setError(e.message));
                        }}
                      >
                        <input
                          value={search}
                          maxLength={100}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={t(
                            "Tìm tên hoặc địa chỉ",
                            "Search name or slug",
                          )}
                        />
                        <button className="button small ghost">
                          <Search size={16} />
                        </button>
                      </form>
                    </div>
                    <div className="tenant-account-grid">
                      {tenants.map((x) => (
                        <article key={x.id}>
                          <div>
                            <h3>{x.name}</h3>
                            <Link href={`/t/${x.slug}`} className="text-link">
                              {x.slug} ↗
                            </Link>
                            <small>
                              {x.subscription.plan} · {x.subscription.days_left}{" "}
                              {t("ngày còn lại", "days left")}
                              {x.archived_at
                                ? " · " + t("Đã lưu trữ", "Archived")
                                : ""}
                            </small>
                          </div>
                          <button
                            className="button small ghost"
                            onClick={() => {
                              const reason = prompt(
                                t(
                                  "Lý do gia hạn dùng thử thêm 7 ngày:",
                                  "Reason for adding 7 trial days:",
                                ),
                              );
                              if (!reason || reason.length < 5) return;
                              run(
                                async () => {
                                  await api(
                                    `/platform/tenants/${x.id}/extend-trial`,
                                    {
                                      method: "POST",
                                      body: JSON.stringify({ days: 7, reason }),
                                    },
                                  );
                                  await loadTenants();
                                },
                                t("Đã gia hạn dùng thử.", "Trial extended."),
                              );
                            }}
                            disabled={busy}
                          >
                            <Plus size={14} />7 {t("ngày", "days")}
                          </button>
                        </article>
                      ))}
                    </div>
                    <small>
                      {t(
                        "Hiển thị tối đa 50 hệ thống phù hợp. Tìm theo tên để thu hẹp.",
                        "Shows up to 50 matching systems. Search by name to narrow the list.",
                      )}
                    </small>
                  </section>
                  {planData && (
                    <form
                      className="panel"
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(
                          () =>
                            api("/platform/plans", {
                              method: "PUT",
                              body: JSON.stringify(planData),
                            }),
                          t("Đã lưu bảng giá.", "Plans saved."),
                        );
                      }}
                    >
                      <div className="section-title">
                        <h2>
                          {t(
                            "Giá & hạn mức gói dịch vụ",
                            "Plan pricing & limits",
                          )}
                        </h2>
                        <button className="button small" disabled={busy}>
                          <Save size={15} />
                          {t("Lưu bảng giá", "Save plans")}
                        </button>
                      </div>
                      <div className="plan-admin-grid">
                        {["starter", "growth", "scale"].map((id) => (
                          <div key={id}>
                            <h3>{id.toUpperCase()}</h3>
                            {[
                              ["name", "Tên gói", "Plan name"],
                              [
                                "monthly_vnd",
                                "Giá / 30 ngày (VND)",
                                "Price / 30 days (VND)",
                              ],
                              [
                                "monthly_usd",
                                "Giá PayPal (US cents)",
                                "PayPal price (US cents)",
                              ],
                              ["courses", "Số khóa học", "Courses"],
                              ["learners", "Số học viên", "Learners"],
                              [
                                "ai_daily",
                                "Lượt AI/ngày",
                                "AI generations/day",
                              ],
                            ].map(([key, vi, en]) => (
                              <label key={key}>
                                {t(vi, en)}
                                <input
                                  type={key === "name" ? "text" : "number"}
                                  value={planData[id][key]}
                                  min={1}
                                  required
                                  onChange={(e) =>
                                    setPlanData({
                                      ...planData,
                                      [id]: {
                                        ...planData[id],
                                        [key]:
                                          key === "name"
                                            ? e.target.value
                                            : Number(e.target.value),
                                      },
                                    })
                                  }
                                />
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                      <small>
                        {t(
                          "Gói năm = giá tháng × 10, dùng 365 ngày. Giá mới áp dụng cho đơn tạo sau khi lưu; đơn đã tạo giữ giá cũ. Đây là mức giá khởi điểm để thử nghiệm thị trường.",
                          "Annual price = monthly price × 10 for 365 days. New prices apply to future orders; existing orders retain their price. These are initial prices for market validation.",
                        )}
                      </small>
                    </form>
                  )}
                </div>
              )}
              {tab === "orders" && (
                <section className="panel">
                  <OrderTable orders={orders} seller onChange={loadOrders} />
                </section>
              )}
              {tab === "events" && (
                <section className="panel">
                  <h2>
                    {t(
                      "Lịch sử thay đổi gần đây",
                      "Recent administrative changes",
                    )}
                  </h2>
                  <div className="platform-events">
                    {data.events.map((e: any) => (
                      <article key={e.id}>
                        <ScrollText size={17} />
                        <div>
                          <b>{e.action}</b>
                          <small>
                            {new Date(e.created_at).toLocaleString()}
                          </small>
                          <code>{JSON.stringify(e.detail)}</code>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
