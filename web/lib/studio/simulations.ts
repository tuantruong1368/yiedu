import type { SimulationData, SimulationModel } from "./types";
export const models: Record<
  SimulationModel,
  {
    vi: string;
    en: string;
    description: [string, string];
    controls: Record<string, [string, string, number, number, number, number]>;
  }
> = {
  "differential-drive": {
    vi: "Robot hai bánh",
    en: "Differential drive",
    description: [
      "Mô hình động học phẳng, bánh không trượt: v=(vL+vR)/2, ω=(vR−vL)/L. Dự đoán quỹ đạo trước khi thay vận tốc.",
      "Planar no-slip kinematics: v=(vL+vR)/2, ω=(vR−vL)/L. Predict the path before adjusting wheel speeds.",
    ],
    controls: {
      left: ["Bánh trái (m/s)", "Left wheel (m/s)", -2, 2, 0.1, 0.6],
      right: ["Bánh phải (m/s)", "Right wheel (m/s)", -2, 2, 0.1, 0.9],
      track: ["Khoảng bánh L (m)", "Track width L (m)", 0.1, 2, 0.1, 0.5],
    },
  },
  pid: {
    vi: "Điều khiển PID",
    en: "PID control",
    description: [
      "Hệ mô hình x″+2x′=u; u được giới hạn ±30. Đổi P/I/D và quan sát quá điều chỉnh, sai số xác lập. Đây là mô hình minh họa, không thay kiểm chứng robot thật.",
      "Model x″+2x′=u with ±30 actuator saturation. Change P/I/D and inspect overshoot and steady-state error. This teaching model is not hardware validation.",
    ],
    controls: {
      kp: ["Hệ số P", "P gain", 0, 8, 0.1, 2],
      ki: ["Hệ số I", "I gain", 0, 4, 0.1, 0],
      kd: ["Hệ số D", "D gain", 0, 4, 0.1, 0.4],
      target: ["Giá trị đặt", "Setpoint", 0.1, 10, 0.1, 1],
    },
  },
  sorting: {
    vi: "Sắp xếp nổi bọt",
    en: "Bubble sort",
    description: [
      "Mỗi bước so sánh hai phần tử cạnh nhau, đổi chỗ nếu sai thứ tự. Đếm số lần so sánh và đối chiếu n(n−1)/2 cho thuật toán không dừng sớm.",
      "Each step compares adjacent elements and swaps when out of order. Count comparisons against n(n−1)/2 for the variant without early stopping.",
    ],
    controls: {
      size: ["Số phần tử n", "Array size n", 4, 24, 1, 10],
      speed: ["Tốc độ xem", "Playback speed", 1, 10, 1, 4],
    },
  },
  scaling: {
    vi: "Tăng tốc theo Amdahl",
    en: "Amdahl scaling",
    description: [
      "S=1/((1−p)+p/N), bỏ qua chi phí giao tiếp. Phần tuần tự chặn tăng tốc dù thêm nhiều worker. Dự đoán giới hạn khi N→∞.",
      "S=1/((1−p)+p/N), ignoring communication overhead. The serial fraction limits scaling. Predict the speedup limit as N→∞.",
    ],
    controls: {
      parallel: ["Phần song song p", "Parallel fraction p", 0, 0.99, 0.01, 0.9],
      workers: ["Số worker N", "Worker count N", 1, 64, 1, 8],
    },
  },
};
export function parameters(data: SimulationData) {
  return Object.fromEntries(
    Object.entries(models[data.model].controls).map(([key, c]) => [
      key,
      data.parameters[key] ?? c[5],
    ]),
  );
}
export function drive(p: Record<string, number>) {
  let x = 0,
    y = 0,
    theta = 0;
  const points = [[x, y]];
  for (let i = 0; i < 400; i++) {
    const v = (p.left + p.right) / 2,
      w = (p.right - p.left) / p.track,
      dt = 0.025;
    x += v * Math.cos(theta + (w * dt) / 2) * dt;
    y += v * Math.sin(theta + (w * dt) / 2) * dt;
    theta += w * dt;
    points.push([x, y]);
  }
  return {
    points,
    x,
    y,
    theta,
    v: (p.left + p.right) / 2,
    w: (p.right - p.left) / p.track,
  };
}
export function pid(p: Record<string, number>) {
  let x = 0,
    v = 0,
    integral = 0;
  const points: number[][] = [];
  for (let i = 0; i < 800; i++) {
    const error = p.target - x;
    integral = Math.max(-10, Math.min(10, integral + error * 0.01));
    const u = Math.max(
      -30,
      Math.min(30, p.kp * error + p.ki * integral - p.kd * v),
    );
    v += (u - 2 * v) * 0.01;
    x += v * 0.01;
    points.push([i / 100, x]);
  }
  return {
    points,
    error: p.target - x,
    peak: Math.max(...points.map((v) => v[1])),
  };
}
export function sortFrames(n: number) {
  const a = Array.from({ length: n }, (_, i) => ((i * 7 + 3) % n) + 1); // deterministic, with a permutation for any n
  for (let i = 0; i < n; i++) a[i] = n - i;
  const frames = [{ values: [...a], pair: [-1, -1], comparisons: 0 }];
  let count = 0;
  for (let end = n - 1; end > 0; end--)
    for (let i = 0; i < end; i++) {
      if (a[i] > a[i + 1]) [a[i], a[i + 1]] = [a[i + 1], a[i]];
      frames.push({ values: [...a], pair: [i, i + 1], comparisons: ++count });
    }
  return frames;
}
