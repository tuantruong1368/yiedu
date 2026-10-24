import { getT } from "@/lib/i18n/server";
import { Header } from "@/components/shared";
import { Puzzle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { publicApi } from "@/lib/api";
export default async function Page() {
  const tr = await getT();

  const catalog = (await publicApi("/catalog/extensions")) || [];
  return (
    <>
      <Header />
      <main className="workspace">
        <div className="page-heading">
          <div>
            <span className="eyebrow">{tr("HỆ SINH THÁI YIEDU")}</span>
            <h1>
              {tr("Thêm khả năng.")}
              <br />
              {tr("Mở rộng giá trị.")}
            </h1>
            <p>
              {tr(
                "Tiện ích được tích hợp để hệ thống tiếp tục phát triển cùng bạn.",
              )}
            </p>
          </div>
          <Link className="button" href="/developer">
            {tr("Dành cho developer")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="extension-grid">
          {catalog.map((p: any) => (
            <article className="panel extension-card" key={p.package_id}>
              <span className="feature-icon">
                <Puzzle />
              </span>
              <span className="pill">{tr("FIRST-PARTY · MIỄN PHÍ")}</span>
              <h2>{tr(p.name)}</h2>
              <p>{tr(p.description)}</p>
              <Link className="button ghost" href="/dashboard">
                {tr("Kích hoạt trong quản trị tenant ↗")}
              </Link>
            </article>
          ))}
        </div>
        <div className="notice spaced">
          {tr(
            "Marketplace thương mại đang được phát triển. Chưa nhận thanh toán hoặc phân phối code bên thứ ba.",
          )}
        </div>
      </main>
    </>
  );
}
