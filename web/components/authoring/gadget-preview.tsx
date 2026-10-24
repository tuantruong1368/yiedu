"use client";
/** Vector miniatures of layout patterns; no network images are needed in the library. */
export default function GadgetPreview({ kind }: { kind: string }) {
  const accent =
    kind.includes("video") || kind.includes("pricing")
      ? "#7967b2"
      : kind.includes("hero") || kind.includes("button")
        ? "#23776d"
        : "#527da0";
  const line = (x: number, y: number, w: number, h = 5, fill = "#cbd4d8") => (
    <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />
  );
  let content;
  if (kind.includes("hero"))
    content = (
      <>
        {line(20, 28, 63, 4, accent)}
        {line(20, 43, 110, 11, "#294139")}
        {line(20, 60, 85, 11, "#294139")}
        {line(20, 82, 100)}
        {line(20, 92, 80)}
        {line(20, 109, 55, 15, accent)}
        <rect x="151" y="28" width="69" height="96" rx="16" fill="#e1eae5" />
        <circle cx="185" cy="62" r="18" fill={accent} />
        {line(165, 91, 40)}
        {line(171, 101, 30)}
      </>
    );
  else if (["image", "gallery", "video", "audio"].some((k) => kind.includes(k)))
    content = (
      <>
        <rect x="20" y="22" width="200" height="105" rx="9" fill="#e4eaf0" />
        <circle cx="172" cy="49" r="13" fill="#f4ca88" />
        <path d="M20 112L74 58L124 110L160 82L220 127H20Z" fill="#8cb2a2" />
        {kind.includes("video") && (
          <>
            <circle cx="120" cy="75" r="22" fill={accent} />
            <path d="M115 64L133 75L115 86Z" fill="white" />
          </>
        )}
      </>
    );
  else if (kind.includes("columns"))
    content = (
      <>
        {[20, 125].map((x) => (
          <g key={x}>
            <rect x={x} y="25" width="95" height="100" rx="8" fill="#e3ebe7" />
            {line(x + 12, 46, 60, 6, accent)}
            {line(x + 12, 64, 71)}
            {line(x + 12, 75, 55)}
            {line(x + 12, 95, 40, 13, accent)}
          </g>
        ))}
      </>
    );
  else if (
    ["features", "team", "pricing", "cards", "courses"].some((k) =>
      kind.includes(k),
    )
  )
    content = (
      <>
        {line(70, 20, 100, 8, "#294139")}
        {[18, 89, 160].map((x, i) => (
          <g key={x}>
            <rect
              x={x}
              y="43"
              width="62"
              height="88"
              rx="6"
              fill={i === 1 ? "#e6ede7" : "white"}
              stroke="#d7e1da"
            />
            <circle cx={x + 18} cy="63" r="9" fill={accent} />
            {line(x + 9, 83, 43, 5, "#456354")}
            {line(x + 9, 95, 38, 3)}
            {line(x + 9, 104, 31, 3)}
            {line(x + 9, 115, 36, 8, accent)}
          </g>
        ))}
      </>
    );
  else if (kind.includes("stats"))
    content = (
      <>
        {line(74, 27, 92, 8, "#294139")}
        {[43, 105, 167].map((x, i) => (
          <g key={x}>
            <text x={x} y="83" fill={accent} fontSize="22" fontWeight="700">
              {["32", "128", "8"][i]}
            </text>
            {line(x - 1, 97, 34, 4)}
          </g>
        ))}
      </>
    );
  else if (kind.includes("form"))
    content = (
      <>
        {line(40, 26, 100, 8, "#294139")}
        {[48, 73].map((y) => (
          <rect
            key={y}
            x="40"
            y={y}
            width="160"
            height="18"
            rx="4"
            fill="white"
            stroke="#cbd9d0"
          />
        ))}
        {line(40, 106, 70, 17, accent)}
      </>
    );
  else if (kind.includes("button") || kind.includes("cta"))
    content = (
      <>
        {line(54, 37, 132, 10, "#294139")}
        {line(70, 58, 100)}
        <rect x="64" y="83" width="112" height="31" rx="7" fill={accent} />
        <text x="87" y="103" fill="white" fontSize="10">
          Explore →
        </text>
      </>
    );
  else if (kind.includes("faq"))
    content = (
      <>
        {[30, 62, 94].map((y) => (
          <g key={y}>
            <rect
              x="24"
              y={y}
              width="192"
              height="25"
              rx="5"
              fill="white"
              stroke="#d6e0d9"
            />
            {line(35, y + 10, 125, 4)}
            <text x="193" y={y + 17} fill={accent} fontSize="15">
              +
            </text>
          </g>
        ))}
      </>
    );
  else
    content = (
      <>
        {line(25, 29, 68, 5, accent)}
        {line(25, 48, 168, 11, "#294139")}
        {line(25, 72, 190)}
        {line(25, 85, 175)}
        {line(25, 98, 185)}
        {line(25, 111, 110)}
      </>
    );
  return (
    <svg
      className="gadget-miniature"
      viewBox="0 0 240 150"
      role="img"
      aria-label={`${kind} layout preview`}
    >
      <rect width="240" height="150" rx="10" fill="#f3f5f3" />
      {content}
    </svg>
  );
}
