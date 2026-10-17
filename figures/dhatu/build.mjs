// Fig 1 — Sapta Dhatu: the seven-tissue refinery.
// Tradition lens: food is cooked by the digestive fire, and each tissue's own fire
// refines part of it into the next, in series, ending in shukra and ojas.
// Anatomy lens: the bloodstream feeds every tissue at once, in parallel.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { page, LENS_JS } from "../common.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 720;
const HEIGHT = 420;

// ---- truth -------------------------------------------------------------
const DHATUS = [
  { sa: "Rasa", ta: "சாரம்", en: "plasma and lymph", renew: "renews in hours to days" },
  { sa: "Rakta", ta: "செந்நீர்", en: "blood", renew: "red cells live ~120 days" },
  { sa: "Mamsa", ta: "ஊன்", en: "muscle", renew: "protein turns over in weeks" },
  { sa: "Meda", ta: "கொழுப்பு", en: "fat", renew: "~10% of fat cells renewed a year" },
  { sa: "Asthi", ta: "என்பு", en: "bone", renew: "skeleton remodels in ~10 years" },
  { sa: "Majja", ta: "மூளை", en: "marrow and nerve", renew: "~200 billion red cells made a day" },
  { sa: "Shukra", ta: "சுக்கிலம்", en: "reproductive tissue", renew: "sperm take ~64–74 days to form" },
];
const DAYS_PER = 5; // Sushruta's count: about 5 days per tissue
const DAY_MAX = 38;

// ---- world -------------------------------------------------------------
const BENCH = { x: -178, y: -48, w: 362, d: 96, r: 8 };
const BENCH_H = 12;
const FOOT_H = 5;
const POT_R = 10.5;
const POT_H = 22;
const LEG = 5.5; // trivet height between burner plate and pot
const CY = -2;
const potX = (i) => -95 + 30 * i;
const plinthH = (i) => 26 - 4 * i;
const potZ = (i) => plinthH(i) + LEG; // pot bottom
const potTop = (i) => potZ(i) + POT_H;

const STOM = { x: -142, y: CY, r: 15, plinth: 28, h: 26 };
const STOM_Z = STOM.plinth + LEG;
const STOM_TOP = STOM_Z + STOM.h;

const RULER = { x: -114, y: BENCH.y + BENCH.d - 16, w: 222, d: 8, r: 1 };
const DAY0_X = -110; // day 0 on the ruler; 6 units per day puts day 5i+2.5 under pot i
const PER_DAY = 6;
const dayX = (d) => DAY0_X + PER_DAY * d;

const TROUGH = { x: -152, y: -32, w: 250, d: 7, r: 1.5 };
const TROUGH_Z = 60;
const TROUGH_H = 4;

const OJAS = { x: 122, y: CY, r: 5 };
const OJAS_PED = 8;
const OJAS_Z = OJAS_PED + 0.6;
const OJAS_H = 16;
const GUTTER_Z = potTop(6) - 2.6;

