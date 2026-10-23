"use client";
import type { Config } from "@puckeditor/core";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
export type Course = {
  id: string;
  title: string;
  description: string;
  slug: string;
};
export function makeConfig(courses: Course[] = [], slug = ""): Config {
  return {
    components: {
      Hero: {
        label: "Banner chính",
        fields: {
          eyebrow: { type: "text", label: "Dòng giới thiệu" },
          title: { type: "text", label: "Tiêu đề" },
          description: { type: "textarea", label: "Mô tả" },
          buttonText: { type: "text", label: "Nút hành động" },
        },
        defaultProps: {
          eyebrow: "CHÀO MỪNG BẠN",
          title: "Không gian học tập của bạn.",
          description: "Bắt đầu một hành trình mới.",
          buttonText: "Khám phá khóa học",
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
        label: "Nội dung giới thiệu",
        fields: {
          title: { type: "text", label: "Tiêu đề" },
          body: { type: "textarea", label: "Nội dung" },
        },
        defaultProps: {
          title: "Điều làm chúng tôi khác biệt.",
          body: "Thay nội dung này bằng câu chuyện của bạn.",
        },
        render: ({ title, body }: any) => (
          <section className="site-text">
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ),
      },
      Courses: {
        label: "Danh sách khóa học",
        fields: { title: { type: "text", label: "Tiêu đề" } },
        defaultProps: { title: "Khóa học nổi bật" },
        render: ({ title }: any) => (
          <section className="site-courses" id="courses">
            <span className="eyebrow">HỌC TẬP VÀ PHÁT TRIỂN</span>
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
                      <small>KHÓA HỌC</small>
                      <h3>{c.title}</h3>
                      <p>
                        {c.description ||
                          "Khám phá kiến thức và thực hành theo lộ trình."}
                      </p>
                      <span className="text-link">
                        Vào học <ArrowRight size={15} />
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty">
                  <BookOpen />
                  <h3>Những bài học đang được chuẩn bị.</h3>
                  <p>Khóa học sẽ xuất hiện tại đây khi được xuất bản.</p>
                </div>
              )}
            </div>
          </section>
        ),
      },
      Stats: {
        label: "Ba điểm nổi bật",
        fields: {
          first: { type: "text", label: "Điểm thứ nhất" },
          second: { type: "text", label: "Điểm thứ hai" },
          third: { type: "text", label: "Điểm thứ ba" },
        },
        defaultProps: {
          first: "Học theo lộ trình",
          second: "Thực hành thực tế",
          third: "Tiến bộ mỗi ngày",
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
