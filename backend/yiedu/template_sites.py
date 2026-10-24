# ruff: noqa: E501
"""Editable, bilingual five-page sites with distinct purpose-driven compositions."""

from html import escape

from yiedu.authoring import validate_site
from yiedu.template_library import curriculum, get_module, get_template

BASE_CSS = """*{box-sizing:border-box}body{margin:0;background:#fafaf7;color:#202d32;font-family:Arial,sans-serif;line-height:1.65}h1,h2,h3,p{margin-top:0}h1{font-size:clamp(40px,5.2vw,76px);line-height:1.05;letter-spacing:-3px}h2{font-size:clamp(28px,3.5vw,46px);line-height:1.15;letter-spacing:-1.4px}h3{font-size:20px;line-height:1.3}a{text-decoration:none;color:inherit}.wrap{width:min(1140px,90%);margin:auto}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:800;text-transform:uppercase}.hero{padding:80px 0}.split{display:grid;grid-template-columns:1.15fr 1fr;gap:60px;align-items:center}.hero p{font-size:18px;max-width:650px}.pill{display:inline-block;padding:6px 12px;border:1px solid #ccd4d7;border-radius:30px;font-size:11px}.button{display:inline-block;padding:14px 22px;border-radius:8px;color:white;background:var(--accent);font-weight:700;font-size:14px}.button.secondary{background:transparent;color:inherit;border:1px solid currentColor}.actions{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0}.section{padding:72px 0}.section.soft{background:#edf0ed}.section-title{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:30px}.section-title p{max-width:440px;font-size:14px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.card,.yd-course{display:block;padding:26px;border:1px solid #dfe4df;border-radius:16px;background:white}.card .number{display:block;color:var(--accent);font-size:40px;letter-spacing:-2px;font-weight:800}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;border-top:1px solid #d6dcd9;padding-top:22px;margin-top:32px}.metrics b{display:block;font-size:28px}.metrics small{font-size:11px}.robot-stage{min-height:380px;border-radius:32px;background:#ece7fa;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}.robot-stage:before{content:'';position:absolute;width:340px;height:340px;border:1px solid #cbbde9;border-radius:50%}.robot-core{width:170px;height:190px;border-radius:65px 65px 45px 45px;background:white;box-shadow:0 28px 45px #4f308b33;position:relative;transform:rotate(-7deg)}.robot-face{width:130px;height:70px;border-radius:30px;background:#242139;position:absolute;left:20px;top:32px;display:flex;gap:30px;align-items:center;justify-content:center}.robot-eye{display:block;width:12px;height:18px;border-radius:12px;background:#aa8eff}.robot-core:after{content:'+';position:absolute;font-size:40px;font-weight:bold;color:var(--accent);left:72px;bottom:12px}.floating-label{position:absolute;bottom:25px;right:20px;background:white;padding:12px 18px;border-radius:12px;font-size:12px}.console{background:#102329;color:#b7e7db;border-radius:18px;padding:28px;min-height:340px;font:14px/1.9 monospace;box-shadow:0 25px 55px #1233;white-space:pre-wrap}.console .green{color:#67dda6}.dashboard-art{padding:28px;background:white;border:1px solid #dbe5e9;border-radius:20px;box-shadow:0 20px 50px #19426911}.dashboard-art .bar{height:14px;border-radius:6px;background:#e3ebef;margin:18px 0}.dashboard-art .bar.active{background:var(--accent);width:72%}.dashboard-art .progress{padding:20px;background:#eff5f7;border-radius:14px;margin:20px 0}.teacher-portrait{aspect-ratio:1;background:#efe3d4;border-radius:50% 50% 12px 12px;display:grid;place-items:center;position:relative}.teacher-portrait .letter{font-family:Georgia,serif;font-size:160px;color:var(--accent)}.quote{font-family:Georgia,serif;font-size:24px;line-height:1.5}.language-circles{min-height:360px;position:relative}.speech{position:absolute;border-radius:30px;padding:24px 34px;background:#fff;border:1px solid #ecc6ce;font-size:32px;font-weight:bold;box-shadow:0 16px 36px #9332}.speech.one{top:30px;left:15px;transform:rotate(-8deg)}.speech.two{top:140px;right:10px;transform:rotate(7deg);background:var(--accent);color:white}.speech.three{bottom:0;left:40px;font-size:18px}.syllabus{border-left:2px solid var(--accent);padding-left:28px;margin:24px 0}.syllabus article{padding:18px 0;border-bottom:1px solid #dde3e1}.syllabus b{font-size:13px}.syllabus ul{padding-left:18px;font-size:14px}.notice{border-left:3px solid var(--accent);padding:16px 20px;background:#f0f0ed;font-size:13px;margin:24px 0}.cta{padding:55px;border-radius:24px;background:var(--accent);color:white;display:flex;justify-content:space-between;align-items:center;gap:30px}.cta .button{background:white;color:#1e3132}.yd-course-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.yd-course h3{font-size:18px}.yd-course p{font-size:13px}.project-card{min-height:240px;display:flex;flex-direction:column;justify-content:space-between}.project-card code{font-size:12px;color:var(--accent)}.editorial h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(48px,6vw,90px)}.editorial .card{border-radius:0;border-top:3px solid var(--accent)}.robot .hero,.lab .hero{background:#f4f1fc}.software .hero{background:#eaf5f1}.enterprise .hero{background:#edf4fa}.teacher .hero{background:#faf1e5}.language .hero{background:#fff0f3}.university .hero{background:#243c72;color:white}.university .hero .eyebrow{color:#b7cff6}.data .hero{background:#edf4fa}.sales .hero{background:#fcf0e8}@media(max-width:760px){.split{grid-template-columns:1fr;gap:30px}.grid,.yd-course-grid{grid-template-columns:1fr}.hero{padding:45px 0}h1{letter-spacing:-1.5px}.section{padding:42px 0}.section-title,.cta{display:block}.robot-stage{min-height:290px}.teacher-portrait{max-width:380px}.metrics{gap:12px}.cta{padding:30px}}"""


