# ruff: noqa: E501
"""Render a published, validated SiteDocument as a self-contained sandbox document."""

import json
import re
import secrets
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlencode, urlsplit

VOID = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}


class Element:
    def __init__(self, tag="", attrs=None):
        self.tag, self.attrs, self.children = tag, dict(attrs or []), []

    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Element):
                yield from child.walk()

    def html(self):
        content = "".join(x.html() if isinstance(x, Element) else escape(x) for x in self.children)
        if not self.tag:
            return content
        attrs = "".join(
            f' {key}="{escape(value or "", quote=True)}"' for key, value in self.attrs.items()
        )
        return f"<{self.tag}{attrs}>" + ("" if self.tag in VOID else content + f"</{self.tag}>")


class Fragment(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Element()
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Element(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


RUNTIME = r"""(()=>{
 const send=data=>parent.postMessage({channel:'yiedu-page-v1',...data},'*');
 const anchor=id=>document.getElementById(id.replace(/^#/,''))?.scrollIntoView({behavior:'smooth'});
 const navigate=href=>{if(href.startsWith('#'))anchor(href);else send({type:'navigate',href})};
 window.addEventListener('message',e=>{if(e.source===parent&&e.data?.channel==='yiedu-page-v1'&&e.data.type==='anchor'&&typeof e.data.id==='string')anchor(e.data.id)});
 document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&!a.hasAttribute('data-event')&&!a.hasAttribute('data-events')){e.preventDefault();navigate(a.getAttribute('href')||'')}});
 document.querySelectorAll('[data-event],[data-events]').forEach(el=>{
   let events=[];try{events=JSON.parse(el.dataset.events||'[]')}catch{}
   if(el.dataset.event)events.unshift({event:el.dataset.event,action:el.dataset.action,target:el.dataset.target,message:el.dataset.message});
   events.slice(0,9).forEach(def=>{if(!['click','dblclick','mouseenter','mouseleave','change','submit'].includes(def.event))return;
     el.addEventListener(def.event,e=>{e.preventDefault();const target=def.target||'';
       if(def.action==='navigate')navigate(target);if(def.action==='scroll')anchor(target);
       if(def.action==='toggle'){const node=document.getElementById(target.replace(/^#/,''));if(node)node.hidden=!node.hidden}
       if(def.action==='message'){const node=document.createElement('div');node.setAttribute('role','status');node.textContent=def.message||'✓';node.style.cssText='padding:16px;background:#eaf1ed;color:#152f24;border:1px solid #aab';el.after(node);setTimeout(()=>node.remove(),8000)}
     });
   });
 });
 document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',e=>e.preventDefault()));
 const viewportMode=/[0-9](?:d|s|l)?vh\b/.test(document.querySelector('style')?.textContent||'');
 let last=0,pending=false;const measure=()=>{pending=false;if(viewportMode)return;let bottom=document.body.getBoundingClientRect().height;document.body.querySelectorAll('*').forEach(el=>{const box=el.getBoundingClientRect();bottom=Math.max(bottom,box.bottom+window.scrollY)});const height=Math.min(60000,Math.max(200,Math.ceil(bottom)));if(height!==last){last=height;send({type:'height',height})}};
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(measure)}};
 new ResizeObserver(schedule).observe(document.body);window.addEventListener('load',schedule);
 document.fonts?.ready.then(schedule);document.querySelectorAll('img,video').forEach(node=>node.addEventListener('load',schedule));
 send({type:'ready',viewport:viewportMode});schedule();
})();"""


def page_href(page, slug, page_base=None):
    if page_base:
        return page_base + page["id"]
    return f"/t/{slug}" + (f"/p/{page['slug']}" if page["slug"] else "")


def resolve_link(href, pages, slug, root=None, source_locale="vi", page_base=None):
    if not isinstance(href, str):
        return ""
    if href.startswith("#"):
        key = href[1:]
        if root and any(node.attrs.get("id") == key for node in root.walk()):
            return href
        for page in pages:
            source = page.get(source_locale, {}).get("html", "")
            if any(node.attrs.get("id") == key for node in Fragment(source).root.walk()):
                return page_href(page, slug, page_base) + href
        return href
    if not href or href.startswith("https://"):
        return href
    url = urlsplit(href)
    key = re.sub(r"\.html$", "", url.path.removeprefix("./").strip("/"))
    key = key.removeprefix("p/")
    page = next(
        (p for p in pages if key in {p["id"], p["slug"]} or (key == "index" and not p["slug"])),
        None,
    )
    if page:
        return page_href(page, slug, page_base) + ("#" + url.fragment if url.fragment else "")
    if url.path in {"/login", "/register"}:
        return url.path + "?" + urlencode({"site": slug})
    return href


def render_site(
    document, courses, slug, page_slug="", locale="vi", page_base=None, course_base=None
):
    """Inputs must already have passed SiteDocument validation and published-course filtering."""
    page = next((p for p in document["pages"] if p["slug"] == page_slug), None)
    if page is None:
        raise KeyError("Page not found")
    lang = locale if locale in {"vi", "en"} else document["default_locale"]
    source = page[lang] if page[lang].get("html") else page[document["default_locale"]]
    root = Fragment(source["html"]).root
    for node in list(root.walk()):
        attrs = node.attrs
        if "data-template-link" in attrs:
            target = next(
                (
                    p
                    for p in document["pages"]
                    if attrs["data-template-link"] in {p["id"], p["slug"]}
                ),
                None,
            )
            if target:
                attrs["href"] = page_href(target, slug, page_base)
        if "href" in attrs:
            attrs["href"] = resolve_link(
                attrs["href"], document["pages"], slug, root, lang, page_base
            )
        if attrs.get("data-action") == "navigate":
            attrs["data-target"] = resolve_link(
                attrs.get("data-target", ""), document["pages"], slug, root, lang, page_base
            )
        if "data-events" in attrs:
            events = json.loads(attrs["data-events"] or "[]")
            for event in events:
                if event.get("action") == "navigate":
                    event["target"] = resolve_link(
                        event.get("target", ""), document["pages"], slug, root, lang, page_base
                    )
            attrs["data-events"] = json.dumps(events)
        if attrs.get("data-gadget") != "yiedu.courses":
            continue
        for parent in list(node.walk()):
            parent.children = [
                child
                for child in parent.children
                if not (
                    isinstance(child, Element)
                    and (
                        "data-template-preview" in child.attrs
                        or "data-courses-placeholder" in child.attrs
                    )
                )
            ]
        try:
            limit = max(1, min(100, int(attrs.get("data-course-limit", 100))))
        except ValueError, TypeError:
            limit = 100
        grid = Element("div", [("class", "yd-course-grid")])
        for course in courses[:limit]:
            translated = {**course, **course.get("translations", {}).get(lang, {})}
            href = (
                (course_base + course["id"] + "#lessons")
                if course_base
                else f"/t/{slug}/learn?course={course['id']}"
            )
            link = Element("a", [("class", "yd-course"), ("href", href)])
            for tag, text in [
                ("h3", translated["title"]),
                ("p", translated.get("description", "")),
            ]:
                child = Element(tag)
                child.children.append(text)
                link.children.append(child)
            offer = course.get("offer")
            if offer:
                if not offer.get("active", True):
                    label = "Tạm dừng đăng ký" if lang == "vi" else "Enrollment paused"
                elif offer.get("mode") == "paid":
                    vnd = offer.get("price_vnd", 0)
                    usd = offer.get("price_usd", 0)
                    label = (
                        (f"{vnd:,}".replace(",", ".") + " VND")
                        if vnd
                        else f"{usd // 100}.{usd % 100:02d} USD"
                    )
                else:
                    label = "Miễn phí" if lang == "vi" else "Free"
                price = Element("strong", [("class", "yd-price")])
                price.children.append(label)
                link.children.append(price)
            grid.children.append(link)
        wrap = next(
            (child for child in node.walk() if "wrap" in (child.attrs.get("class") or "").split()),
            node,
        )
        wrap.children.append(grid)
    nonce = secrets.token_urlsafe(18)
    csp = f"default-src 'none'; img-src 'self' https: data:; media-src https:; style-src 'unsafe-inline'; script-src 'nonce-{nonce}'; font-src 'self' https: data:; form-action 'none'; base-uri 'none'"
    css = source.get("css", "").replace("<", "\\3c ")
    title = escape(page["title"].get(lang) or document["branding"]["text"])
    html = f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><style>html,body{{margin:0;min-height:0}}{css}</style></head><body>{root.html()}<script nonce="{nonce}">{RUNTIME}</script></body></html>'
    return html, csp
