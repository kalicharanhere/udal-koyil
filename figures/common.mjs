// Shared pieces for the Udal Koyil series: the lens switch (tradition / anatomy,
// or legend / physics), the page header, and the gallery link. Every figure page
// imports this so the five read as one set.
import * as k from "../kit/iso-kit.mjs";

export const SERIES = "Udal Koyil";

export const SERIES_CSS = `
.uk-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 14px;flex-wrap:wrap}
.uk-head a{color:var(--anatomy-muted);text-decoration:none;font:12px/1.4 var(--anatomy-mono)}
.uk-head a:hover{color:var(--anatomy-strong)}
.uk-ta{color:var(--anatomy-strong);font-size:15px;letter-spacing:.01em}
.uk-lens{display:inline-flex;gap:2px;padding:2px;border-radius:9px;background:var(--anatomy-card);box-shadow:var(--anatomy-lift);margin:0 0 12px}
.uk-lens button{appearance:none;border:0;background:transparent;color:var(--anatomy-muted);font:12px/1 var(--anatomy-mono);padding:8px 12px;border-radius:7px;cursor:pointer}
.uk-lens button[aria-checked="true"]{background:var(--anatomy-face);color:var(--anatomy-strong);box-shadow:inset 0 0 0 1px var(--anatomy-faint)}
.uk-lens button:focus-visible{outline:1px solid var(--anatomy-mid);outline-offset:1px}
.uk-note{margin:14px 2px 0;padding:12px 14px;border-radius:10px;background:var(--anatomy-card);box-shadow:var(--anatomy-lift);font-size:13px;line-height:1.6}
.uk-note b{color:var(--anatomy-strong);font-weight:600}
.uk-note[hidden]{display:none}
.uk-src{margin:10px 2px 0;font:11px/1.5 var(--anatomy-mono);color:var(--anatomy-muted)}
.iso-caption [data-lens-text][hidden]{display:none}
`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// header: Tamil / Sanskrit name on the left, gallery link on the right
export function headHtml({ tamil, light }) {
  return `<div class="uk-head"><span class="uk-ta">${esc(tamil)}</span><a href="./gallery.html${light ? "#light" : ""}">← ${SERIES}</a></div>`;
}

// the two-way lens switch; `lenses` is [{ id, label }, { id, label }]
export function lensHtml(lenses) {
  return `<div class="uk-lens" role="radiogroup" aria-label="Which explanation to show">${lenses
    .map((l, i) => `<button type="button" role="radio" data-lens="${l.id}" aria-checked="${i === 0}">${esc(l.label)}</button>`)
    .join("")}</div>`;
}

// one note per lens under the card; only the active one shows
export function notesHtml(notes) {
  return Object.entries(notes)
    .map(([id, html], i) => `<div class="uk-note" data-note="${id}"${i ? " hidden" : ""}>${html}</div>`)
    .join("");
}

// live helper: wires the lens buttons and notes, calls onChange(id)
export const LENS_JS = `
function wireLens(onChange) {
  const buttons = [...document.querySelectorAll(".uk-lens button")];
  const notes = [...document.querySelectorAll("[data-note]")];
  const set = (id) => {
    buttons.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.lens === id)));
    notes.forEach((n) => (n.hidden = n.dataset.note !== id));
    document.body.dataset.lens = id;
    onChange(id);
  };
  buttons.forEach((b) => b.addEventListener("click", () => set(b.dataset.lens)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "t" || e.key === "T") set(buttons[0].dataset.lens);
    if (e.key === "a" || e.key === "A") set(buttons[1].dataset.lens);
  });
  return set;
}
`;

export function page({ title, theme, tamil, lenses, notes, sources, plate, script }) {
  const light = theme === "light";
  const body = `<style>${SERIES_CSS}</style>${headHtml({ tamil, light })}${lensHtml(lenses)}${plate}${notesHtml(notes)}<p class="uk-src">${sources}</p>`;
  return k.pageHtml({ title, theme, body, script, width: 760 });
}
