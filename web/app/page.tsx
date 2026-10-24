import { getT } from "@/lib/i18n/server";
import Pricing from "@/components/business/pricing";
import TemplateThumbnail from "@/components/template-thumbnail";
import TemplateGallery from "@/components/template-gallery";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  BookOpen,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/shared";
import { publicApi } from "@/lib/api";
import SiteView from "@/components/site-view";
export const dynamic = "force-dynamic";
export default async function Home() {
  const tr = await getT();
  const [templateData, groupData, config] = await Promise.all([
    publicApi("/catalog/templates"),
    publicApi("/catalog/template-groups"),
    publicApi("/platform/public"),
  ]);
  const appearance = config?.appearance;
  const templates = templateData || [],
    groups = groupData || [];
  const heroTemplate =
    templates.find((x: any) => x.id === appearance?.hero_template) ||
    templates.find((x: any) => x.id === "yirobot") ||
    templates[0];

  if (process.env.INSTANCE_MODE === "standalone") {
    const info = await publicApi("/instance");
    if (info?.tenant) {
      const data = await publicApi("/sites/" + info.tenant.slug);
      if (data) return <SiteView data={data} />;
    }
  }
  return (
    <>
      <Header />
      <main>
        <section className="hero-band">
          <div className="hero-home">
            <div>
              <span className="eyebrow">
                <span className="status-dot" />
                {tr("NỀN TẢNG HỌC TẬP CỦA RIÊNG BẠN")}
              </span>
              <h1>
                {String(
                  tr(
                    appearance?.headline_vi ||
                      "Tạo hệ thống e-learning của riêng bạn.",
                    appearance?.headline_en ||
                      "Create your own e-learning platform.",
                  ),
                )
                  .split(/(e-learning)/i)
                  .map((part, i) =>
                    part.toLowerCase() === "e-learning" ? (
                      <span className="headline-word" key={i}>
                        {part}
                      </span>
                    ) : (
                      part
                    ),
                  )}
              </h1>
              <p>
                {tr(
                  appearance?.description_vi ||
                    "Thiết kế website, xây khóa học và kinh doanh tri thức trên nền tảng của riêng bạn.",
                  appearance?.description_en ||
                    "Design your website, create courses and grow your learning business with your own brand.",
                )}
              </p>
              <div className="actions">
                <Link className="button" href="#templates">
                  {tr("Bắt đầu từ một mẫu")}
                  <ArrowRight size={18} />
                </Link>
                <Link className="text-link" href="/dashboard">
                  {tr("Mở không gian của tôi")}
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="hero-trust">
                <span>
                  <Check size={15} />
                  {tr("Thiết kế linh hoạt")}
                </span>
                <span>
                  <Check size={15} />
                  {tr("Dữ liệu thuộc về bạn")}
                </span>
                <span>
                  <Check size={15} />
                  {tr("Sẵn sàng mở rộng")}
                </span>
              </div>
            </div>
            <div className="hero-art">
              <TemplateThumbnail
                id={heroTemplate?.id || "yirobot"}
                name={heroTemplate?.name || "Yirobot"}
                version={heroTemplate?.version}
                hero
              />
              <div className="float-tag">
                <span className="float-icon">
                  <Globe2 />
                </span>
                <div>
                  <b>
                    {tr(
                      "Website thật. Thương hiệu của bạn.",
                      "A real website. Your brand.",
                    )}
                  </b>
                  <small>
                    {tr(
                      "Menu · Khóa học · Lộ trình · Học viên",
                      "Pages · Courses · Pathways · Learners",
                    )}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="value-strip">
          <p>
            {tr("Không chỉ là một website.")}
            <br />
            <b>{tr("Là nền tảng cho điều bạn muốn xây.")}</b>
          </p>
          <span>
            <BookOpen />
            {tr("Giảng dạy có cấu trúc")}
          </span>
          <span>
            <Globe2 />
            {tr("Web & ứng dụng")}
          </span>
          <span>
            <ShieldCheck />
            {tr("Sở hữu và mở rộng")}
          </span>
        </section>
        <section className="section platform-how">
          <div className="section-heading">
            <div>
              <span className="eyebrow">HOW IT WORKS</span>
              <h2>
                {tr(
                  "Bạn xây học viện. YiEdu lo nền tảng.",
                  "Your academy. Built on YiEdu.",
                )}
              </h2>
            </div>
            <p>
              {tr(
                "Dành cho doanh nghiệp, trung tâm, giáo viên và đội ngũ đào tạo.",
                "For companies, training centers, teachers and education teams.",
              )}
            </p>
          </div>
          <div className="platform-step-grid">
            {[
              [
                "01",
                tr("Chọn website mẫu", "Choose a website"),
                tr(
                  "Xem đúng giao diện sẽ tạo, đọc thử bài và lộ trình trước khi chọn.",
                  "Preview the actual website, lessons and pathways before choosing.",
                ),
              ],
              [
                "02",
                tr("Đặt thương hiệu riêng", "Make it yours"),
                tr(
                  "Chỉnh logo, menu, nội dung Việt/Anh và bố cục bằng builder kéo thả.",
                  "Customize your logo, pages, Vietnamese/English content and layout.",
                ),
              ],
              [
                "03",
                tr("Soạn bài trong Studio", "Create in Studio"),
                tr(
                  "Tạo bài giảng, slide, video và mô phỏng; lưu thư viện để dùng lại.",
                  "Create lessons, slides, video and simulations in your reusable library.",
                ),
              ],
              [
                "04",
                tr("Xuất bản và bắt đầu dạy", "Publish and teach"),
                tr(
                  "Học viên đăng ký tại website của bạn, ghi danh, học bài và theo dõi tiến độ.",
                  "Learners join your website, enroll, study and track their progress.",
                ),
              ],
            ].map(([n, title, body]) => (
              <article key={n}>
                <small>{n}</small>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="templates" className="section template-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{tr("01 / CHỌN ĐIỂM KHỞI ĐẦU")}</span>
              <h2>
                {tr("Một mẫu phù hợp.")}
                <br />
                {tr("Vô vàn cách thể hiện.")}
              </h2>
            </div>
            <p>
              {tr("Chọn một nền tảng cho ý tưởng của bạn.")}
              <br />
              {tr("Mọi nội dung đều có thể chỉnh sửa.")}
            </p>
          </div>
          <TemplateGallery templates={templates} groups={groups} />
        </section>
        <section className="closing">
          <span className="eyebrow">
            {tr("BẮT ĐẦU NHỎ. XÂY DỰNG ĐIỀU LỚN.")}
          </span>
          <h2>
            {tr("Không gian tiếp theo")}
            <br />
            {tr("cho tri thức của bạn.")}
          </h2>
          <Link className="button light" href="#templates">
            {tr("Tạo hệ thống đầu tiên")}
            <ArrowRight size={18} />
          </Link>
        </section>
        {appearance?.show_pricing !== false && config?.billing && (
          <Pricing billing={config.billing} />
        )}
      </main>
      <footer>
        <span>{tr("© YiEdu · Không gian cho tri thức.")}</span>
        <Link href="/developer">{tr("Cùng xây hệ sinh thái ↗")}</Link>
        <span>{tr("Được tạo để bạn làm chủ.")}</span>
      </footer>
    </>
  );
}
