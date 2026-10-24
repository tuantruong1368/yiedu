"""Original teaching media built from the authored lesson, with explicit model limitations."""

import re


def simulation_for(module_id):
    if module_id in {
        "mechanics",
        "robot-kinematics",
        "mobile-robots",
        "state-estimation",
        "ros",
        "slam",
        "motion-planning",
        "robot-systems",
        "robot-capstone",
    }:
        return {
            "version": "1.0",
            "model": "differential-drive",
            "parameters": {
                "left": 0.6,
                "right": 0.9,
                "track": 0.5,
            },
        }
    if module_id in {"control", "robot-dynamics", "embedded", "humanoids", "sensors"}:
        return {
            "version": "1.0",
            "model": "pid",
            "parameters": {
                "kp": 2,
                "ki": 0,
                "kd": 0.4,
                "target": 1,
            },
        }
    if module_id in {"python", "c-programming", "data-structures", "algorithms", "testing"}:
        return {"version": "1.0", "model": "sorting", "parameters": {"size": 10, "speed": 4}}
    if module_id in {
        "operating-systems",
        "distributed-systems",
        "devops",
        "software-architecture",
        "quality-engineering",
        "api-engineering",
        "data-engineering",
        "se-capstone",
    }:
        return {
            "version": "1.0",
            "model": "scaling",
            "parameters": {
                "parallel": 0.9,
                "workers": 8,
            },
        }
    return None


def chunks(text, max_size=330):
    result, current = [], ""
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        if current and len(current) + len(sentence) > max_size:
            result.append(current)
            current = ""
        current = (current + " " + sentence).strip()
    if current:
        result.append(current)
    return result


def presentation_for(module, locale, video=False):
    vi = locale == "vi"
    title = module["title"][locale]
    slides = []

    def add(heading, body, notes="", duration=10):
        slides.append(
            {
                "id": f"scene-{len(slides) + 1}",
                "title": heading[:200],
                "body": body,
                "notes": notes or body,
                "duration": duration,
            }
        )

    add(
        title,
        "\n".join(module["questions"][locale]),
        "Sau bài, hãy trả lời các câu hỏi này bằng lời của mình."
        if vi
        else "After the lesson, answer these questions in your own words.",
    )
    for index, body in enumerate(chunks(module["concept"][locale])):
        add(
            ("Hiểu nguyên lý" if vi else "Understand the model") + f" · {index + 1}",
            body,
            duration=max(12, min(50, len(body.split()) / 2)),
        )
    for index, body in enumerate(chunks(module["example"][locale])):
        add(
            ("Lần theo ví dụ" if vi else "Work through the example") + f" · {index + 1}",
            body,
            duration=max(12, min(50, len(body.split()) / 2)),
        )
    add(
        "Dừng và thực hành" if vi else "Pause and practice",
        "\n".join(module["lab"][locale]),
        "Dừng video, thực hiện bài tập rồi đối chiếu bằng chứng, không chỉ xem tiếp."
        if vi
        else "Pause playback, do the exercise, then compare your evidence.",
        15,
    )
    for q, a in zip(module["questions"][locale], module["answers"][locale], strict=True):
        add(
            "Kiểm chứng kiến thức" if vi else "Check understanding",
            q,
            ("Đáp án tham khảo: " if vi else "Reference answer: ") + a,
            10,
        )
    add(
        "Bước tiếp theo" if vi else "Next step",
        (
            "Ghi lựa chọn thực hành, điểm tựa, thời lượng và cảm giác. "
            "Xem video từ nguồn gốc trong bài học."
            if vi
            else "Record your practice choices, support, duration and observations. "
            "See the original lesson video."
        )
        if module["id"].startswith("yoga-")
        else (
            "Nộp cách chạy, đầu vào, kết quả và một trường hợp thất bại. "
            "Đọc nguồn gốc trong bài học."
            if vi
            else "Submit commands, inputs, results and one failure case. "
            "Read the lesson references."
        ),
        duration=10,
    )
    return {
        "version": "1.0",
        "theme": "#263b66" if video else "#215d4c",
        "slides": slides,
        "source_url": "",
    }


