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
const templates = [
  {
    id: "academy",
    name: "Academy",
    category: "TRUNG TÂM ĐÀO TẠO",
    color: "#215d4c",
    text: "Học có mục tiêu.\nTiến xa hơn mỗi ngày.",
  },
  {
    id: "creator",
    name: "Studio",
    category: "GIẢNG VIÊN ĐỘC LẬP",
    color: "#a84a2b",
    text: "Điều bạn biết.\nGiá trị bạn trao.",
  },
  {
    id: "technology",
    name: "Future Lab",
    category: "CÔNG NGHỆ & ROBOTICS",
    color: "#3449a3",
    text: "Build. Learn.\nCreate the future.",
  },
];
export default async function Home() {
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
              <span className="status-dot" /> NỀN TẢNG HỌC TẬP CỦA RIÊNG BẠN
            </span>
            <h1>
              Tri thức của bạn.
              <br />
              Một thế giới
              <br />
              <em>khả năng mới.</em>
            </h1>
            <p>
              Từ ý tưởng đến một hệ thống đào tạo mang thương hiệu riêng. Tạo
              không gian để giảng dạy, kết nối và cùng học viên tiến xa.
            </p>
            <div className="actions">
              <Link className="button" href="#templates">
                Bắt đầu từ một mẫu <ArrowRight size={18} />
              </Link>
              <Link className="text-link" href="/dashboard">
                Mở không gian của tôi <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="hero-trust">
              <span>
                <Check size={15} /> Thiết kế linh hoạt
              </span>
              <span>
                <Check size={15} /> Dữ liệu thuộc về bạn
              </span>
              <span>
                <Check size={15} /> Sẵn sàng mở rộng
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
                  Những điều lớn lao
                  <br />
                  bắt đầu từ
                  <br />
                  <em>một bài học.</em>
                </h2>
                <div className="mock-button">
                  Khám phá hành trình <ArrowRight size={15} />
                </div>
                <div className="mock-grid">
                  <div className="mock-course moss">
                    <BookOpen />
                    <span>Kỹ năng nền tảng</span>
                  </div>
                  <div className="mock-course clay">
                    <Sparkles />
                    <span>Thực hành sáng tạo</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="float-tag">
              <span className="float-icon">
                <Globe2 />
              </span>
              <div>
                <b>Thương hiệu của bạn</b>
                <small>Một không gian. Nhiều khả năng.</small>
              </div>
            </div>
            <div className="art-caption">
              THIẾT KẾ ĐỂ HỌC TẬP. XÂY DỰNG ĐỂ PHÁT TRIỂN.
            </div>
          </div>
        </section>
        <section className="value-strip">
          <p>
            Không chỉ là một website.
            <br />
            <b>Là nền tảng cho điều bạn muốn xây.</b>
          </p>
          <span>
            <BookOpen /> Giảng dạy có cấu trúc
          </span>
          <span>
            <Globe2 /> Web & ứng dụng
          </span>
          <span>
            <ShieldCheck /> Sở hữu và mở rộng
          </span>
        </section>
        <section id="templates" className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / CHỌN ĐIỂM KHỞI ĐẦU</span>
              <h2>
                Một mẫu phù hợp.
                <br />
                Vô vàn cách thể hiện.
              </h2>
            </div>
            <p>
              Chọn một nền tảng cho ý tưởng của bạn.
              <br />
              Mọi nội dung đều có thể chỉnh sửa.
            </p>
          </div>
          <div className="template-grid">
            {templates.map((t, i) => (
              <Link
                key={t.id}
                href={"/register?template=" + t.id}
                className="template-card"
              >
                <div
                  className="template-preview"
                  style={{ background: t.color }}
                >
                  <div className="mini-nav">
                    <b>{t.name.toUpperCase()}</b>
                    <span>Khóa học &nbsp; Giới thiệu ↗</span>
                  </div>
                  <div className="mini-title">
                    {t.text.split("\n").map((s, j) => (
                      <span key={j}>
                        {s}
                        <br />
                      </span>
                    ))}
                  </div>
                  <div className="mini-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span className="template-number">0{i + 1}</span>
                  <div className="preview-hover">
                    Dùng mẫu này <ArrowUpRight size={19} />
                  </div>
                </div>
                <div className="template-info">
                  <div>
                    <small>{t.category}</small>
                    <h3>{t.name}</h3>
                  </div>
                  <ArrowUpRight />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="closing">
          <span className="eyebrow">BẮT ĐẦU NHỎ. XÂY DỰNG ĐIỀU LỚN.</span>
          <h2>
            Không gian tiếp theo
            <br />
            cho tri thức của bạn.
          </h2>
          <Link className="button light" href="#templates">
            Tạo hệ thống đầu tiên <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer>
        <span>© YiEdu · Không gian cho tri thức.</span>
        <Link href="/developer">Cùng xây hệ sinh thái ↗</Link>
        <span>Được tạo để bạn làm chủ.</span>
      </footer>
    </>
  );
}
