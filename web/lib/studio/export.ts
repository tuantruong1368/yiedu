import type { Presentation } from "./types";
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function download(data: Blob, filename: string) {
  const url = URL.createObjectURL(data),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function slideHTML(data: Presentation, title: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:landscape;margin:0}*{box-sizing:border-box}body{margin:0;font:24px Arial}section{min-height:100vh;padding:8vw;color:white;background:${data.theme};break-after:page;position:relative}h1{font-size:42px}p{white-space:pre-wrap;line-height:1.6}small{opacity:.7}aside{font-size:16px;margin-top:40px;white-space:pre-wrap}@media print{section{min-height:100vh;print-color-adjust:exact}}</style></head><body>${data.slides.map((s, i) => `<section><small>${esc(title)} · ${i + 1}/${data.slides.length}</small><h1>${esc(s.title)}</h1><p>${esc(s.body)}</p><aside>${esc(s.notes)}</aside></section>`).join("")}</body></html>`;
}
export function printSlides(data: Presentation, title: string) {
  const win = window.open("", "_blank");
  if (!win)
    throw new Error("Allow pop-ups to print slides / Cho phép cửa sổ in");
  win.document.write(slideHTML(data, title));
  win.document.close();
  win.focus();
  win.print();
}
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (ctx.measureText(next).width > max && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}
/** Capture a real video. SpeechSynthesis audio is not part of the canvas stream. */
export async function exportVideo(
  data: Presentation,
  title: string,
  signal: AbortSignal,
  onProgress: (value: number) => void,
  microphone = false,
) {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream)
    throw new Error(
      "This browser cannot export video / Trình duyệt chưa hỗ trợ xuất video",
    );
  const mime = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ].find((t) => MediaRecorder.isTypeSupported(t));
  if (!mime) throw new Error("No supported video codec");
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;
  const layouts = data.slides.map((slide) => {
    let titleSize = 44;
    ctx.font = `bold ${titleSize}px Arial`;
    let headline = wrap(ctx, slide.title, 1100);
    while (headline.length > 3 && titleSize > 30) {
      titleSize -= 2;
      ctx.font = `bold ${titleSize}px Arial`;
      headline = wrap(ctx, slide.title, 1100);
    }
    const bodyY = 185 + headline.length * (titleSize + 10);
    let bodySize = 26;
    ctx.font = `${bodySize}px Arial`;
    let body = wrap(ctx, slide.body, 1100);
    while (body.length * (bodySize * 1.45) > 650 - bodyY && bodySize > 16) {
      bodySize -= 1;
      ctx.font = `${bodySize}px Arial`;
      body = wrap(ctx, slide.body, 1100);
    }
    if (headline.length > 3 || body.length * (bodySize * 1.45) > 650 - bodyY)
      throw new Error(
        `Split this scene into shorter scenes / Hãy tách nội dung cảnh ngắn hơn: ${slide.title}`,
      );
    return { titleSize, headline, bodySize, body, bodyY };
  });
  canvas.style.cssText =
    "position:fixed;left:-3000px;top:0;width:1280px;height:720px;pointer-events:none";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const stream = canvas.captureStream(25);
  const videoTrack =
    stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
  const requestFrame = () => videoTrack.requestFrame?.();
  let audio: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  try {
    if (microphone) {
      audio = await navigator.mediaDevices.getUserMedia({ audio: true });
      audio.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    const chunks: BlobPart[] = [];
    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 2500000,
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    let encodingError: Error | null = null;
    const stopped = new Promise<void>((resolve) => {
      recorder!.onstop = () => resolve();
      recorder!.onerror = () => {
        encodingError = new Error("Video encoding failed");
      };
    });
    const total = data.slides.reduce((sum, s) => sum + s.duration, 0),
      start = performance.now();
    const draw = (elapsed: number) => {
      let remaining = elapsed,
        index = 0;
      while (
        index < data.slides.length - 1 &&
        remaining >= data.slides[index].duration
      )
        remaining -= data.slides[index++].duration;
      ctx.fillStyle = data.theme;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#ffffff";
      ctx.font = "18px Arial";
      ctx.fillText(
        `${title.slice(0, 80)} · ${index + 1}/${data.slides.length}`,
        80,
        80,
      );
      const layout = layouts[index];
      ctx.font = `bold ${layout.titleSize}px Arial`;
      layout.headline.forEach((line, i) =>
        ctx.fillText(line, 80, 170 + i * (layout.titleSize + 10)),
      );
      ctx.font = `${layout.bodySize}px Arial`;
      layout.body.forEach((line, i) =>
        ctx.fillText(line, 80, layout.bodyY + i * layout.bodySize * 1.45),
      );
      ctx.fillStyle = "#ffffff66";
      ctx.fillRect(0, 710, 1280 * Math.min(1, elapsed / total), 10);
    };
    draw(0);
    recorder.start(250);
    requestFrame();
    await new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout>;
      const cleanup = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", abort);
      };
      const abort = () => {
        cleanup();
        reject(new DOMException("Cancelled", "AbortError"));
      };
      const tick = () => {
        if (encodingError) {
          cleanup();
          reject(encodingError);
          return;
        }
        const elapsed = (performance.now() - start) / 1000;
        draw(Math.min(elapsed, total));
        requestFrame();
        onProgress(Math.min(100, Math.round((elapsed / total) * 100)));
        if (elapsed >= total) {
          cleanup();
          resolve();
        } else timer = setTimeout(tick, 40);
      };
      signal.addEventListener("abort", abort, { once: true });
      tick();
    });
    recorder.stop();
    await stopped;
    if (encodingError) throw encodingError;
    const output = new Blob(chunks, { type: mime });
    if (!output.size)
      throw new Error(
        "Không ghi được khung hình video. Hãy thử lại / No video frames recorded. Please retry.",
      );
    download(
      output,
      `${title.replace(/[^\p{L}\p{N}-]/gu, "-").slice(0, 60)}.${mime.includes("mp4") ? "mp4" : "webm"}`,
    );
  } finally {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    audio?.getTracks().forEach((track) => track.stop());
    canvas.remove();
  }
}
