// Builds the series gallery into dist/: index.html (the artifact's main page, no
// document skeleton) and gallery.html (the same page as a full document, which the
// figure pages link back to). Copies every built figure page and thumbnail beside it.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, "..", "dist");
const SHOTS = join(HERE, "..", "shots");
mkdirSync(join(DIST, "thumbs"), { recursive: true });

export const FIGS = [
  { id: "dhatu", n: 1, group: "body", ta: "ஏழு உடல் தாதுக்கள்", en: "Sapta Dhatu", lenses: "Tradition · Anatomy", line: "Food refined pot by pot into seven tissues and ojas, against a bloodstream that feeds them all at once." },
  { id: "vayu", n: 2, group: "body", ta: "ஐந்து வாயுக்கள்", en: "Pancha Vayu", lenses: "Tradition · Anatomy", line: "The five winds and three nadis as an air tower, against the diaphragm, the breath and the nasal cycle." },
  { id: "chakra", n: 3, group: "body", ta: "ஆறு ஆதாரங்கள்", en: "Chakras", lenses: "Tradition · Anatomy", line: "Seven wheels on one shaft and the rising of bindu, against the glands and nerve plexuses beside the spine." },
  { id: "kallanai", n: 4, group: "stone", ta: "கல்லணை", en: "Kallanai", lenses: "The legend · The engineering", line: "Karikalan's stone weir on the Kaveri: how unhewn rock stands on sand and divides a river." },
  { id: "pillars", n: 5, group: "stone", ta: "இசைத் தூண்கள்", en: "Musical Pillars", lenses: "The legend · The physics", line: "Nellaiappar's singing stone: why a thicker or shorter colonette rings a higher note." },
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const built = FIGS.filter((f) => existsSync(join(HERE, f.id, `${f.id}.html`)));
for (const f of built) {
  for (const suffix of ["", "-light"]) {
    const src = join(HERE, f.id, `${f.id}${suffix}.html`);
    if (existsSync(src)) copyFileSync(src, join(DIST, `${f.id}${suffix}.html`));
  }
  for (const t of ["dark", "light"]) {
    const src = join(SHOTS, `thumb-${f.id}-${t}.png`);
    if (existsSync(src)) copyFileSync(src, join(DIST, "thumbs", `${f.id}-${t}.png`));
  }
}
const ready = new Set(built.map((f) => f.id));

function card(f) {
  const thumb = (t) => existsSync(join(DIST, "thumbs", `${f.id}-${t}.png`))
    ? `<img class="th th-${t}" src="thumbs/${f.id}-${t}.png" alt="" loading="lazy" width="760" height="520">`
    : "";
  const live = ready.has(f.id);
  const inner = `
      <div class="frame">${thumb("dark")}${thumb("light")}${live ? "" : `<span class="pending">In the workshop</span>`}</div>
      <div class="meta">
        <span class="fig">Fig ${f.n}</span>
        <span class="lens">${esc(f.lenses)}</span>
      </div>
      <h3><span class="ta">${esc(f.ta)}</span><span class="en">${esc(f.en)}</span></h3>
      <p>${esc(f.line)}</p>`;
  return live
    ? `<a class="card" data-fig="${f.id}" href="${f.id}.html">${inner}</a>`
    : `<div class="card is-pending">${inner}</div>`;
}

const section = (group, title, sub) => `
  <section class="group">
    <header class="group-head"><h2>${title}</h2><p>${sub}</p></header>
    <div class="grid grid-${group}">${FIGS.filter((f) => f.group === group).map(card).join("")}</div>
  </section>`;

const content = `<title>Udal Koyil</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Arima:wght@500;700&family=Hind+Madurai:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* Layout: one narrow temple-corridor column; two halls (the body, the stone), each a row of figure plates. */
:root{
  --stone:#ebebe6; --plate:#f6f6f2; --ink:#1d1c19; --muted:#69665e; --rule:#d2d0c7; --brass:#8a5f12;
  --display:"Arima","Hind Madurai",Georgia,serif;
  --body:"Hind Madurai","Noto Sans Tamil","Segoe UI",system-ui,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,Consolas,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--stone:#141412;--plate:#1c1c19;--ink:#ebe8e0;--muted:#9a968b;--rule:#2f2e2a;--brass:#d9a648;color-scheme:dark}}
:root[data-theme="dark"]{--stone:#141412;--plate:#1c1c19;--ink:#ebe8e0;--muted:#9a968b;--rule:#2f2e2a;--brass:#d9a648;color-scheme:dark}
body{background:var(--stone);color:var(--ink);font:16px/1.65 var(--body);-webkit-font-smoothing:antialiased}
.wrap{max-width:1040px;margin:0 auto;padding-block:56px 80px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:56px}
.hero{display:grid;gap:18px;max-width:720px}
.eyebrow{font:500 12px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--brass)}
h1{margin:0;font:700 clamp(40px,7vw,68px)/1.05 var(--display);letter-spacing:-.01em;text-wrap:balance}
.verse{margin:0;display:grid;gap:4px;padding-left:16px;border-left:2px solid var(--brass)}
.verse .ta{font:500 clamp(18px,2.6vw,22px)/1.5 var(--display)}
.verse .en{color:var(--muted);font-size:15px}
.verse cite{font:400 12px/1.4 var(--mono);color:var(--muted);font-style:normal}
.intro{margin:0;max-width:62ch;color:var(--muted)}
.intro b{color:var(--ink);font-weight:600}
.group{display:grid;gap:20px}
.group-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--rule);padding-bottom:10px}
.group-head h2{margin:0;font:700 26px/1.2 var(--display)}
.group-head p{margin:0;font:400 12px/1.4 var(--mono);color:var(--muted);letter-spacing:.04em}
.grid{display:grid;gap:20px}
.grid-body{grid-template-columns:repeat(3,minmax(0,1fr))}
.grid-stone{grid-template-columns:repeat(2,minmax(0,1fr))}
@media (max-width:860px){.grid-body,.grid-stone{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.grid-body,.grid-stone{grid-template-columns:minmax(0,1fr)}}
.card{display:grid;gap:10px;align-content:start;color:inherit;text-decoration:none;min-width:0}
.frame{position:relative;aspect-ratio:760/520;max-width:100%;border-radius:10px;overflow:hidden;background:var(--plate);border:1px solid var(--rule);transition:border-color .2s}
.th{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 58%;transition:transform .5s cubic-bezier(.32,.72,0,1)}
.th-dark{display:none}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .th-dark{display:block}:root:not([data-theme="light"]) .th-light{display:none}}
:root[data-theme="dark"] .th-dark{display:block}
:root[data-theme="dark"] .th-light{display:none}
a.card:hover .frame,a.card:focus-visible .frame{border-color:var(--brass)}
a.card:hover .th{transform:scale(1.03)}
a.card:focus-visible{outline:2px solid var(--brass);outline-offset:4px;border-radius:12px}
.pending{position:absolute;inset:0;display:grid;place-items:center;font:500 12px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.meta{display:flex;justify-content:space-between;gap:8px;font:500 11px/1.3 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.meta .fig{color:var(--brass)}
.card h3{margin:0;display:grid;gap:2px}
.card h3 .ta{font:700 20px/1.3 var(--display)}
.card h3 .en{font:600 14px/1.3 var(--body);color:var(--muted)}
.card p{margin:0;font-size:14.5px;line-height:1.55}
.is-pending{opacity:.6}
.foot{display:grid;gap:8px;border-top:1px solid var(--rule);padding-top:20px;font-size:13.5px;color:var(--muted);max-width:72ch}
.foot p{margin:0}
.foot a{color:var(--ink)}
@media (prefers-reduced-motion:reduce){.th,.frame{transition:none}a.card:hover .th{transform:none}}
</style>
<main class="wrap">
  <header class="hero">
    <span class="eyebrow">உடல் கோயில் · five working figures</span>
    <h1>Udal Koyil</h1>
    <blockquote class="verse">
      <span class="ta">உள்ளம் பெருங்கோயில் ஊனுடம்பு ஆலயம்</span>
      <span class="en">The heart is the great temple; this body of flesh, its shrine.</span>
      <cite>Thirumoolar, Thirumanthiram</cite>
    </blockquote>
    <p class="intro">Temples and the body, each drawn as a machine you can play with. Every figure has <b>two lenses</b>: what the tradition says, and what anatomy, physics or engineering shows. The point isn't to debunk or to preach. It's to see both models side by side.</p>
  </header>
  ${section("body", "The body", "Fig 1–3 · Tradition and Anatomy")}
  ${section("stone", "The stone", "Fig 4–5 · Legend and Engineering")}
  <footer class="foot">
    <p>Drawn with the open-source <a href="https://github.com/wheresryan22/anatomy">anatomy</a> skill and its biology sibling <a href="https://github.com/garinmckayl/anima">anima</a>. Each figure lists its sources under the drawing; numbers marked "about" are approximate.</p>
    <p>Educational, not medical advice.</p>
  </footer>
</main>
<script>
// open the figure page that matches the viewer's theme
(function(){
  const root=document.documentElement;
  const dark=()=>root.dataset.theme==="dark"||(root.dataset.theme!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);
  const light=location.hash==="#light";
  document.querySelectorAll("a.card[data-fig]").forEach((a)=>{
    const id=a.dataset.fig;
    const set=()=>{a.href=id+((light||!dark())?"-light":"")+".html";};
    set();
    a.addEventListener("pointerenter",set);
    a.addEventListener("focus",set);
  });
})();
</script>`;

writeFileSync(join(DIST, "index.html"), content);
writeFileSync(join(DIST, "gallery.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${content}</body></html>`);
console.log("gallery:", built.length, "of", FIGS.length, "figures built →", DIST);
