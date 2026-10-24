"use client";
import { Translate, translator } from "@/lib/i18n/locale";
import type { Config } from "@puckeditor/core";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
export type Course = {
  id: string;
  title: string;
  description: string;
  slug: string;
};
export function makeConfig(
  courses: Course[] = [],
  slug = "",
  tr: Translate = translator("vi"),
): Config {
  return {
    components: {
      Hero: {
        label: tr("Banner chính"),
        fields: {
          eyebrow: { type: "text", label: tr("Dòng giới thiệu") },
          title: { type: "text", label: tr("Tiêu đề") },
          description: { type: "textarea", label: tr("Mô tả") },
          buttonText: { type: "text", label: tr("Nút hành động") },
        },
        defaultProps: {
          eyebrow: tr("CHÀO MỪNG BẠN"),
          title: tr("Không gian học tập của bạn."),
          description: tr("Bắt đầu một hành trình mới."),
          buttonText: tr("Khám phá khóa học"),
        },
        render: ({ eyebrow, title, description, buttonText }: any) => (
          <section className="site-hero">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <a href="#courses" className="button">
              {buttonText}
              <ArrowRight size={18} />
            </a>
            <div className="site-hero-decoration">
              <BookOpen size={130} />
            </div>
          </section>
        ),
      },
      Text: {
        label: tr("Nội dung giới thiệu"),
        fields: {
          title: { type: "text", label: tr("Tiêu đề") },
          body: { type: "textarea", label: tr("Nội dung") },
        },
        defaultProps: {
          title: tr("Điều làm chúng tôi khác biệt."),
          body: tr("Thay nội dung này bằng câu chuyện của bạn."),
        },
        render: ({ title, body }: any) => (
          <section className="site-text">
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ),
      },
      Courses: {
        label: tr("Danh sách khóa học"),
        fields: { title: { type: "text", label: tr("Tiêu đề") } },
        defaultProps: { title: tr("Khóa học nổi bật") },
        render: ({ title }: any) => (
          <section className="site-courses" id="courses">
            <span className="eyebrow">{tr("HỌC TẬP VÀ PHÁT TRIỂN")}</span>
            <h2>{title}</h2>
            <div className="course-grid">
              {courses.length ? (
                courses.map((c, i) => (
                  <Link
                    href={"/t/" + slug + "/learn?course=" + c.id}
                    className="course-card"
                    key={c.id}
                  >
                    <div className={"course-art art-" + (i % 3)}>
                      <BookOpen size={40} />
                      <span>0{i + 1}</span>
                    </div>
                    <div>
                      <small>{tr("KHÓA HỌC")}</small>
                      <h3>{c.title}</h3>
                      <p>
                        {c.description ||
                          tr("Khám phá kiến thức và thực hành theo lộ trình.")}
                      </p>
                      <span className="text-link">
                        {tr("Vào học")}
                        <ArrowRight size={15} />
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty">
                  <BookOpen />
                  <h3>{tr("Những bài học đang được chuẩn bị.")}</h3>
                  <p>
                    {tr("Khóa học sẽ xuất hiện tại đây khi được xuất bản.")}
                  </p>
                </div>
              )}
            </div>
          </section>
        ),
      },
      Stats: {
        label: tr("Ba điểm nổi bật"),
        fields: {
          first: { type: "text", label: tr("Điểm thứ nhất") },
          second: { type: "text", label: tr("Điểm thứ hai") },
          third: { type: "text", label: tr("Điểm thứ ba") },
        },
        defaultProps: {
          first: tr("Học theo lộ trình"),
          second: tr("Thực hành thực tế"),
          third: tr("Tiến bộ mỗi ngày"),
        },
        render: ({ first, second, third }: any) => (
          <section className="site-stats">
            {[first, second, third].map((s, i) => (
              <div key={i}>
                <span>0{i + 1}</span>
                <h3>{s}</h3>
              </div>
            ))}
          </section>
        ),
      },
    },
  };
}
