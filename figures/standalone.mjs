// Turns each built figure page into a standalone artifact page in solo/<id>/index.html:
// no document skeleton (the artifact host adds one), the theme follows the viewer, and the
// series link points at the published gallery instead of a sibling file.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "solo");
const GALLERY = "https://claude.ai/artifact/RMQfpNiwYFc8kvibqWmPri";
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ["dhatu", "vayu", "chakra", "kallanai", "pillars"];

// runs first inside <body>: make body the kit's themed root and follow the viewer's theme
const THEME = `<script>(function(){var b=document.body,r=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");
function t(){var e=r.getAttribute("data-theme");b.className="iso";b.setAttribute("data-theme",e==="light"||e==="dark"?e:(m.matches?"dark":"light"));}
t();m.addEventListener("change",t);new MutationObserver(t).observe(r,{attributes:true,attributeFilter:["data-theme"]});})();</script>`;

for (const id of IDS) {
  const src = join(HERE, id, `${id}.html`);
  if (!existsSync(src)) { console.log("skip", id); continue; }
  const html = readFileSync(src, "utf8");
  const title = html.match(/<title>([\s\S]*?)<\/title>/)[1];
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  const styles = [...head.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]).join("");
  let body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  body = body.replace(/href="\.\/gallery\.html(#light)?"/g, `href="${GALLERY}"`);
  const page = `<title>${title}</title>\n${styles}\n${THEME}\n${body}\n`;
  mkdirSync(join(OUT, id), { recursive: true });
  writeFileSync(join(OUT, id, "index.html"), page);
  console.log("solo", id, Math.round(page.length / 1024) + " KB");
}
