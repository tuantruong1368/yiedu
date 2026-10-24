# ruff: noqa: E501
"""A calm, fully editable yoga academy; no invented teachers, reviews or health promises."""

from html import escape

from yiedu.template_library import curriculum

CSS = """*{box-sizing:border-box}body{margin:0;background:#faf8f2;color:#33483a;font:16px/1.75 Arial,sans-serif}a{text-decoration:none;color:inherit}h1,h2,h3,p{margin-top:0}h1,h2{font-family:Georgia,serif;font-weight:400;line-height:1.12;letter-spacing:-1.5px}h1{font-size:clamp(46px,6vw,80px)}h2{font-size:clamp(32px,4vw,49px)}h3{font-size:21px;line-height:1.4}p{color:#697366}.y-wrap{width:min(1120px,90%);margin:auto}.y-eyebrow{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase}.y-hero{padding:70px 0;background:#f3f2e8}.y-split{display:grid;grid-template-columns:1.08fr 1fr;gap:60px;align-items:center}.y-hero p{max-width:540px;font-size:17px}.y-art{position:relative;max-width:470px;margin-left:auto}.y-art img{display:block;width:100%;border-radius:180px 180px 28px 28px}.y-art-note{position:absolute;left:-24px;bottom:38px;padding:16px 23px;background:#fffef8;border:1px solid #e0dfd1;border-radius:12px;font-size:12px;box-shadow:0 14px 40px #33483a0d}.y-art-note b{display:block;color:var(--accent);font-size:16px}.y-actions{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:30px 0}.y-button{display:inline-block;padding:14px 22px;background:var(--accent);border-radius:30px;color:white;font-size:13px;font-weight:700}.y-link{font-size:13px;border-bottom:1px solid #aab59b;padding:8px 0}.y-metrics{display:flex;gap:32px;border-top:1px solid #d8ddce;margin-top:36px;padding-top:22px}.y-metrics b{display:block;font:29px Georgia,serif}.y-metrics small{font-size:11px;color:#697366}.y-section{padding:75px 0}.y-soft{background:#eaf0e5}.y-peach{background:#f5ece1}.y-heading{max-width:700px;margin-bottom:35px}.y-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.y-card,.yd-course{display:block;border:1px solid #dae0d1;background:#fffdf7;border-radius:18px;padding:25px}.y-card small{display:block;color:#9a7257;font-size:11px;letter-spacing:1.5px;margin-bottom:20px}.y-card p,.yd-course p{font-size:13px;margin-bottom:0}.y-card h3,.yd-course h3{font:24px/1.3 Georgia,serif}.yd-course-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.yd-course{border-top:3px solid var(--accent)}.y-practice{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:center}.y-checks{list-style:none;padding:0}.y-checks li{padding:14px 0;border-bottom:1px solid #d6ddce}.y-checks li:before{content:'✓';color:var(--accent);margin-right:12px}.y-cta{text-align:center;padding:65px 6%;background:#e8ecdf;border-radius:28px}.y-cta p{max-width:570px;margin:20px auto}.y-notice{font-size:12px;border-left:2px solid #a9b59a;padding:12px 18px;color:#697366;margin:26px 0}.y-journal{white-space:pre-line;background:#fffdf7;border:1px solid #d8ddce;border-radius:20px;padding:30px;font-size:15px;line-height:2.4}@media(max-width:760px){.y-split,.y-practice{grid-template-columns:1fr;gap:30px}.y-art{max-width:380px;margin:auto}.y-art-note{left:0}.y-grid,.yd-course-grid{grid-template-columns:1fr}.y-hero,.y-section{padding:42px 0}.y-metrics{gap:22px}h1{font-size:48px}.y-grid{gap:14px}.y-card{padding:22px}}"""


