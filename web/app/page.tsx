import { getT } from "@/lib/i18n/server";
import TemplateGallery from "@/components/template-gallery";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  BookOpen,
  Globe2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/shared";
import { publicApi } from "@/lib/api";
import SiteView from "@/components/site-view";
export const dynamic = "force-dynamic";
export default async function Home() {
  const tr = await getT();
  const templates = (await publicApi("/catalog/templates")) || [];

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
        <section className="hero-home">
          <div>
            <span className="eyebrow">
              <span className="status-dot" />
              {tr("NỀN TẢNG HỌC TẬP CỦA RIÊNG BẠN")}
            </span>
            <h1>
              {tr("Tri thức của bạn.")}
              <br />
              {tr("Một thế giới")}
              <br />
              <em>{tr("khả năng mới.")}</em>
            </h1>
            <p>
              {tr(
                "Từ ý tưởng đến một hệ thống đào tạo mang thương hiệu riêng. Tạo không gian để giảng dạy, kết nối và cùng học viên tiến xa.",
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
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="mock-browser">
              <div className="browser-bar">
                <i />
                <i />
                <i />
                <span>your-academy.yiedu.vn</span>
              </div>
              <div className="mock-content">
                <div className="mock-label">
                  YOUR ACADEMY <ArrowUpRight size={16} />
                </div>
                <h2>
                  {tr("Những điều lớn lao")}
                  <br />
                  {tr("bắt đầu từ")}
                  <br />
                  <em>{tr("một bài học.")}</em>
                </h2>
                <div className="mock-button">
                  {tr("Khám phá hành trình")}
                  <ArrowRight size={15} />
                </div>
                <div className="mock-grid">
                  <div className="mock-course moss">
                    <BookOpen />
                    <span>{tr("Kỹ năng nền tảng")}</span>
                  </div>
                  <div className="mock-course clay">
                    <Sparkles />
                    <span>{tr("Thực hành sáng tạo")}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="float-tag">
              <span className="float-icon">
                <Globe2 />
              </span>
              <div>
                <b>{tr("Thương hiệu của bạn")}</b>
                <small>{tr("Một không gian. Nhiều khả năng.")}</small>
              </div>
            </div>
            <div className="art-caption">
              {tr("THIẾT KẾ ĐỂ HỌC TẬP. XÂY DỰNG ĐỂ PHÁT TRIỂN.")}
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
        <section id="templates" className="section">
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
          <TemplateGallery templates={templates} />
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
      </main>
      <footer>
        <span>{tr("© YiEdu · Không gian cho tri thức.")}</span>
        <Link href="/developer">{tr("Cùng xây hệ sinh thái ↗")}</Link>
        <span>{tr("Được tạo để bạn làm chủ.")}</span>
      </footer>
    </>
  );
}
