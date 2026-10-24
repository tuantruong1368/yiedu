"use client";
import { useEffect, useRef, useState } from "react";
import { Source, esc, sanitizeImport } from "@/lib/authoring/site";
const runtime = `(()=>{const send=x=>parent.postMessage({channel:'yiedu-page-v1',...x},'*');const navigation=href=>{if(href.startsWith('#')){document.getElementById(href.slice(1))?.scrollIntoView({behavior:'smooth'});return}send({type:'navigate',href})};document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&!a.hasAttribute('data-event')&&!a.hasAttribute('data-events')){e.preventDefault();navigation(a.getAttribute('href')||'')}});document.querySelectorAll('[data-event],[data-events]').forEach(el=>{let events=[];try{events=JSON.parse(el.dataset.events||'[]')}catch{}if(el.dataset.event)events.unshift({event:el.dataset.event,action:el.dataset.action,target:el.dataset.target,message:el.dataset.message});events.slice(0,9).forEach(def=>{if(!['click','dblclick','mouseenter','mouseleave','change','submit'].includes(def.event))return;el.addEventListener(def.event,e=>{e.preventDefault();const action=def.action,target=def.target||'';if(action==='navigate')navigation(target);if(action==='scroll')document.getElementById(target.replace(/^#/,''))?.scrollIntoView({behavior:'smooth'});if(action==='toggle'){const node=document.getElementById(target.replace(/^#/,''));if(node)node.hidden=!node.hidden}if(action==='message'){const message=document.createElement('div');message.setAttribute('role','status');message.textContent=def.message||'✓';message.style.cssText='padding:16px;background:#eaf1ed;color:#152f24;border:1px solid #aab';el.after(message);setTimeout(()=>message.remove(),8000)}})})});document.querySelectorAll('form').forEach(f=>f.addEventListener('submit',e=>e.preventDefault()));let last=0;new ResizeObserver(()=>{const height=Math.min(40000,Math.max(200,document.documentElement.scrollHeight));if(height!==last){last=height;send({type:'height',height})}}).observe(document.body)})();`;
export default function SiteRuntime({
  source,
  courses,
  slug,
  title,
  courseBase,
  pageBase,
}: {
  source: Source;
  courses: any[];
  slug: string;
  title: string;
  courseBase?: string;
  pageBase?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null),
    [doc, setDoc] = useState(""),
    [height, setHeight] = useState(600);
  useEffect(() => {
    setHeight(600);
    const parsed = new DOMParser().parseFromString(
      sanitizeImport(source.html),
      "text/html",
    );
    parsed.querySelectorAll("[data-template-link]").forEach((node) => {
      node.setAttribute(
        "href",
        (pageBase || `/t/${slug}/p/`) + node.getAttribute("data-template-link"),
      );
    });
    parsed.querySelectorAll('[data-gadget="yiedu.courses"]').forEach((node) => {
      node
        .querySelectorAll("[data-courses-placeholder], [data-template-preview]")
        .forEach((x) => x.remove());
      const limit = Math.min(
        100,
        Math.max(1, Number(node.getAttribute("data-course-limit")) || 100),
      );
      const grid = document.createElement("div");
      grid.className = "yd-course-grid";
      grid.innerHTML = courses
        .slice(0, limit)
        .map(
          (c) =>
            `<a class="yd-course" href="${esc(courseBase || `/t/${slug}/learn?course=`)}${esc(c.id)}"><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p></a>`,
        )
        .join("");
      (node.querySelector(".wrap") || node).appendChild(grid);
    });
    const safe = sanitizeImport(parsed.body.innerHTML);
    setDoc(
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; style-src 'unsafe-inline'; script-src 'nonce-yiedu-runtime'; font-src https: data:; form-action 'none'; base-uri 'none'"><style>${source.css.replace(/</g, "\\3c ")}</style></head><body>${safe}<script nonce="yiedu-runtime">${runtime}</script></body></html>`,
    );
  }, [source.html, source.css, courses, slug, courseBase, pageBase]);
  useEffect(() => {
    function receive(e: MessageEvent) {
      if (
        e.source !== frame.current?.contentWindow ||
        e.data?.channel !== "yiedu-page-v1"
      )
        return;
      if (e.data.type === "height" && Number.isFinite(e.data.height))
        setHeight(Math.min(40000, Math.max(200, e.data.height)));
      if (e.data.type === "navigate" && typeof e.data.href === "string") {
        const href = e.data.href;
        if (
          (/^\/(?!\/)/.test(href) || /^https:\/\//.test(href)) &&
          !/[\\\x00-\x20]/.test(href)
        )
          location.assign(href);
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  return (
    <>
      <iframe
        ref={frame}
        title={title}
        srcDoc={doc}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        className="tenant-canvas"
        style={{ height }}
      />
      <noscript>{source.html.replace(/<[^>]*>/g, " ")}</noscript>
    </>
  );
}