def yoga_source(template, page, locale, brand):
    vi = locale == "vi"

    def tr(a, b):
        return a if vi else b

    name = escape(brand)
    modules = curriculum(template["id"])
    intro = escape(template["description" if vi else "description_en"])
    safety = tr(
        "Thực hành nhập môn tổng quát. Người có chấn thương, bệnh nền, đang mang thai hoặc có hạn chế vận động cần được hướng dẫn phù hợp trước khi tập. Không ép biên độ; dừng khi đau hoặc khó chịu.",
        "General beginner practice. Injuries, health conditions, pregnancy or mobility limitations require suitable individual guidance. Never force a range of movement; stop for pain or discomfort.",
    )
    actions = f'<div class="y-actions"><a class="y-button" data-template-link="programs" href="programs">{tr("Khám phá khóa học", "Explore the course")} ↗</a><a class="y-link" data-template-link="roadmap" href="roadmap">{tr("Lộ trình 4 tuần", "Your four-week pathway")}</a></div>'

    def weeks():
        return (
            '<div class="y-grid">'
            + "".join(
                f'<article class="y-card"><small>0{i + 1} / {tr("CHẶNG HỌC", "LEARNING STAGE")}</small><h3>{escape(m["title"] if vi else m["translations"]["en"]["title"])}</h3><p>{tr("4 bài · Chữ, video và nhật ký", "4 lessons · Text, video and reflection")}</p></article>'
                for i, m in enumerate(modules)
            )
            + "</div>"
        )

    def programs():
        return f'<section class="y-section" id="courses" data-gadget="yiedu.courses" data-course-limit="100"><div class="wrap y-wrap"><div class="y-heading"><span class="y-eyebrow">THE CURRICULUM</span><h2>{tr("Học từng chút. Hiểu cơ thể hơn.", "Learn a little. Notice a little more.")}</h2><p>{intro}</p></div><div data-template-preview="true">{weeks()}</div></div></section>'

    art = f'<div class="y-art"><img src="/illustrations/yoga-practice.svg" width="600" height="640" alt="{tr("Minh họa một buổi yoga ngồi nhẹ nhàng", "A gentle seated yoga practice illustration")}"><div class="y-art-note"><b>{tr("Một nhịp riêng của bạn", "At your own pace")}</b>{tr("Có ghế hỗ trợ · Có thể chia nhỏ", "Supported options · Flexible sessions")}</div></div>'
    if page == "home":
        body = f'<section class="y-hero"><div class="y-wrap y-split"><div><span class="y-eyebrow">{escape(template["tagline"][locale])}</span><h1>{escape(template["subtitle" if vi else "subtitle_en"])}</h1><p>{intro}</p>{actions}<div class="y-metrics"><div><b>4</b><small>{tr("tuần tham khảo", "flexible weeks")}</small></div><div><b>16</b><small>{tr("bài có hướng dẫn", "guided learning units")}</small></div><div><b>VI / EN</b><small>{tr("hướng dẫn bằng chữ", "written practice notes")}</small></div></div></div>{art}</div></section>'
        body += (
            f'<section class="y-section y-soft"><div class="y-wrap"><div class="y-heading"><span class="y-eyebrow">A KINDER WAY TO BEGIN</span><h2>{tr("Bắt đầu từ nơi bạn đang ở.", "Begin exactly where you are.")}</h2><p>{tr("Không cần chạm tới ngón chân hay theo kịp một ai. Học chuẩn bị, chọn điểm tựa và xây một thói quen vừa sức.", "No need to touch your toes or keep up with someone else. Learn to prepare, choose support and build a realistic routine.")}</p></div>{weeks()}</div></section>'
            + programs()
        )
    elif page == "programs":
        body = (
            f'<section class="y-hero"><div class="y-wrap"><span class="y-eyebrow">YOUR PRACTICE LIBRARY</span><h1>{tr("Một lộ trình. Nhiều cách bắt đầu.", "One pathway. Many ways to begin.")}</h1><p>{intro}</p></div></section>'
            + programs()
        )
    elif page == "roadmap":
        body = f'<section class="y-hero"><div class="y-wrap"><span class="y-eyebrow">FOUR GENTLE STAGES</span><h1>{tr("Chậm rãi, rồi thành thói quen.", "Slowly, a routine takes shape.")}</h1><p>{tr("Gợi ý 2–3 buổi ngắn mỗi tuần, có ngày nghỉ. Lặp lại hoặc học chậm hơn bất cứ lúc nào.", "Try two or three short sessions per week if suitable, with rest days. Repeat or slow down whenever you need.")}</p></div></section><section class="y-section" id="learning-map"><div class="y-wrap">{weeks()}<div class="y-notice">{safety}</div>{actions}</div></section>'
    elif page == "projects":
        journal = tr(
            "Ngày / thời điểm: __________\nBài hoặc video đã chọn: __________\nĐiểm tựa / phiên bản đã dùng: __________\nThời lượng thực tế: __________\nCảm giác trước / sau: __________\nĐiều muốn giữ hoặc đổi: __________",
            "Date / time: __________\nChosen lesson or video: __________\nSupport / variation used: __________\nActual duration: __________\nBefore / after observations: __________\nOne thing to keep or change: __________",
        )
        body = f'<section class="y-hero"><div class="y-wrap"><span class="y-eyebrow">PRACTICE & REFLECT</span><h1>{tr("Mỗi buổi, hiểu mình thêm một chút.", "A little more awareness, every session.")}</h1><p>{tr("Dùng mẫu nhật ký bên dưới cùng phần tự kiểm tra trong mỗi bài học. Tiến độ là hành trình của riêng bạn.", "Use this journal alongside each lesson’s reflection. Your progress follows your own circumstances.")}</p></div></section><section class="y-section"><div class="y-wrap y-practice"><div><h2>{tr("Ghi điều có ích. Bỏ điều không phù hợp.", "Keep what helps. Adjust what does not.")}</h2><ul class="y-checks"><li>{tr("Chuẩn bị chỗ tập và điểm tựa", "Prepare a clear space and support")}</li><li>{tr("Chọn mức vừa sức, có thể nghỉ", "Choose suitable options and rest")}</li><li>{tr("Ghi chép để buổi sau dễ bắt đầu", "Reflect to make next time easier")}</li></ul></div><div class="y-journal">{journal}</div></div></section>'
    else:
        body = f'<section class="y-hero"><div class="y-wrap y-split"><div><span class="y-eyebrow">{name}</span><h1>{tr("Một không gian để trở về với mình.", "A space to reconnect with yourself.")}</h1><p>{intro}</p><p>{tr("Hướng dẫn tự biên soạn, video tiếng Anh từ Yoga With Adriene và các lựa chọn nhẹ hơn. Không phải khóa đào tạo giáo viên hay chương trình điều trị.", "Original written guidance, English-language Yoga With Adriene videos and gentler options. This is neither teacher training nor a treatment program.")}</p>{actions}</div>{art}</div></section>'
    body += f'<section class="y-section y-peach"><div class="y-wrap"><div class="y-cta"><span class="y-eyebrow">{name}</span><h2>{tr("Dành một khoảng nhỏ cho chính mình.", "Make a little room for yourself.")}</h2><p>{tr("Một bài học ngắn, một điểm tựa phù hợp, một khởi đầu không vội.", "A short lesson, suitable support and an unhurried beginning.")}</p><a class="y-button" data-template-link="programs" href="programs">{tr("Bắt đầu khám phá", "Begin exploring")} ↗</a></div><p class="y-notice">{safety}</p></div></section>'
    return {
        "html": '<div class="yoga-academy">' + body + "</div>",
        "css": f":root{{--accent:{template['color']};}}" + CSS,
    }