def media_node(kind, title, data):
    return {"type": "studioAsset", "attrs": {"kind": kind, "title": title[:200], "payload": data}}


def guided_simulation(module_id, locale):
    data = simulation_for(module_id)
    if not data:
        return []
    vi = locale == "vi"
    guides = {
        "differential-drive": (
            "Đặt hai bánh 0,6 m/s: robot đi thẳng 6 m sau 10 s. Giữ L=0,5 m, "
            "đặt trái=0,6 và phải=0,9: v=0,75 m/s, ω=0,6 rad/s, bán kính quay=1,25 m. "
            "Dự đoán quỹ đạo, kéo thanh và kiểm chứng. Đổi dấu một bánh để quan sát quay tại chỗ. "
            "Mô hình bỏ qua trượt, quán tính, nhiễu và va chạm; không phải SLAM hoặc mô phỏng ROS.",
            "Equal wheel speeds of 0.6 m/s produce 6 m travel in 10 s. With L=0.5 m, "
            "left=0.6 and right=0.9, v=0.75 m/s, ω=0.6 rad/s and turning radius=1.25 m. "
            "Predict, adjust and verify the trajectory. Reverse one wheel to turn in place. "
            "This model ignores slip, inertia, noise and collisions; it is not SLAM or ROS.",
        ),
        "pid": (
            "Đặt I=D=0 và tăng P từ 0,5 lên 6. Ghi sai số sau 8 s và đỉnh đáp ứng. "
            "Thêm D rồi I: so sánh độ dao động và sai số. Hệ x″+2x′=u có bão hòa ±30; "
            "hệ số ở đây không được áp thẳng lên phần cứng. Hãy báo cả trường hợp điều khiển kém.",
            "Set I=D=0 and increase P from 0.5 to 6. Record the error at 8 s and peak response. "
            "Add D then I and compare oscillation and error. The plant x″+2x′=u saturates at ±30. "
            "These gains are not hardware tuning values. Report a poor-control case too.",
        ),
        "sorting": (
            "Chạy từng bước với n=4: có 6 lần so sánh. Tăng n=10: có 45 lần. "
            "Công thức n(n−1)/2 đếm vòng lặp của biến thể không dừng sớm, không phải số "
            "lần đổi chỗ "
            "cho mọi đầu vào. Viết phiên bản có cờ swapped; thử mảng đã sắp xếp và mảng đảo ngược.",
            "Step through n=4: 6 comparisons; n=10: 45 comparisons. n(n−1)/2 counts loop "
            "comparisons "
            "for this variant without early stopping, not swaps for every input. Implement a "
            "swapped flag and test sorted and reversed inputs.",
        ),
        "scaling": (
            "Với p=0,9 và N=8, S=1/(0,1+0,9/8)≈4,71. Tăng N đến 64 và đối chiếu "
            "giới hạn 10 lần khi N→∞. Đổi p=0,5: giới hạn còn 2 lần. Đây là cận lý tưởng, "
            "bỏ qua mạng, khóa, I/O và phân phối tải; hãy đo hệ thống thật trước khi mua "
            "thêm server.",
            "For p=0.9 and N=8, S=1/(0.1+0.9/8)≈4.71. Increase N to 64 and compare with "
            "the 10× asymptote. At p=0.5 the limit is 2×. This ideal model ignores networking, "
            "locks, I/O and load balancing. Benchmark before adding servers.",
        ),
    }
    return [
        {
            "type": "heading",
            "attrs": {"level": 2},
            "content": [
                {"type": "text", "text": "Thí nghiệm tương tác" if vi else "Interactive experiment"}
            ],
        },
        {
            "type": "paragraph",
            "content": [{"type": "text", "text": guides[data["model"]][0 if vi else 1]}],
        },
        media_node("simulation", "Phòng thí nghiệm" if vi else "Experiment lab", data),
    ]