const AZ = 58;
const P = k.fitProjection(
  [...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [STOM.x, STOM.y, STOM_TOP + 18], [TROUGH.x, TROUGH.y, TROUGH_Z + 10], [TROUGH.x + TROUGH.w, TROUGH.y, TROUGH_Z + 10]],
  WIDTH,
  HEIGHT,
  { pad: 34, azimuth: AZ, elevation: 31 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const VIEW = k.towardViewer(P);
// sight glasses sit a little round from the viewer, away from the overflow lips
const GA = (AZ + 28) * (Math.PI / 180);
const gaugeAt = (cx, cy, r) => [cx + Math.cos(GA) * (r + 2.6), cy + Math.sin(GA) * (r + 2.6)];

// ---- parts -------------------------------------------------------------
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BENCH, -BENCH_H - FOOT_H, BENCH_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BENCH, 24))) {
    out.push(S(k.cylinder(x, y, 7.5, -BENCH_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.8, -BENCH_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(BENCH, -BENCH_H + 4, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(BENCH, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  return out.join("");
}

// the back channel: the bloodstream as a header trough on posts, one sluice per pot
function trough() {
  const out = [];
  const posts = [-146, ...DHATUS.map((_, i) => potX(i) + 15).slice(0, 6), 92];
  for (const x of posts) {
    const y = TROUGH.y + TROUGH.d / 2;
    out.push(S(k.cylinder(x, y, 3.4, 0, 2, P, 20), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 1.7, 2, TROUGH_Z - 2, P, 18), { tone: "mid", crease: "none" }));
    out.push(L(k.sideArc(x, y, 1.7, TROUGH_Z - 6, P, 12), { tone: "faint" }));
  }
  out.push(S(k.slabOf(TROUGH, TROUGH_Z, TROUGH_H, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(TROUGH, 1.4), TROUGH_Z + TROUGH_H, P, 3), { tone: "lo" }));
  out.push(D([TROUGH.x + 4, TROUGH.x + TROUGH.w - 4].map((x) => at([x, TROUGH.y + TROUGH.d / 2, TROUGH_Z + TROUGH_H])), { size: 0.45 }));
  // feed from the stomach pot up into the trough: a riser beside the stomach
  out.push(S(k.slabOf({ x: STOM.x - 3, y: TROUGH.y + TROUGH.d, w: 6, d: STOM.y - STOM.r - TROUGH.y - TROUGH.d, r: 0.8 }, STOM_TOP - 4, 2, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

function chute(i) {
  const x = potX(i);
  const plan = { x: x - 1.8, y: TROUGH.y + TROUGH.d, w: 3.6, d: CY - 5 - TROUGH.y - TROUGH.d, r: 0.6 };
  return S(k.slabOf(plan, TROUGH_Z + 0.6, 1.2, P, 2), { tone: "mid", crease: "none" });
}

function gate(i) {
  const x = potX(i);
  const plan = { x: x - 3.2, y: TROUGH.y + TROUGH.d - 0.2, w: 6.4, d: 1.8, r: 0.5 };
  const out = [S(k.slabOf(plan, TROUGH_Z + 1.8, 7, P, 2, 0.3), { tone: "hi" })];
  out.push(S(k.cylinder(x, plan.y + 0.9, 0.9, TROUGH_Z + 8.8, 2.4, P, 12), { tone: "mid" }));
  return out.join("");
}

function burner(cx, cy, z, r) {
  const out = [];
  out.push(S(k.cylinder(cx, cy, r, z, 2.2, P, 40, 0.4), { tone: "mid" }));
  out.push(L(k.ring(cx, cy, r - 1.6, z + 2.2, P, 40), { tone: "faint" }));
  const jets = [];
  for (let n = 0; n < 12; n++) {
    const a = (n / 12) * Math.PI * 2;
    jets.push([cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3)]);
  }
  out.push(`<g data-flame>${D(byDepth(jets).map(([x, y]) => at([x, y, z + 2.3])), { size: 0.75, tone: "lit", pulse: true })}</g>`);
  return out.join("");
}

function trivet(cx, cy, z, r) {
  const legs = [0, 1, 2].map((n) => {
    const a = (n / 3) * Math.PI * 2 + 0.5;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  return byDepth(legs).map(([x, y]) => S(k.cylinder(x, y, 1, z, LEG, P, 12), { tone: "lo", crease: "none" })).join("");
}

function knob(cx, cy, z) {
  return [
    S(k.cylinder(cx, cy, 2.6, z, 2.6, P, 24), { tone: "mid" }),
    L(k.knurl(cx, cy, 2.6, z, z + 2.6, 18, P), { tone: "lo" }),
    L(k.lineOnTop([cx, cy], [cx + 2.2, cy], z + 2.6, P), { tone: "hi" }),
  ].join("");
}

// an open pot: wall, rim band, dark mouth, a gauge glass on brackets toward the viewer
function pot(cx, cy, r, z, h, id) {
  const out = [];
  const top = z + h;
  out.push(S(k.cylinder(cx, cy, r, z, h, P, 56, 0.6), {
    tone: "hi",
    crease: "lo",
    inner: L(k.sideArc(cx, cy, r, top - 3.2, P, 40) + k.sideArc(cx, cy, r, z + 3, P, 40), { tone: "faint" }),
  }));
  out.push(`<path class="iso-shade" data-shade="0" d="${k.cylinder(cx, cy, r - 1.4, top - 0.01, 0.01, P, 48).fill}"/>`);
  out.push(L(k.ring(cx, cy, r - 1.4, top, P, 48), { tone: "lo" }));
  out.push(`<clipPath id="mouth-${id}"><path d="${k.cylinder(cx, cy, r - 1.4, top - 0.01, 0.01, P, 48).fill}"/></clipPath><g clip-path="url(#mouth-${id})" data-mouth="${id}"></g>`);
  // gauge glass
  const [gx, gy] = gaugeAt(cx, cy, r);
  for (const bz of [z + 1.2, top - 3.6]) {
    const ex = cx + Math.cos(GA) * (r - 0.6), ey = cy + Math.sin(GA) * (r - 0.6);
    const mx = Math.min(ex, gx) - 0.9, my = Math.min(ey, gy) - 0.9;
    out.push(S(k.slabOf({ x: mx, y: my, w: Math.abs(gx - ex) + 1.8, d: Math.abs(gy - ey) + 1.8, r: 0.5 }, bz, 2.4, P, 2), { tone: "mid", crease: "none" }));
  }
  out.push(S(k.cylinder(gx, gy, 1.9, z, h, P, 18), { tone: "faint", crease: "none" }));
  out.push(`<g data-fill="${id}"></g>`);
  out.push(S(k.cylinder(gx, gy, 2.3, top, 1.2, P, 18), { tone: "mid" }));
  out.push(S(k.cylinder(gx, gy, 2.3, z - 1.2, 1.2, P, 18), { tone: "mid" }));
  return out.join("");
}

function plinth(cx, cy, h, w) {
  const plan = { x: cx - w / 2, y: cy - w / 2, w, d: w, r: 2 };
  return [
    S(k.slabOf(plan, 0, h, P, 4, 0.6), { tone: "mid", inner: h > 6 ? L(k.sideSeam(plan, h - 3, P, 4), { tone: "faint" }) : "" }),
    D(k.corners(plan, 2.4).map(([x, y]) => at([x, y, h])), { size: 0.42 }),
  ].join("");
}

// overflow lip from one pot's rim, reaching over the next pot's mouth
function lip(fromX, fromR, toX, z) {
  const plan = { x: fromX + fromR - 1, y: CY - 2.2, w: toX - fromX - fromR - 5 + 1, d: 4.4, r: 0.8 };
  return [
    S(k.slabOf(plan, z, 1.4, P, 2, 0.3), { tone: "mid" }),
    L(k.lineOnTop([plan.x + 1, CY], [plan.x + plan.w - 0.8, CY], z + 1.4, P), { tone: "faint" }),
  ].join("");
}

function stream(id, from, to) {
  return `<g data-stream="${id}" opacity="0">${k.wireSvg(at(from), at(to), { tone: "lit", flow: true, ends: "to", size: 0.9 })}</g>`;
}

function stomach() {
  const out = [plinth(STOM.x, STOM.y, STOM.plinth, 34)];
  out.push(knob(STOM.x + 6, STOM.y + 17 + 2.6, 7));
  out.push(burner(STOM.x, STOM.y, STOM.plinth, 12));
  out.push(trivet(STOM.x, STOM.y, STOM.plinth + 2.2, 11));
  out.push(pot(STOM.x, STOM.y, STOM.r, STOM_Z, STOM.h, "stomach"));
  // hopper: a turned funnel on three struts above the mouth
  for (const a of [0.6, 2.7, 4.8]) {
    const x = STOM.x + Math.cos(a) * 11, y = STOM.y + Math.sin(a) * 11;
    out.push(S(k.cylinder(x, y, 0.8, STOM_TOP, 6, P, 10), { tone: "lo", crease: "none" }));
  }
  const F = G.frameAlong([STOM.x, STOM.y, STOM_TOP + 6], [0, 0, 1]);
  out.push(S(G.solidOf([[0, 3.2], [3, 3.2], [3, 4], [14, 13.5, 1], [16, 14.6], [17.2, 14.6]], F, P), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(STOM.x, STOM.y, 12.8, STOM_TOP + 6 + 17.2, P, 56), { tone: "lo" }));
  out.push(`<path class="iso-shade" data-shade="0" d="${k.cylinder(STOM.x, STOM.y, 12.8, STOM_TOP + 6 + 17.19, 0.01, P, 48).fill}"/>`);
  out.push(`<g data-grain>${D([[-4, -3], [2, -6], [5, 1], [-1, 4], [-6, 2], [3, 6], [0, 0]].map(([dx, dy]) => at([STOM.x + dx, STOM.y + dy, STOM_TOP + 23.2])), { size: 1.1, tone: "hi" })}</g>`);
  return out.join("");
}

function vessel(i) {
  const x = potX(i);
  const out = [plinth(x, CY, plinthH(i), 24)];
  out.push(knob(x - 6, CY + 12 + 2.6, Math.max(1.5, plinthH(i) / 2 - 1.3)));
  out.push(burner(x, CY, plinthH(i), 8.5));
  out.push(trivet(x, CY, plinthH(i) + 2.2, 8));
  out.push(pot(x, CY, POT_R, potZ(i), POT_H, i));
  return out.join("");
}

function ojas() {
  const out = [];
  // gutter from the shukra pot, on a post, into the ojas vial
  const gx0 = potX(6) + POT_R - 1, gx1 = OJAS.x - 1.5;
  out.push(S(k.cylinder(110, CY, 2.6, 0, 1.6, P, 18), { tone: "lo" }));
  out.push(S(k.cylinder(110, CY, 1.4, 1.6, GUTTER_Z - 1.6, P, 14), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: gx0, y: CY - 1.8, w: gx1 - gx0, d: 3.6, r: 0.7 }, GUTTER_Z, 1.2, P, 2, 0.3), { tone: "mid" }));
  // heart pedestal
  out.push(S(k.cylinder(OJAS.x, OJAS.y, 10, 0, 2, P, 40), { tone: "lo" }));
  out.push(S(k.cylinder(OJAS.x, OJAS.y, 8, 2, OJAS_PED - 2, P, 40, 0.5), { tone: "mid", inner: L(k.sideArc(OJAS.x, OJAS.y, 8, 5, P, 32), { tone: "faint" }) }));
  out.push(L(k.ring(OJAS.x, OJAS.y, 6.4, OJAS_PED, P, 36), { tone: "faint" }));
  out.push(`<g data-ojas-glass>${S(k.cylinder(OJAS.x, OJAS.y, OJAS.r, OJAS_Z, OJAS_H, P, 32), { tone: "faint", crease: "none" })}</g>`);
  out.push(`<g data-fill="ojas"></g>`);
  out.push(S(k.cylinder(OJAS.x, OJAS.y, OJAS.r + 0.6, OJAS_Z + OJAS_H, 1.2, P, 32), { tone: "mid" }));
  out.push(`<path class="iso-shade" data-shade="0" d="${k.cylinder(OJAS.x, OJAS.y, OJAS.r - 0.4, OJAS_Z + OJAS_H + 1.19, 0.01, P, 28).fill}"/>`);
  out.push(L(k.ring(OJAS.x, OJAS.y, OJAS.r - 0.4, OJAS_Z + OJAS_H + 1.2, P, 28), { tone: "lo" }));
  return out.join("");
}

function ruler() {
  const out = [S(k.slabOf(RULER, 0, 0.6, P, 3), { tone: "lo", crease: "none" })];
  const t = k.topTicks(DAY0_X, dayX(35), PER_DAY, 5, RULER.y + 0.8, 0.6, [2, 3.8], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(L(k.lineOnTop([DAY0_X, RULER.y + 0.8], [DAY0_X, RULER.y + 5], 0.6, P), { tone: "hi" }));
  out.push(D([at([RULER.x + 2, RULER.y + 4, 0.6]), at([RULER.x + RULER.w - 2, RULER.y + 4, 0.6])], { size: 0.45 }));
  return out.join("");
}

function carriage() {
  const plan = { x: -4, y: RULER.y - 1.2, w: 8, d: RULER.d + 4.4, r: 1.2 };
  return [
    `<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 1), 0.6, 0.1, P)}" style="filter:blur(3px)"/>`,
    S(k.slabOf(plan, 0.6, 2.8, P, 3, 0.4), { tone: "hi", lit: true }),
    L(k.lineOnTop([0, plan.y + 0.4], [0, plan.y + plan.d - 0.4], 3.4, P), { tone: "lit" }),
    S(k.cylinder(0, plan.y + plan.d - 2.6, 2.2, 3.4, 3, P, 20), { tone: "mid" }),
    L(k.knurl(0, plan.y + plan.d - 2.6, 2.2, 3.4, 6.4, 16, P), { tone: "lo" }),
  ].join("");
}

function labelPlate() {
  const plan = { x: 142, y: 12, w: 34, d: 20, r: 1.4 };
  return [
    S(k.slabOf(plan, 0, 0.8, P, 4), { tone: "lo", crease: "none" }),
    L(k.planOutline(k.insetPlan(plan, 1.6), 0.8, P, 4), { tone: "faint" }),
    k.faceTextSvg(k.topMatrix([plan.x + 4, plan.y + 7.5], 0.8, P, "x"), "ஏழு தாது", { size: 4, tone: "mid" }),
    L(k.lineOnTop([plan.x + 4, plan.y + 11.5], [plan.x + 26, plan.y + 11.5], 0.8, P), { tone: "lo", free: true }),
    L(k.lineOnTop([plan.x + 4, plan.y + 14.5], [plan.x + 18, plan.y + 14.5], 0.8, P), { tone: "lo", free: true }),
    D([at([plan.x + 2.4, plan.y + 2.4, 0.8]), at([plan.x + plan.w - 2.4, plan.y + plan.d - 2.4, 0.8])], { size: 0.42 }),
  ].join("");
}

// ---- assemble, back to front -------------------------------------------
const body = [bench(), trough()];
DHATUS.forEach((_, i) => body.push(chute(i)));
DHATUS.forEach((_, i) => body.push(`<g data-gate="${i}">${gate(i)}</g>`));
body.push(stomach());
DHATUS.forEach((_, i) => {
  body.push(vessel(i));
  // the lip that pours INTO this pot is drawn after it, since it hangs over its mouth
  const fromX = i === 0 ? STOM.x : potX(i - 1);
  const fromR = i === 0 ? STOM.r : POT_R;
  const z = (i === 0 ? STOM_TOP : potTop(i - 1)) - 1.6;
  body.push(lip(fromX, fromR, potX(i), z));
  body.push(`<g data-stream="lip${i}" opacity="0">${k.wireSvg(at([fromX + fromR + 0.4, CY, z + 1.4]), at([potX(i) - 4.4, CY, potTop(i) - 0.6]), { via: [at([potX(i) - 5.6, CY, z + 1.4]), at([potX(i) - 4.8, CY, z - 0.4])], tone: "lit", flow: true, ends: "to", size: 0.9 })}</g>`);
  body.push(stream(`vein${i}`, [potX(i), CY - 5.4, TROUGH_Z + 0.6], [potX(i), CY - 3.4, potTop(i)]));
});
body.push(ojas());
body.push(stream("ojas", [OJAS.x - 1.6, CY, GUTTER_Z], [OJAS.x - 0.8, CY, OJAS_Z + OJAS_H + 1.2]));
body.push(ruler());
body.push(`<g data-part="carriage" transform="${k.translateAlong(P, [dayX(12), 0, 0])}">${carriage()}</g>`);
body.push(labelPlate());

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A bench refinery of seven open pots stepping down left to right, each on its own burner, fed from a larger stomach pot under a grain hopper. In the tradition lens each pot overflows into the next and the last drips into a small glass vial of ojas on a pedestal. In the anatomy lens, sluice gates on a trough along the back open and feed every pot at once. A slider on the front ruler sets the day.",
  body,
});

// ---- live --------------------------------------------------------------
const GAUGES = DHATUS.map((_, i) => ({ g: gaugeAt(potX(i), CY, POT_R), z: potZ(i), h: POT_H }));
const live = `
${LENS_JS}
const P = ${JSON.stringify(P)};
const DH = ${JSON.stringify(DHATUS)};
const GAUGES = ${JSON.stringify(GAUGES)};
const MOUTHS = ${JSON.stringify(DHATUS.map((_, i) => [potX(i), CY, POT_R - 1.4]))};
const STOMG = ${JSON.stringify({ g: gaugeAt(STOM.x, STOM.y, STOM.r), z: STOM_Z, h: STOM.h })};
const OJ = ${JSON.stringify({ x: OJAS.x, y: OJAS.y, r: OJAS.r - 0.9, z: OJAS_Z, h: OJAS_H })};
const DAYS_PER = ${DAYS_PER}, DAY_MAX = ${DAY_MAX}, DAY0_X = ${DAY0_X}, PER_DAY = ${PER_DAY};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (s) => svg.querySelector(s);
const carriage = q('[data-part="carriage"]');
const readout = document.querySelector("[data-readout]");
const fills = DH.map((_, i) => q('[data-fill="' + i + '"]'));
const mouths = DH.map((_, i) => q('[data-mouth="' + i + '"]'));
const stomFill = q('[data-fill="stomach"]');
const ojFill = q('[data-fill="ojas"]');
const ojGlass = q("[data-ojas-glass]");
const lips = DH.map((_, i) => q('[data-stream="lip' + i + '"]'));
const veins = DH.map((_, i) => q('[data-stream="vein' + i + '"]'));
const gates = DH.map((_, i) => q('[data-gate="' + i + '"]'));
const ojStream = q('[data-stream="ojas"]');
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
let lens = "tradition", day = 12, target = 12, gateAt = 0, frame = 0, last = 0, touring = true, visible = false, idle = 0;
const lvl = DH.map(() => 0);
let ojLvl = 0, stomLvl = 0.7;
const want = (i) => lens === "anatomy" ? 0.78 : smooth((day - DAYS_PER * i) / DAYS_PER) * 0.82;
const ojWant = () => lens === "anatomy" ? 0 : smooth((day - 30) / 6) * 0.9;
const pick = () => clamp(Math.floor(day / DAYS_PER), 0, 6);
function gaugeSvg(gx, gy, z, h, level, lit) {
  if (level < 0.01) return "";
  return solidSvg(cylinder(gx, gy, 1.3, z + 0.2, Math.max(0.2, (h - 0.4) * level), P, 14), { tone: "hi", crease: lit ? "faint" : "none", lit });
}
function draw() {
  carriage.setAttribute("transform", translateAlong(P, [DAY0_X + PER_DAY * day, 0, 0]));
  const active = pick();
  DH.forEach((d, i) => {
    const lit = lens === "anatomy" ? i === active : i === active && day < DAYS_PER * 7;
    const html = gaugeSvg(GAUGES[i].g[0], GAUGES[i].g[1], GAUGES[i].z, GAUGES[i].h, lvl[i], lit);
    const surf = lvl[i] > 0.05 ? '<path class="iso-top" d="' + cylinder(MOUTHS[i][0], MOUTHS[i][1], MOUTHS[i][2], 0, GAUGES[i].z + GAUGES[i].h * lvl[i], P, 40).top + '"/>' + lineSvg(ring(MOUTHS[i][0], MOUTHS[i][1], MOUTHS[i][2] - 2.2, GAUGES[i].z + GAUGES[i].h * lvl[i], P, 36), { tone: lit ? "lit" : "lo" }) : "";
    if (mouths[i]._h !== surf) { mouths[i].innerHTML = surf; mouths[i]._h = surf; }
    if (fills[i]._h !== html) { fills[i].innerHTML = html; fills[i]._h = html; }
    const flowing = lens === "tradition" && day >= DAYS_PER * i && day < DAYS_PER * (i + 1);
    lips[i].setAttribute("opacity", flowing ? "1" : "0");
    veins[i].setAttribute("opacity", lens === "anatomy" ? String(gateAt) : "0");
    gates[i].setAttribute("transform", translateAlong(P, [0, 0, 6 * gateAt]));
  });
  const sh = gaugeSvg(STOMG.g[0], STOMG.g[1], STOMG.z, STOMG.h, stomLvl, false);
  if (stomFill._h !== sh) { stomFill.innerHTML = sh; stomFill._h = sh; }
  const oh = ojLvl > 0.01 ? solidSvg(cylinder(OJ.x, OJ.y, OJ.r, OJ.z + 0.3, OJ.h * ojLvl, P, 28), { tone: "hi", lit: true, crease: "none" }) : "";
  if (ojFill._h !== oh) { ojFill.innerHTML = oh; ojFill._h = oh; }
  ojStream.setAttribute("opacity", lens === "tradition" && day >= 30 && day < DAY_MAX - 1 ? "1" : "0");
  ojGlass.setAttribute("opacity", lens === "anatomy" ? "0.35" : "1");
  const d = DH[active];
  let text;
  if (lens === "tradition") {
    text = day >= 35 ? "day " + Math.floor(day) + " · ojas: the essence of all seven" : "day " + Math.floor(day) + " · " + d.ta + " " + d.sa + " forming · " + (active + 1) + " of 7";
  } else {
    text = d.sa + " ≈ " + d.en + " · " + d.renew;
  }
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(day)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { target += dt * 2.1; if (target > DAY_MAX) { target = 0; day = 0; } }
  day = calm ? target : day + (target - day) * (1 - Math.exp(-dt / 0.25));
  if (Math.abs(target - day) < 0.002) day = target;
  const ease = calm ? 1 : 1 - Math.exp(-dt / 0.35);
  let moving = false;
  DH.forEach((_, i) => { const w = want(i); lvl[i] += (w - lvl[i]) * ease; if (Math.abs(w - lvl[i]) > 0.002) moving = true; else lvl[i] = w; });
  const ow = ojWant(); ojLvl += (ow - ojLvl) * ease; if (Math.abs(ow - ojLvl) > 0.002) moving = true; else ojLvl = ow;
  const gw = lens === "anatomy" ? 1 : 0; gateAt += (gw - gateAt) * ease; if (Math.abs(gw - gateAt) > 0.002) moving = true; else gateAt = gw;
  stomLvl = 0.55 + 0.2 * Math.sin(now / 1400);
  draw();
  frame = visible && (touring || moving || day !== target) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, 0, DAY_MAX - 0.5); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 4200); run(); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (e) => {
  const box = svg.getBoundingClientRect();
  steer(clamp(((e.clientX - box.left) / box.width - 0.18) / 0.62, 0, 1) * (DAY_MAX - 0.5));
});
stage.addEventListener("keydown", (e) => {
  let to = null;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") to = Math.floor(target) + 1;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = Math.ceil(target) - 1;
  if (e.key === "Home") to = 0;
  if (e.key === "End") to = 35;
  if (to === null) return;
  e.preventDefault();
  steer(to);
});
wireLens((id) => { lens = id; run(); });
draw();
`;

const plate = k.plateHtml({
  fig: "Fig 1",
  title: "Sapta Dhatu · the seven tissues",
  hint: "Hover: day · T / A: lens",
  readout: "day 12 · ஊன் Mamsa forming · 3 of 7",
  keys: [
    { mark: "lit", label: "The tissue forming now, and ojas" },
    { mark: "raised", label: "Seven pots, each on its own fire (dhatvagni)" },
    { mark: "dotted", label: "Flow: pot to pot, or trough to every pot" },
  ],
  caption:
    "Food enters the hopper, the stomach fire (jatharagni) cooks it into rasa, and each pot's own fire refines part of what it receives into the next tissue. The slider is the day: about five days per tissue in Sushruta's count. Switch to Anatomy to see how the body actually supplies its tissues.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Seven-tissue refinery: arrow keys step the day" aria-valuemin="0" aria-valuemax="38" aria-valuenow="12">${svg}</div>`,
});

const html = page({
  title: "Sapta Dhatu",
  theme,
  tamil: "ஏழு உடல் தாதுக்கள் · Sapta Dhatu",
  lenses: [{ id: "tradition", label: "Tradition" }, { id: "anatomy", label: "Anatomy" }],
  notes: {
    tradition:
      "<b>What the tradition says.</b> Ayurveda and Siddha describe digestion as cooking. The stomach fire turns food into <b>rasa</b>; then each tissue's own fire refines part of what it receives into the next: rasa → rakta → mamsa → meda → asthi → majja → shukra, in series. <b>Ojas</b> is the essence of all seven, carried as strength, immunity and glow. Sushruta counts roughly five days per tissue, about a month in all. This is the tradition's model, shown as the tradition draws it.",
    anatomy:
      "<b>What anatomy shows.</b> The body works in parallel, not in series. Digestion puts nutrients into the blood, and the blood feeds every tissue at once, which is why the gates open together. Fat does not turn into bone, and bone does not turn into semen. Each tissue renews at its own pace, from hours (plasma) to about ten years (the skeleton). Ojas has no organ or substance you can isolate; its nearest modern cousins are immunity and general vitality, which is why its vial goes dim.",
  },
  sources:
    "Tradition: Sushruta Samhita, Sutrasthana 14; Charaka Samhita; Siddha names of the seven udal thathukkal. Anatomy: standard physiology; fat-cell turnover from Spalding et al., Nature 2008. Rates are approximate.",
  plate,
  script: kitScript() + live,
});

const out = theme === "light" ? "dhatu-light.html" : "dhatu.html";
writeFileSync(join(HERE, out), html);
console.log("wrote", out);