def tr(locale, vi, en):
    return vi if locale == "vi" else en


def source_for(t, page, locale, brand):
    modules = curriculum(t["id"])
    name = escape(brand)
    headline = escape(t["subtitle" if locale == "vi" else "subtitle_en"])
    desc = escape(t["description" if locale == "vi" else "description_en"])

    def title(key):
        return escape(key["title"] if locale == "vi" else key["translations"]["en"]["title"])

    eyebrow = escape(t["tagline"][locale])
    browse = tr(locale, "Khám phá chương trình", "Explore programs")
    actions = f'<div class="actions"><a class="button" data-template-link="programs" href="#courses">{browse} ↗</a><a class="button secondary" href="#learning-map">{tr(locale, "Xem lộ trình", "View pathway")}</a></div>'
    metrics = f'<div class="metrics"><div><b>{len(modules)}</b><small>{tr(locale, "CHUYÊN ĐỀ", "STUDY UNITS")}</small></div><div><b>{4 * len(modules)}</b><small>{tr(locale, "BÀI HỌC CÔ ĐỌNG", "COMPACT LESSONS")}</small></div><div><b>{8 if t["semesters"] else 2}</b><small>{tr(locale, "HỌC KỲ THAM CHIẾU" if t["semesters"] else "NGÔN NGỮ", "REFERENCE SEMESTERS" if t["semesters"] else "LANGUAGES")}</small></div></div>'
    if t["layout"] in {"robot", "lab"}:
        art = '<div class="robot-stage"><div class="robot-core"><div class="robot-face"><span class="robot-eye"></span><span class="robot-eye"></span></div></div><span class="floating-label">SIMULATE → BUILD → VERIFY</span></div>'
    elif t["layout"] == "software":
        art = '<pre class="console"><code>$ learn --by-building\n\nrequirements → design\ncode → tests → review\n\n&gt; tenant isolation: PASS\n&gt; restore rehearsal: PASS\n\n<span class="green">// illustrative workflow</span></code></pre>'
    elif t["layout"] == "teacher":
        art = f'<div class="teacher-portrait"><span class="letter">{escape(brand[:1].upper())}</span><span class="floating-label">{tr(locale, "Học qua thực hành", "Learn through practice")}</span></div>'
    elif t["layout"] == "language":
        art = '<div class="language-circles"><div class="speech one">Hello.</div><div class="speech two">Xin chào!</div><div class="speech three">Write · Speak · Connect</div></div>'
    else:
        art = f'<div class="dashboard-art"><span class="eyebrow">{name}</span><div class="bar active"></div><div class="bar"></div><div class="progress"><b>{tr(locale, "Bắt đầu một năng lực mới", "Start a new capability")}</b><p>{title(modules[0])}</p></div><div class="bar active"></div><small>{tr(locale, "Minh họa cấu trúc chương trình", "Program structure illustration")}</small></div>'
    note = tr(
        locale,
        "Bài học YiEdu biên soạn cô đọng, có thực hành và đáp án tham khảo. Cần chuyên môn review trước khi dùng làm chương trình chính thức; không phải văn bằng được kiểm định.",
        "Compact YiEdu-authored lessons include practice and reference solutions. Qualified review is needed before formal teaching; this is not an accredited degree.",
    )

    def cards():
        return "".join(
            f'<article class="card"><span class="number">{i + 1:02d}</span><h3>{title(m)}</h3><p>{escape((m["description"] if locale == "vi" else m["translations"]["en"]["description"])[:170])}…</p></article>'
            for i, m in enumerate(modules[:3])
        )

    def courses(limit):
        placeholder = "".join(
            f'<article class="yd-course"><h3>{title(m)}</h3><p>4 {tr(locale, "bài học + thực hành", "lessons + practice")}</p></article>'
            for m in modules[: min(limit, 6)]
        )
        return f'<section class="section" id="courses" data-gadget="yiedu.courses" data-course-limit="{limit}"><div class="wrap"><div class="section-title"><div><span class="eyebrow">CURRICULUM</span><h2>{tr(locale, "Học từ nền tảng, tiến bằng thực hành.", "Build foundations through practice.")}</h2></div><p>{note}</p></div><div data-template-preview="true" class="grid">{placeholder}</div></div></section>'

    def roadmap():
        groups = t["semesters"] or [t["module_ids"]]
        blocks = []
        for i, group in enumerate(groups):
            label = (
                tr(
                    locale,
                    f"Năm {i // 2 + 1} · Học kỳ {i + 1}",
                    f"Year {i // 2 + 1} · Semester {i + 1}",
                )
                if t["semesters"]
                else tr(locale, "Lộ trình thực hành", "Practice pathway")
            )
            items = "".join(
                "<li>" + escape(get_module(k)["title"][locale]) + "</li>" for k in group
            )
            blocks.append(f"<article><b>{label}</b><ul>{items}</ul></article>")
        return (
            f'<section class="section soft" id="learning-map"><div class="wrap"><span class="eyebrow">LEARNING MAP</span><h2>{tr(locale, "Mỗi chặng, một năng lực.", "A capability at every stage.")}</h2><p>{note}</p><div class="syllabus">'
            + "".join(blocks)
            + "</div></div></section>"
        )

    def projects():
        selected = [get_module(k) for k in t["module_ids"][-3:]]
        blocks = "".join(
            f'<article class="card project-card"><div><span class="eyebrow">PROJECT {i + 1:02d}</span><h3>{escape(m["title"][locale])}</h3><p>{escape(m["lab"][locale][0])}</p></div><code>README · Evidence · Review</code></article>'
            for i, m in enumerate(selected)
        )
        return f'<section class="section"><div class="wrap"><div class="section-title"><h2>{tr(locale, "Học đến đâu, tạo sản phẩm đến đó.", "Turn learning into demonstrable work.")}</h2><p>{tr(locale, "Bằng chứng thực hành quan trọng hơn một nút hoàn thành.", "Practical evidence matters more than a completion button.")}</p></div><div class="grid">{blocks}</div></div></section>'

    if page == "home":
        hero = f'<section class="hero"><div class="wrap split"><div><span class="eyebrow">{eyebrow}</span><h1>{headline}</h1><p>{desc}</p>{actions}{metrics}</div>{art}</div></section>'
        if t["layout"] == "design":
            hero = f'<section class="hero editorial"><div class="wrap"><span class="eyebrow">{eyebrow}</span><h1>{headline}</h1><div class="split"><p class="quote">{desc}</p>{actions}</div>{metrics}</div></section>'
        body = (
            hero
            + f'<section class="section"><div class="wrap"><span class="eyebrow">{name}</span><h2>{tr(locale, "Nền tảng rõ ràng. Thực hành có bằng chứng.", "Clear foundations. Evidence-based practice.")}</h2><div class="grid">{cards()}</div></div></section>'
            + courses(6)
            + roadmap()
            + projects()
        )
    elif page == "programs":
        body = (
            f'<section class="hero"><div class="wrap"><span class="eyebrow">PROGRAMS</span><h1>{tr(locale, "Chương trình học", "Programs")}</h1><p>{desc}</p>{metrics}</div></section>'
            + courses(100)
        )
    elif page == "roadmap":
        body = (
            f'<section class="hero"><div class="wrap"><span class="eyebrow">LEARNING PATHWAYS</span><h1>{tr(locale, "Đi từng bước. Xây năng lực thật.", "Move step by step. Build capability.")}</h1><p>{desc}</p></div></section>'
            + roadmap()
        )
    elif page == "projects":
        body = (
            f'<section class="hero"><div class="wrap"><span class="eyebrow">LAB & PORTFOLIO</span><h1>{tr(locale, "Từ bài học đến sản phẩm.", "From learning to working artifacts.")}</h1><p>{note}</p></div></section>'
            + projects()
        )
    else:
        body = f'<section class="hero"><div class="wrap split"><div><span class="eyebrow">ABOUT {name}</span><h1>{name}</h1><p>{desc}</p><p class="quote">{tr(locale, "Học để hiểu. Làm để kiểm chứng.", "Learn to understand. Build to verify.")}</p></div>{art}</div></section><section class="section"><div class="wrap"><h2>{tr(locale, "Cách chúng tôi học", "How we learn")}</h2><div class="grid">{cards()}</div><div class="notice">{note}</div><p>{tr(locale, "Học liệu bên ngoài được liên kết để đọc thêm, không sao chép hoặc ngụ ý được tổ chức nguồn bảo trợ.", "External readings are linked, not reproduced; references do not imply institutional endorsement.")}</p></div></section>'
    body += f'<section class="section"><div class="wrap"><div class="cta"><div><span class="eyebrow">{name}</span><h2>{tr(locale, "Bắt đầu bằng một bài học.", "Start with one learning unit.")}</h2></div><a class="button" data-template-link="programs" href="#courses">{browse} ↗</a></div></div></section>'
    return {
        "html": f'<div class="{t["layout"]}">{body}</div>',
        "css": f":root{{--accent:{t['color']};}}" + BASE_CSS,
    }


def site_document(template_id, brand=None):
    t = get_template(template_id)
    brand = brand or t["name"]
    names = [
        ("home", "", "Trang chủ", "Home"),
        ("programs", "programs", "Chương trình", "Programs"),
        ("roadmap", "roadmap", "Lộ trình", "Pathway"),
        ("projects", "projects", "Dự án", "Projects"),
        ("about", "about", "Giới thiệu", "About"),
    ]
    pages = [
        {
            "id": key,
            "slug": slug,
            "title": {"vi": vi, "en": en},
            "vi": source_for(t, key, "vi", brand),
            "en": source_for(t, key, "en", brand),
        }
        for key, slug, vi, en in names
    ]
    return validate_site(
        {
            "schema_version": "2.0",
            "engine": "grapesjs",
            "default_locale": "vi",
            "branding": {
                "text": brand[:100],
                "logo_url": "",
                "color": t["color"],
                "variant": "rounded",
            },
            "pages": pages,
            "menu": [
                {"id": "menu-" + key, "page_id": key, "label": {"vi": vi, "en": en}}
                for key, _, vi, en in names
            ],
        }
    )
