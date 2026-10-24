"use client";
import { useURLFilters } from "@/lib/use-url-filters";
import Link from "next/link";
import {
  Search,
  ArrowUpRight,
  Eye,
  Sparkles,
  Code2,
  Bot,
  BriefcaseBusiness,
  Leaf,
  Languages,
  Palette,
  LayoutGrid,
  X,
} from "lucide-react";
import TemplateThumbnail from "./template-thumbnail";
import TemplateLink from "./template-link";
import { useI18n } from "./locale-provider";
const icons: Record<string, any> = {
  "ai-data": Sparkles,
  "software-cloud": Code2,
  "robotics-stem": Bot,
  business: BriefcaseBusiness,
  wellness: Leaf,
  languages: Languages,
  "creative-education": Palette,
};
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
export default function TemplateGallery({
  templates,
  groups,
}: {
  templates: any[];
  groups: any[];
}) {
  const { locale, t } = useI18n(),
    { params, updateFilters } = useURLFilters();
  const query = params.get("q") || "",
    group = groups.some((g) => g.id === params.get("group"))
      ? params.get("group")!
      : "all";
  const visible = templates.filter(
    (x) =>
      (group === "all" || x.group_ids?.includes(group)) &&
      normalize(
        `${x.name} ${x.category} ${x.category_en} ${x.description} ${x.description_en}`,
      ).includes(normalize(query.trim())),
  );
  function update(key: string, value: string) {
    updateFilters({ [key]: value }, "#templates");
  }
  const returnTo = `/${params.size ? `?${params}` : ""}#templates`;
  return (
    <div className="template-discovery">
      <div
        className="template-group-grid"
        aria-label={t("Nhóm template", "Template categories")}
      >
        {[
          {
            id: "all",
            label: { vi: "Tất cả mẫu", en: "All templates" },
            description: {
              vi: "Tìm cảm hứng cho ý tưởng của bạn",
              en: "Find your next inspiration",
            },
            color: "#315f50",
          },
          ...groups,
        ].map((g) => {
          const Icon = icons[g.id] || LayoutGrid,
            count =
              g.id === "all"
                ? templates.length
                : templates.filter((x) => x.group_ids?.includes(g.id)).length;
          return (
            <button
              key={g.id}
              type="button"
              className="template-group"
              aria-pressed={group === g.id}
              onClick={() => update("group", g.id)}
              style={{ "--group-color": g.color } as React.CSSProperties}
            >
              <span className="template-group-icon">
                <Icon size={19} />
              </span>
              <strong>{g.label[locale]}</strong>
              <span className="template-group-count">{count}</span>
              <small>{g.description[locale]}</small>
            </button>
          );
        })}
      </div>
      <div className="template-search-row">
        <div>
          <span className="eyebrow">DESIGNED TO BECOME YOURS</span>
          <h3>
            {group === "all"
              ? t(
                  "Mỗi mẫu, một khởi đầu mới.",
                  "A new beginning in every template.",
                )
              : groups.find((g) => g.id === group)?.label[locale]}
          </h3>
          <p aria-live="polite">
            {visible.length}{" "}
            {t(
              "mẫu phù hợp · Có website, bài học và lộ trình",
              "templates · Websites, lessons and pathways included",
            )}
          </p>
        </div>
        <label className="template-search">
          <Search size={18} />
          <input
            type="search"
            aria-label={t(
              "Tìm template theo mục đích",
              "Find a template by purpose",
            )}
            value={query}
            onChange={(e) => update("q", e.target.value)}
            placeholder={t("Tìm mẫu bạn cần…", "Find your template…")}
          />
          {query && (
            <button
              type="button"
              aria-label={t("Xóa tìm kiếm", "Clear search")}
              onClick={() => update("q", "")}
            >
              <X size={15} />
            </button>
          )}
        </label>
      </div>
      <div className="template-grid">
        {visible.map((x) => {
          const href = `/templates/${x.id}?returnTo=${encodeURIComponent(returnTo)}`;
          return (
            <article className="template-card" key={x.id}>
              <Link
                className="template-card-preview"
                href={href}
                aria-label={`${t("Xem website", "Preview website")} ${x.name}`}
              >
                <TemplateThumbnail
                  id={x.id}
                  name={x.name}
                  version={x.version || x.revision}
                />
                <span className="template-card-peek">
                  <Eye size={15} />
                  {t("Khám phá website", "Explore website")}
                  <ArrowUpRight size={14} />
                </span>
              </Link>
              <div className="template-info">
                <small>
                  <i style={{ background: x.color }} />
                  {locale === "en" ? x.category_en : x.category}
                </small>
                <h2>
                  <Link href={href}>{x.name}</Link>
                </h2>
                <p>{locale === "en" ? x.description_en : x.description}</p>
                <div className="template-card-meta">
                  <span>
                    {x.course_count} {t("chuyên đề", "courses")}
                  </span>
                  <span>
                    {x.lesson_count} {t("bài học", "lessons")}
                  </span>
                  <span>VI / EN</span>
                </div>
                <div className="template-card-actions">
                  <Link href={href} className="text-link">
                    {t("Xem website và bài học", "Preview website and lessons")}{" "}
                    ↗
                  </Link>
                  <TemplateLink template={x.id}>
                    {t("Dùng mẫu này", "Use this template")}
                    <ArrowUpRight size={15} />
                  </TemplateLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="template-empty">
          <Search size={30} />
          <h3>{t("Chưa tìm thấy mẫu phù hợp", "No matching templates")}</h3>
          <p>
            {t(
              "Thử một từ khóa khác hoặc khám phá tất cả lĩnh vực.",
              "Try another keyword or explore all categories.",
            )}
          </p>
          <button
            type="button"
            className="button ghost"
            onClick={() => updateFilters({ group: "", q: "" }, "#templates")}
          >
            {t("Xem tất cả mẫu", "Show all templates")}
          </button>
        </div>
      )}
    </div>
  );
}
