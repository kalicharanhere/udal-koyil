// Fig 4 — Kallanai, the Grand Anicut on the Kaveri.
// A river sand-table on a bench. The river comes in at the left, the stone weir holds it
// back across the Kollidam bed, three head sluices beside it feed the Kaveri, the Vennaru
// and the Puthu Aru (Grand Anicut Canal), and each canal runs to a paddy plot that turns
// green when it gets water. Only the surplus spills over the weir to the Kollidam.
// Legend lens: one seamless mortarless wall. Engineering lens: the front edge is a cut
// through the bed showing unhewn stone courses bedded in the sand, scour at the toe that
// lets stones sink and lock, and the later British sluice gates and raised crest, lit.
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

// ---- truth (illustrative hydraulics; the shares are not measured figures) ---------
// Canal capacities as fractions of the biggest flood the table runs. Below their sum
// every drop goes to the canals and the weir spills nothing; above it the canals run
// full and the surplus goes over the weir to the Kollidam.
// each canal leaves the regulator along x, turns at xt and runs back (-y) to its paddy
const CANALS = [
  { id: "puthu", ta: "புது ஆறு", cap: 0.11, y0: -12, y1: -6, xt: 14, plate: { x: 22, y: -13, len: 17 } },
  { id: "vennaru", ta: "வெண்ணாறு", cap: 0.14, y0: -3, y1: 3, xt: 40, plate: { x: 47.5, y: -4, len: 18 } },
  { id: "kaveri", ta: "காவிரி", cap: 0.15, y0: 6, y1: 12, xt: 66, plate: { x: 74, y: 4.6, len: 15 } },
];
const LEG = 6; // canal width
const CAP = CANALS.reduce((s, c) => s + c.cap, 0);
const Q_MIN = 0.05;

// ---- world -----------------------------------------------------------------------
const BASE = { x: -94, y: -66, w: 212, d: 152, r: 8 };
const BASE_H = 10, FOOT_H = 5;
const TX0 = -72, TX1 = 100, TY0 = -56, TY1 = 60; // TY1 is the cut front edge
const TABLE = { x: TX0, y: TY0, w: TX1 - TX0, d: TY1 - TY0, r: 1.2 };
const TOP = 26; // the land
const BED = 14; // the river bed (the sand line)
const CBED = 20; // canal beds and head sills
const FLOOR = 22; // paddy floors
const CREST = 24, CAP_Z = 22; // weir crest with the later raised course
const KOL = { y0: 15, y1: TY1 };
const RIVER_Y0 = -12; // far bank of the river upstream
const FIELD_Y0 = -50, FIELD_Y1 = -24;
const FIELDS = CANALS.map((c) => ({ x0: c.xt + LEG / 2 - 12, x1: c.xt + LEG / 2 + 12 }));
const TREES = [[-60, -40, 6], [-42, -28, 5], [-62, -20, 5.5], [-26, -42, 5.5], [-14, -24, 4.5], [88, -40, 5.5], [90, -16, 5]];
const COURSES = [
  { z0: 0.6, z1: 4.2, w: 28 },
  { z0: 4.2, z1: 7.8, w: 25 },
  { z0: 7.8, z1: 11.4, w: 22 },
  { z0: 11.4, z1: 15, w: 18.5 },
  { z0: 15, z1: 19, w: 15 },
  { z0: 19, z1: CAP_Z, w: 11.5 },
];
const CAPW = 8;
const MONO = 6; // the legend's wall: thin, standing on the sand
const TOE = { x0: 15.4, x1: 27, top: 19, h: 5 };
const BOWL = { x: 38, w: 24, depth: 9 };
const TAIL0 = 15.2;
const GATE_OPEN = 1.6, POST_TOP = 34, BEAM_Z = 32;
const DIAL = { x: -58, y: 72 };
const GAUGE = { x: -36, y: 72, r: 3.4, z0: 1.4, h: 16 };
const POSTS_Y = [-13.6, -4.5, 4.5, 13.5];

const AZ = 50;
const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), ...k.boxCorners(TABLE, 0, TOP), [0, -48, POST_TOP + 3], [GAUGE.x, GAUGE.y, GAUGE.h + 4]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: AZ, elevation: 40 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const fmt = (v) => Math.round(v * 10) / 10;
const poly3 = (pts) => "M" + pts.map((p) => at(p).map(fmt).join(" ")).join("L") + "Z";
const rect3 = (x0, x1, y0, y1, z) => poly3([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);
const slab = (x0, x1, y0, y1, z0, z1, r = 0.5, steps = 2, bevel = 0) => k.slabOf({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r }, z0, z1 - z0, P, steps, bevel);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// seeded random, so the stones are the same on every build
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function split(a, b, n, rnd, jitter = 0.28) {
  const w = (b - a) / n;
  const cuts = [a];
  for (let i = 1; i < n; i++) cuts.push(a + w * i + (rnd() - 0.5) * 2 * jitter * w);
  cuts.push(b);
  return cuts;
}
// a rough stone outline inside a cell: a jittered octagon
function rough(u0, v0, u1, v1, rnd, inset = 0.32) {
  const a0 = u0 + inset, a1 = u1 - inset, b0 = v0 + inset, b1 = v1 - inset;
  const c = Math.min(a1 - a0, b1 - b0) * (0.22 + 0.16 * rnd());
  const j = () => (rnd() - 0.5) * c * 0.5;
  return [
    [a0 + c + j(), b0], [a1 - c + j(), b0],
    [a1, b0 + c + j()], [a1, b1 - c + j()],
    [a1 - c + j(), b1], [a0 + c + j(), b1],
    [a0, b1 - c + j()], [a0, b0 + c + j()],
  ];
}

// ---- stones, shared by the 3D weir and the cut front edge ------------------------
const WEIR = [];
const WEIR_SEC = [];
COURSES.forEach((c, ci) => {
  const rnd = rng(211 + ci * 19);
  const n = Math.max(3, Math.round((2 * c.w) / 7.5));
  const xs = split(-c.w, c.w, n, rnd);
  const ys = split(KOL.y0, KOL.y1, 5, rnd, 0.22);
  for (let i = 0; i < n; i++) {
    const top = c.z1 - rnd() * 0.4;
    WEIR_SEC.push(rough(xs[i], c.z0, xs[i + 1], top, rnd, 0.26));
    for (let r = 0; r < 5; r++) {
      const ring = rough(xs[i], ys[r], xs[i + 1], ys[r + 1], rnd);
      const z1 = r === 4 ? top : c.z1 - rnd() * 0.4;
      if (z1 > BED + 0.3) WEIR.push({ ring, z0: Math.max(c.z0, BED), z1, course: ci, cx: (xs[i] + xs[i + 1]) / 2, cy: (ys[r] + ys[r + 1]) / 2 });
    }
  }
});
WEIR.sort((a, b) => a.course - b.course || k.depthOf([a.cx, a.cy, 0], P) - k.depthOf([b.cx, b.cy, 0], P));
const CAP_CUTS = split(KOL.y0, KOL.y1, 4, rng(7), 0);
const CAP_BLOCKS = CAP_CUTS.slice(0, -1).map((y, i) => [y, CAP_CUTS[i + 1]]);

// ---- the bench --------------------------------------------------------------------
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 22))) {
    out.push(S(k.cylinder(x, y, 7.5, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.8, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(BASE, -BASE_H + 3.5, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(BASE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  return out.join("");
}

// the sand-table body; its front and right-hand faces are covered by the cut sections
function tableBody() {
  return `<path class="iso-halo" d="${k.haloOf(TABLE, 0, 2, P)}" style="filter:blur(5px)"/>` + S(k.slabOf(TABLE, 0, TOP, P, 3, 0.6), { tone: "mid" });
}

// ---- the river network: openings in the land, walls, beds ------------------------
const legOf = (c) => [c.xt, c.xt + LEG];
const OPENINGS = [
  [[TX0, RIVER_Y0], [-4.2, RIVER_Y0], [-4.2, KOL.y0], [TX1, KOL.y0], [TX1, TY1], [TX0, TY1]],
  ...CANALS.flatMap((c) => [
    [[-4.2, c.y0], [c.xt + LEG, c.y0], [c.xt + LEG, c.y1], [-4.2, c.y1]],
    [[c.xt, FIELD_Y1 - 0.2], [c.xt + LEG, FIELD_Y1 - 0.2], [c.xt + LEG, c.y1], [c.xt, c.y1]],
  ]),
  ...FIELDS.map((f) => [[f.x0, FIELD_Y0], [f.x1, FIELD_Y0], [f.x1, FIELD_Y1], [f.x0, FIELD_Y1]]),
];
const openingD = OPENINGS.map((ring) => poly3(ring.map(([x, y]) => [x, y, TOP]))).join("");
// what can be seen of the inside: the openings, the cut front face and the cut end
const FRONT_FACE = poly3([[TX0, TY1, 0], [TX1, TY1, 0], [TX1, TY1, TOP], [TX0, TY1, TOP]]);
const END_FACE = poly3([[TX1, KOL.y0, 0], [TX1, TY1, 0], [TX1, TY1, TOP], [TX1, KOL.y0, TOP]]);

const wallY = (x0, x1, y, zb, zt = TOP, shade = 2) => `<path class="iso-shade" data-shade="${shade}" d="${poly3([[x0, y, zb], [x1, y, zb], [x1, y, zt], [x0, y, zt]])}"/>`;
const wallX = (x, y0, y1, zb, shade = 1) => `<path class="iso-shade" data-shade="${shade}" d="${poly3([[x, y0, zb], [x, y1, zb], [x, y1, TOP], [x, y0, TOP]])}"/>`;
function walls() {
  const out = [wallY(TX0, -4.2, RIVER_Y0, BED - 1)];
  CANALS.forEach((c) => {
    out.push(wallY(-4.2, c.xt, c.y0, CBED - 0.5), wallX(c.xt, FIELD_Y1, c.y0, CBED - 0.5));
  });
  out.push(wallY(-4.2, TX1, KOL.y0, 4));
  FIELDS.forEach((f, i) => {
    const [l0, l1] = legOf(CANALS[i]);
    out.push(wallY(f.x0, f.x1, FIELD_Y0, FLOOR - 0.5), wallX(f.x0, FIELD_Y0, FIELD_Y1, FLOOR - 0.5));
    out.push(wallY(l0, l1, FIELD_Y1, CBED - 0.2, FLOOR)); // the step up from the canal into the paddy
  });
  return out.join("");
}
function beds() {
  const out = [];
  out.push(`<path class="kl-sand-top" d="${poly3([[TX0, RIVER_Y0, BED], [-4.2, RIVER_Y0, BED], [-4.2, KOL.y0, BED], [0, KOL.y0, BED], [0, TY1, BED], [TX0, TY1, BED]])}"/>`);
  const rnd = rng(9);
  const grains = [];
  for (let i = 0; i < 140; i++) grains.push(at([TX0 + 2 + rnd() * 60, RIVER_Y0 + 2 + rnd() * 68, BED]));
  out.push(D(grains, { size: 0.32, tone: "faint" }));
  CANALS.forEach((c) => out.push(`<path class="kl-lining" d="${rect3(-4.2, c.xt + LEG, c.y0, c.y1, CBED)}${rect3(c.xt, c.xt + LEG, FIELD_Y1, c.y0, CBED)}"/>`));
  FIELDS.forEach((f) => out.push(`<path class="kl-earth" d="${rect3(f.x0, f.x1, FIELD_Y0, FIELD_Y1, FLOOR)}"/>`));
  return out.join("");
}

// paddy: rows of seedlings, grey when dry, green with a soft glow when watered
function paddy(i) {
  const f = FIELDS[i];
  const pts = [];
  for (let x = f.x0 + 2.2; x < f.x1 - 1; x += 2.7) for (let y = FIELD_Y0 + 2.4; y < FIELD_Y1 - 1; y += 3) pts.push(at([x, y, FLOOR + 0.3]));
  const dots = (cls, r) => `<g class="${cls}">${pts.map(([x, y]) => `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${r}"/>`).join("")}</g>`;
  return `<g data-field="${i}"><path class="kl-glow" d="${rect3(f.x0 + 1, f.x1 - 1, FIELD_Y0 + 1, FIELD_Y1 - 1, FLOOR)}" opacity="0"/>${dots("kl-seed", 0.62)}<g class="kl-seed-on" opacity="0">${dots("", 0.72)}</g></g>`;
}

// ---- the weir ---------------------------------------------------------------------
function weirStones() {
  return WEIR.map((s) => S(k.extrude(s.ring, s.z0, s.z1 - s.z0, P), { tone: "hi", crease: "lo" })).join("");
}
function capBlocks() {
  return CAP_BLOCKS.map(([y0, y1]) => S(k.slabOf({ x: -CAPW, y: y0 + 0.2, w: 2 * CAPW, d: y1 - y0 - 0.4, r: 0.4 }, CAP_Z, CREST - CAP_Z, P, 2, 0.4), { tone: "hi", lit: true })).join("");
}
function monolith() {
  return S(k.slabOf({ x: -MONO, y: KOL.y0, w: 2 * MONO, d: KOL.y1 - KOL.y0 - 0.2, r: 0.6 }, BED, CREST - BED, P, 3, 0.5), { tone: "hi", lit: true });
}

// the head regulator: lift-gate leaves (the later work, lit) under a bridge on four posts.
// The part of each leaf below the bank is drawn inside the river so the near bank hides it.
function gateLow(c) {
  return `<g class="kl-eng">${S(slab(-0.7, 0.7, c.y0 + 0.2, c.y1 - 0.2, CBED + GATE_OPEN, TOP, 0.2), { tone: "hi", lit: true })}</g>`;
}
function regulator() {
  const out = [];
  const posts = POSTS_Y.map((y) => S(slab(-1.2, 1.2, y - 1.1, y + 1.1, TOP, BEAM_Z, 0.3), { tone: "mid" }));
  CANALS.forEach((c, i) => {
    out.push(posts[i]);
    const cy = (c.y0 + c.y1) / 2;
    out.push(S(slab(-0.7, 0.7, c.y0 + 0.2, c.y1 - 0.2, TOP, TOP + 3.4, 0.2), { tone: "hi", lit: true }));
    out.push(S(k.cylinder(0, cy, 0.5, TOP + 3.4, BEAM_Z - TOP - 3.4, P, 10), { tone: "mid", crease: "none" }));
  });
  out.push(posts[3]);
  out.push(S(slab(-1.7, 1.7, POSTS_Y[0] - 1.3, POSTS_Y[3] + 1.3, BEAM_Z, POST_TOP, 0.3, 2, 0.3), { tone: "mid" }));
  out.push(D(POSTS_Y.map((y) => at([0, y, POST_TOP])), { size: 0.36 }));
  CANALS.forEach((c) => {
    const cy = (c.y0 + c.y1) / 2;
    out.push(S(k.cylinder(0, cy, 2.1, POST_TOP, 1.3, P, 20), { tone: "mid" }));
    out.push(L(k.knurl(0, cy, 2.1, POST_TOP, POST_TOP + 1.3, 16, P), { tone: "lo" }));
  });
  return `<g class="kl-eng">${out.join("")}</g>`;
}

// a small engraved name plate standing on the bank, facing the viewer
function namePlate(x0, yFace, text, len) {
  const out = [S(slab(x0, x0 + len, yFace - 0.9, yFace, TOP, TOP + 5.2, 0.3), { tone: "lo", crease: "none" })];
  out.push(k.faceTextSvg(k.sideMatrix([x0 + 1.3, yFace], TOP + 1.3, P, "left"), text, { size: 3.1, tone: "hi" }));
  out.push(D([at([x0 + 0.7, yFace, TOP + 4.5]), at([x0 + len - 0.7, yFace, TOP + 4.5])], { size: 0.32 }));
  return out.join("");
}

// a tree on the bank: trunk and a round crown
function tree([x, y, r]) {
  return S(k.cylinder(x, y, 0.9, TOP, r * 0.9, P, 12), { tone: "mid", crease: "none" }) + S(G.sphereOf([x, y, TOP + r * 0.9 + r * 0.75], r * 0.85, P), { tone: "mid" });
}

// fading flow streak on the water (blue, with a soft glow)
let gradN = 0;
function flowLine(a3, b3, via = []) {
  const pts = [a3, ...via, b3].map(at);
  const a = pts[0], b = pts[pts.length - 1];
  const id = `kl-g${gradN++}`;
  const stop = (o, op) => `<stop offset="${o}" style="stop-color:var(--kl-flow);stop-opacity:${op}"/>`;
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}">${stop(0, 0)}${stop(0.2, 1)}${stop(0.8, 1)}${stop(1, 0)}</linearGradient><path class="iso-line kl-flow" data-flow="" data-free="" style="stroke:url(#${id})" d="M${pts.map((p) => fmt(p[0]) + " " + fmt(p[1])).join("L")}"/>`;
}

// rim lines where the land meets the water channels
function rims() {
  const seg = (a, b) => k.segment([a[0], a[1], TOP], [b[0], b[1], TOP], P);
  let d = seg([TX0, RIVER_Y0], [CANALS[0].xt, RIVER_Y0]) + seg([-4.2, KOL.y0], [TX1, KOL.y0]);
  CANALS.forEach((c, i) => {
    if (i) d += seg([-4.2, c.y0], [c.xt, c.y0]);
    d += seg([-4.2, c.y1], [c.xt + LEG, c.y1]);
    d += seg([c.xt, c.y0], [c.xt, FIELD_Y1]) + seg([c.xt + LEG, c.y1], [c.xt + LEG, FIELD_Y1]);
    const f = FIELDS[i];
    d += seg([f.x0, FIELD_Y1], [c.xt, FIELD_Y1]) + seg([c.xt + LEG, FIELD_Y1], [f.x1, FIELD_Y1]);
    d += seg([f.x0, FIELD_Y1], [f.x0, FIELD_Y0]) + seg([f.x0, FIELD_Y0], [f.x1, FIELD_Y0]) + seg([f.x1, FIELD_Y0], [f.x1, FIELD_Y1]);
  });
  // pier noses between the heads, and beside the weir
  for (let i = 0; i < 3; i++) d += seg([-4.2, CANALS[i].y1], [-4.2, i < 2 ? CANALS[i + 1].y0 : KOL.y0]);
  return L(d, { tone: "lo" });
}

// ---- the cut front edge (drawn in the plane y = TY1; local coords are (x, -z)) -----
const SEC = k.sideMatrix([0, TY1], 0, P, "left");
const loc = (pts) => "M" + pts.map(([x, z]) => `${fmt(x)} ${fmt(-z)}`).join("L") + "Z";
function frontSection() {
  const out = [];
  out.push(`<clipPath id="kl-sec"><path d="${loc([[TX0, 0], [TX1, 0], [TX1, TOP], [TX0, TOP]])}"/></clipPath>`);
  out.push(`<g clip-path="url(#kl-sec)">`);
  out.push(`<path class="kl-water-sec" data-secwater d=""/>`);
  out.push(`<path class="kl-sand-sec" data-secsand d=""/>`);
  out.push(`<clipPath id="kl-sandclip"><path data-sandclip d=""/></clipPath>`);
  const rnd = rng(55);
  const grains = [];
  for (let i = 0; i < 460; i++) grains.push([TX0 + rnd() * (TX1 - TX0), -(0.4 + rnd() * (BED - 0.6))]);
  out.push(`<g clip-path="url(#kl-sandclip)">${D(grains, { size: 0.3, tone: "lo" })}</g>`);
  out.push(`<path class="kl-waterline" data-secline d=""/>`);
  out.push(`<g class="kl-eng">${WEIR_SEC.map((ring) => `<path class="kl-stone-sec" d="${loc(ring)}"/>`).join("")}<g data-toesec></g><path class="kl-capcut" d="${loc([[-CAPW, CAP_Z], [CAPW, CAP_Z], [CAPW, CREST], [-CAPW, CREST]])}"/></g>`);
  out.push(`<g class="kl-leg"><path class="kl-mono-sec" d="${loc([[-MONO, BED], [MONO, BED], [MONO, CREST], [-MONO, CREST]])}"/></g>`);
  out.push(`</g>`);
  return `<g transform="${SEC}" data-section>${out.join("")}</g>`;
}

// ---- the monsoon dial, a rain gauge and a blank maker's plate on the bench --------------
function dial() {
  const { x, y } = DIAL;
  const R = 9.5, h = 3.6, top = h;
  const out = [];
  out.push(S(k.cylinder(x, y, R + 1.6, 0, 1.2, P, 56), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, R, 1.2, h - 1.2, P, 56, 0.6), { tone: "hi", crease: "lo", inner: L(k.sideArc(x, y, R, top - 1.2, P, 40), { tone: "faint" }) }));
  out.push(L(k.ring(x, y, R - 1.3, top, P, 56), { tone: "lo" }));
  const span = Math.PI * 1.5;
  const t = k.radialTicks(x, y, R - 1.3, 30, 5, top, [1, 2.1], P, -span / 2, span);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 3.4, top, 3.2, P, 32), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 3.4, top, top + 3.2, 26, P), { tone: "lo" }));
  out.push(`<g data-pointer></g>`);
  return out.join("");
}
function gauge() {
  const { x, y, r, z0, h } = GAUGE;
  const out = [S(k.cylinder(x, y, r + 1.6, 0, z0, P, 32), { tone: "lo" })];
  out.push(`<g data-gaugefill></g>`);
  out.push(S(k.cylinder(x, y, r, z0, h, P, 32), { tone: "faint", crease: "none", className: "kl-glass" }));
  out.push(L([4, 8, 12].map((z) => k.sideArc(x, y, r, z0 + z, P, 24)).join(""), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, r + 0.6, z0 + h, 1, P, 32), { tone: "mid" }));
  out.push(`<path class="iso-shade" data-shade="0" d="${k.cylinder(x, y, r - 0.4, z0 + h + 0.99, 0.01, P, 28).fill}"/>`);
  out.push(L(k.ring(x, y, r - 0.4, z0 + h + 1, P, 28), { tone: "lo" }));
  return out.join("");
}
function makersPlate() {
  const plan = { x: 64, y: 68, w: 36, d: 11, r: 1.2 };
  return [
    S(k.slabOf(plan, 0, 0.8, P, 4), { tone: "lo", crease: "none" }),
    L(k.planOutline(k.insetPlan(plan, 1.4), 0.8, P, 4), { tone: "faint" }),
    L(k.lineOnTop([plan.x + 4, plan.y + 4], [plan.x + 30, plan.y + 4], 0.8, P), { tone: "lo", free: true }),
    L(k.lineOnTop([plan.x + 4, plan.y + 6.4], [plan.x + 24, plan.y + 6.4], 0.8, P), { tone: "lo", free: true }),
    L(k.lineOnTop([plan.x + 4, plan.y + 8.8], [plan.x + 16, plan.y + 8.8], 0.8, P), { tone: "lo", free: true }),
    D([at([plan.x + 2.2, plan.y + 2.2, 0.8]), at([plan.x + plan.w - 2.2, plan.y + plan.d - 2.2, 0.8])], { size: 0.42 }),
  ].join("");
}

// ---- assemble, back to front --------------------------------------------------------
const inside = [];
inside.push(walls(), beds());
FIELDS.forEach((_, i) => inside.push(`<path class="kl-water" data-water="field${i}" d=""/>`, paddy(i)));
inside.push(`<path class="kl-water" data-water="pond" d=""/>`);
inside.push(`<g data-flows="pond">${[-6, 10, 28, 46].map((y) => flowLine([TX0 + 2, y, 0], [-30, y, 0])).join("")}</g>`);
CANALS.forEach((c) => {
  inside.push(gateLow(c));
  inside.push(`<path class="kl-water" data-water="${c.id}" d=""/>`);
  const cy = (c.y0 + c.y1) / 2, cx = c.xt + LEG / 2;
  inside.push(`<g data-flows="${c.id}">${flowLine([4, cy, 0], [cx, FIELD_Y1 + 3, 0], [[cx, cy, 0]])}</g>`);
});
inside.push(`<g data-scoursand></g>`);
inside.push(`<g class="kl-eng">${weirStones()}</g>`);
inside.push(`<g class="kl-leg">${monolith()}</g>`);
inside.push(`<g class="kl-eng">${capBlocks()}</g>`);
inside.push(`<path class="kl-water" data-water="tailA" d=""/>`);
inside.push(`<g class="kl-eng" data-toe></g>`);
inside.push(`<path class="kl-water kl-sheet" data-water="crest" d=""/>`);
inside.push(`<g data-flows="fall"></g>`);
inside.push(`<path class="kl-water" data-water="tailB" d=""/>`);
inside.push(`<g data-flows="kol">${[24, 38, 52].map((y) => flowLine([TOE.x1 + 12, y, 0], [TX1 + 2, y, 0])).join("")}</g>`);

// things standing on the land, far to near
const above = [
  ...TREES.map((t) => ({ at: [t[0], t[1]], svg: tree(t) })),
  ...CANALS.map((c) => ({ at: [c.plate.x + c.plate.len / 2, c.plate.y], svg: namePlate(c.plate.x, c.plate.y, c.ta, c.plate.len) })),
  { at: [85, 14.6], svg: namePlate(72, 14.6, "கொள்ளிடம்", 26) },
  { at: [0, 12], svg: regulator() },
].sort((a, b) => k.depthOf([a.at[0], a.at[1], 0], P) - k.depthOf([b.at[0], b.at[1], 0], P)).map((o) => o.svg);

const body = [bench(), tableBody()];
body.push(`<clipPath id="kl-in"><path d="${openingD}${FRONT_FACE}${END_FACE}"/></clipPath><g clip-path="url(#kl-in)">${inside.join("")}</g>`);
body.push(rims());
body.push(`<path class="kl-sand-sec" data-endsand d=""/><path class="kl-water-sec" data-endwater d=""/><path class="kl-waterline" data-endline d=""/>`);
body.push(frontSection());
body.push(...above);
body.push(gauge(), dial(), makersPlate());

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A river sand-table on a bench: the Kaveri comes in from the left, and a low stone weir holds it back across the Kollidam bed. Beside the weir, three head sluices feed three canals, the Kaveri, the Vennaru and the Puthu Aru, each running to a small paddy field that turns green when it gets water. Only the surplus spills over the weir and on down the Kollidam. Each channel has a tiny engraved Tamil name plate. A monsoon dial on the bench sets the river from drought to flood, and a rain gauge beside it fills. The front edge of the table is cut away to show the riverbed: in the legend lens the weir is one thin seamless wall standing on the sand; in the engineering lens it is unhewn stones laid in courses and bedded deep in the sand, scour at its toe lets stones sink and lock, and the later sluice gates and raised crest are lit.",
  body,
});

// ---- live ---------------------------------------------------------------------------
const live = `
${LENS_JS}
const P = ${JSON.stringify(P)};
const CANALS = ${JSON.stringify(CANALS.map(({ id, cap, y0, y1, xt }) => ({ id, cap, y0, y1, xt })))};
const LEG = ${LEG}, RIVER_Y0 = ${RIVER_Y0}, FIELD_Y0 = ${FIELD_Y0}, FIELD_Y1 = ${FIELD_Y1};
const FIELDS = ${JSON.stringify(FIELDS)};
const KOL = ${JSON.stringify(KOL)};
const COURSES = ${JSON.stringify(COURSES)};
const TOE = ${JSON.stringify(TOE)};
const BOWL = ${JSON.stringify(BOWL)};
const CAP = ${CAP}, Q_MIN = ${Q_MIN}, TAIL0 = ${TAIL0};
const TX0 = ${TX0}, TX1 = ${TX1}, TY1 = ${TY1}, TOP = ${TOP}, BED = ${BED}, CBED = ${CBED}, FLOOR = ${FLOOR}, CREST = ${CREST}, CAPW = ${CAPW}, MONO = ${MONO};
const DIAL = [${DIAL.x}, ${DIAL.y}, 6.8], GAUGE = ${JSON.stringify(GAUGE)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q$ = (s) => svg.querySelector(s);
const readout = document.querySelector("[data-readout]");
const water = {}; svg.querySelectorAll("[data-water]").forEach((n) => (water[n.dataset.water] = n));
const flows = {}; svg.querySelectorAll("[data-flows]").forEach((n) => (flows[n.dataset.flows] = n));
const fields = FIELDS.map((_, i) => { const g = q$('[data-field="' + i + '"]'); return { glow: g.querySelector(".kl-glow"), on: g.querySelector(".kl-seed-on") }; });
const secWater = q$("[data-secwater]"), secSand = q$("[data-secsand]"), sandClip = q$("[data-sandclip]"), secLine = q$("[data-secline]");
const endSand = q$("[data-endsand]"), endWater = q$("[data-endwater]"), endLine = q$("[data-endline]");
const scourSand = q$("[data-scoursand]"), toe3d = q$("[data-toe]"), toeSec = q$("[data-toesec]");
const pointer = q$("[data-pointer]"), gaugeFill = q$("[data-gaugefill]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const f1 = (v) => Math.round(v * 10) / 10;
const P3 = (pts) => "M" + pts.map((p) => iso(p, P).map(f1).join(" ")).join("L") + "Z";
const R3 = (x0, x1, y0, y1, z) => P3([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);
const LOC = (pts) => "M" + pts.map(([x, z]) => f1(x) + " " + f1(-z)).join("L");
const set = (n, d) => { if (n._d !== d) { n.setAttribute("d", d); n._d = d; } };
const html = (n, h) => { if (n._h !== h) { n.innerHTML = h; n._h = h; } };
const attr = (n, a, v) => { const s = String(v); if (n["_" + a] !== s) { n.setAttribute(a, s); n["_" + a] = s; } };

// ---- model ----
function model(q) {
  const share = Math.min(1, q / CAP);
  const canal = CANALS.map((c) => c.cap * share);
  const spill = Math.max(0, q - CAP);
  const s = spill / (1 - CAP);
  const pond = q <= CAP ? CBED + 0.4 + (CREST - 0.5 - CBED - 0.4) * Math.pow(share, 0.7) : CREST + 1.6 * Math.pow(s, 2 / 3);
  const lanes = CANALS.map(() => CBED + 0.3 + 3.4 * Math.pow(share, 0.6));
  const tail = TAIL0 + 5.4 * Math.pow(s, 0.6);
  return { q, share, canal, spill, s, pond, lanes, tail };
}
const halfAt = (z) => { for (const c of COURSES) if (z < c.z1) return c.w; return CAPW; };
const bowl = (x) => { const t = (x - BOWL.x) / BOWL.w; return Math.abs(t) < 1 ? (1 - t * t) * (1 - t * t) : 0; };
const sandAt = (x, sc) => BED - sc * bowl(x);

// toe stones, seeded per course so each course keeps its look as it sinks
function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function roughOf(u0, v0, u1, v1, r, inset) {
  const a0 = u0 + inset, a1 = u1 - inset, b0 = v0 + inset, b1 = v1 - inset;
  const c = Math.min(a1 - a0, b1 - b0) * (0.22 + 0.16 * r());
  const j = () => (r() - 0.5) * c * 0.5;
  return [[a0 + c + j(), b0], [a1 - c + j(), b0], [a1, b0 + c + j()], [a1, b1 - c + j()], [a1 - c + j(), b1], [a0 + c + j(), b1], [a0, b1 - c + j()], [a0, b0 + c + j()]];
}
const toeCache = new Map();
function toeCourse(j) {
  if (toeCache.has(j)) return toeCache.get(j);
  const r = rnd(9000 + j * 31);
  const ys = [KOL.y0]; for (let i = 1; i < 5; i++) ys.push(KOL.y0 + (KOL.y1 - KOL.y0) * i / 5 + (r() - 0.5) * 2.6); ys.push(KOL.y1);
  const plans = []; for (let i = 0; i < 5; i++) plans.push(roughOf(TOE.x0, ys[i], TOE.x1, ys[i + 1], r, 0.32));
  plans.sort((a, b) => depthOf([a[0][0], a[0][1], 0], P) - depthOf([b[0][0], b[0][1], 0], P));
  const out = { plans, sec: roughOf(TOE.x0, 0, TOE.x1, TOE.h, r, 0.26), sag: r() * 0.35 };
  toeCache.set(j, out);
  if (toeCache.size > 40) toeCache.delete(toeCache.keys().next().value);
  return out;
}

// ---- state ----
let lens = "tradition", q = 0.3, target = 0.3, frame = 0, last = 0, touring = true, visible = false, idle = 0, clock = 0;
let eng = 0, scour = 0, laid = 0, sink = 0, sinkT = 0, laying = false, layT = 0, first = true;
const lv = { pond: 0, tail: 0, lanes: [0, 0, 0], fields: [0, 0, 0], green: [0, 0, 0] };

function tourAt(t) {
  // dry season, the monsoon rises to a flood, holds, falls back; 16 s a loop
  const T = t % 16;
  if (T < 2.4) return 0.3;
  if (T < 7.2) return 0.3 + 0.7 * ease((T - 2.4) / 4.8);
  if (T < 9.6) return 1;
  if (T < 13.6) return 1 - 0.7 * ease((T - 9.6) / 4);
  return 0.3;
}
const season = (v) => v < 0.16 ? "drought" : v <= CAP ? "dry season" : v < 0.7 ? "high water" : "flood";

let gid = 0;
function streak(pts) {
  const s = pts.map((p) => iso(p, P));
  const a = s[0], c = s[s.length - 1];
  const id = "kl-f" + (gid = (gid + 1) % 64);
  const stop = (o, op) => '<stop offset="' + o + '" style="stop-color:var(--kl-flow);stop-opacity:' + op + '"/>';
  return '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(c[0]) + '" y2="' + f1(c[1]) + '">' + stop(0, 0) + stop(0.2, 1) + stop(0.8, 1) + stop(1, 0) + '</linearGradient><path class="iso-line kl-flow" data-flow="" data-free="" style="stroke:url(#' + id + ')" d="M' + s.map((p) => f1(p[0]) + " " + f1(p[1])).join("L") + '"/>';
}

// the crest sheet: over the cap and down the stepped face, a film above the stones
function sheetProfile(legend, film, tail) {
  const toeTop = TOE.top - sink;
  const pts = legend
    ? [[-MONO, CREST + film], [MONO, CREST + film], [MONO + 3, tail]]
    : [[-CAPW, CREST + film], [CAPW, CREST + film], [COURSES[5].w + 0.4, COURSES[5].z1 + film * 0.8 + 0.3], [COURSES[4].w + 0.4, COURSES[4].z1 + film * 0.8 + 0.3], [TOE.x1, Math.max(tail, toeTop) + film * 0.6 + 0.3], [TOE.x1 + 3, tail]];
  return pts.map(([x, z]) => [x, Math.max(z, tail)]);
}

function drawWater(m) {
  const legend = eng < 0.5;
  const over = lv.pond > CREST + 0.05;
  const xk = legend ? -MONO : over ? -CAPW : -halfAt(lv.pond);
  const p = lv.pond;
  set(water.pond, P3([[TX0, RIVER_Y0, p], [-4.2, RIVER_Y0, p], [-4.2, KOL.y0, p], [xk, KOL.y0, p], [xk, TY1, p], [TX0, TY1, p]]) + CANALS.map((c) => R3(-4.2, -0.7, c.y0, c.y1, p)).join(""));
  attr(flows.pond, "transform", translateAlong(P, [0, 0, p]));
  CANALS.forEach((c, i) => {
    const z = lv.lanes[i];
    set(water[c.id], R3(0.7, c.xt, c.y0, c.y1, z) + R3(c.xt, c.xt + LEG, FIELD_Y1, c.y1, z));
    attr(flows[c.id], "transform", translateAlong(P, [0, 0, z]));
    attr(flows[c.id], "opacity", f1(clamp((z - CBED - 0.4) / 1.2, 0, 1)));
  });
  FIELDS.forEach((f, i) => {
    const z = lv.fields[i];
    set(water["field" + i], z > FLOOR + 0.05 ? R3(f.x0, f.x1, FIELD_Y0, FIELD_Y1, z) : "");
    const g = lv.green[i];
    attr(fields[i].on, "opacity", g.toFixed(2));
    attr(fields[i].glow, "opacity", (g * 0.85).toFixed(2));
  });
  const tail = lv.tail;
  const film = over ? Math.max(0.25, (lv.pond - CREST) * 0.6) : 0;
  if (over) {
    const prof = sheetProfile(legend, film, tail);
    let d = "";
    for (let i = 0; i < prof.length - 1; i++) {
      const [xa, za] = prof[i], [xb, zb] = prof[i + 1];
      d += P3([[xa, KOL.y0, za], [xb + 0.05, KOL.y0, zb], [xb + 0.05, TY1, zb], [xa, TY1, za]]);
    }
    set(water.crest, d);
    html(flows.fall, [24, 38, 52].map((y) => streak(prof.map(([x, z]) => [x, y, z + 0.05]))).join(""));
  } else { set(water.crest, ""); html(flows.fall, ""); }
  const tx = legend ? MONO : halfAt(tail);
  const toeTop = TOE.top - sink;
  const behind = legend ? TX1 : TOE.x0;
  set(water.tailA, P3([[tx, KOL.y0, tail], [behind, KOL.y0, tail], [behind, TY1, tail], [tx, TY1, tail]]));
  const bx = tail >= toeTop ? TOE.x0 : TOE.x1;
  set(water.tailB, legend ? "" : P3([[bx, KOL.y0, tail], [TX1, KOL.y0, tail], [TX1, TY1, tail], [bx, TY1, tail]]));
  attr(flows.kol, "transform", translateAlong(P, [0, 0, tail]));
  attr(flows.kol, "opacity", f1(clamp((tail - TAIL0 - 0.15) / 1.2, 0, 1)));
  // the cut right-hand end of the Kollidam
  const sEnd = sandAt(TX1, scour * eng);
  set(endSand, P3([[TX1, KOL.y0, 0], [TX1, TY1, 0], [TX1, TY1, sEnd], [TX1, KOL.y0, sEnd]]));
  set(endWater, P3([[TX1, KOL.y0, sEnd], [TX1, TY1, sEnd], [TX1, TY1, tail], [TX1, KOL.y0, tail]]));
  set(endLine, "M" + iso([TX1, KOL.y0, tail], P).map(f1).join(" ") + "L" + iso([TX1, TY1, tail], P).map(f1).join(" "));
}

function drawBed() {
  const sc = scour * eng;
  const xs = []; for (let x = 0; x < TX1; x += x < BOWL.x - BOWL.w - 2 || x > BOWL.x + BOWL.w + 2 ? 8 : 2) xs.push(x);
  xs.push(TX1);
  let top = "";
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1], za = sandAt(a, sc), zb = sandAt(b, sc);
    const tone = zb < za - 0.05 ? "kl-sand-dn" : zb > za + 0.05 ? "kl-sand-up" : "kl-sand-top";
    top += '<path class="' + tone + '" d="' + P3([[a, KOL.y0, za], [b + 0.05, KOL.y0, zb], [b + 0.05, TY1, zb], [a, TY1, za]]) + '"/>';
  }
  html(scourSand, top);
  const legend = eng < 0.5;
  const over = lv.pond > CREST + 0.05;
  const film = over ? Math.max(0.25, (lv.pond - CREST) * 0.6) : 0;
  const wpts = over
    ? [[TX0, 0], [TX0, lv.pond], [legend ? -MONO : -CAPW, lv.pond], ...sheetProfile(legend, film, lv.tail), [TX1, lv.tail], [TX1, 0]]
    : [[TX0, 0], [TX0, lv.pond], [0, lv.pond], [0, lv.tail], [TX1, lv.tail], [TX1, 0]];
  set(secWater, LOC(wpts) + "Z");
  const prof = []; for (let x = TX0; x <= TX1 + 0.01; x += x > 10 && x < 66 ? 1.5 : 4) prof.push([x, sandAt(x, sc)]);
  const sand = LOC([[TX0, 0], ...prof, [TX1, 0]]) + "Z";
  set(secSand, sand); set(sandClip, sand);
  const upFace = legend ? -MONO : over ? -CAPW : -halfAt(lv.pond);
  set(secLine, LOC([[TX0, lv.pond], [upFace, lv.pond]]) + LOC([[legend ? MONO + 3 : over ? TOE.x1 + 3 : halfAt(lv.tail), lv.tail], [TX1, lv.tail]]));
  // the toe: courses laid one on another; the top course sinks as the sand under it is scoured
  let h3 = "", hs = "";
  const n0 = laid - 4, n1 = laying ? laid + 1 : laid;
  const drop = laying ? (1 - ease(layT)) * 12 : 0;
  const fade = laying ? ease(layT * 2.2) : 1;
  for (let j = n0; j <= n1; j++) {
    const c = toeCourse(j);
    const zt = TOE.top + (j - laid) * TOE.h - sink + (j === laid + 1 ? drop : 0) - c.sag;
    const zb = zt - TOE.h + c.sag;
    if (zt < 0) continue;
    const op = j === laid + 1 ? fade : 1;
    hs += '<path class="kl-stone-sec kl-toe-sec"' + (op < 1 ? ' opacity="' + op.toFixed(2) + '"' : "") + ' d="' + LOC(c.sec.map(([x, z]) => [x, zb + z * (zt - zb) / TOE.h])) + 'Z"/>';
    const floorZ = Math.max(zb, sandAt((TOE.x0 + TOE.x1) / 2, sc));
    if (zt > floorZ + 0.2) {
      const g = c.plans.map((ring) => solidSvg(extrude(ring, floorZ, zt - floorZ, P), { tone: "hi", crease: "lo" })).join("");
      h3 += op < 1 ? '<g opacity="' + op.toFixed(2) + '">' + g + "</g>" : g;
    }
  }
  html(toe3d, h3); html(toeSec, hs);
}

function drawControls() {
  const span = Math.PI * 1.5, ang = -span / 2 + span * (q - Q_MIN) / (1 - Q_MIN);
  // radialTicks: angle 0 points to -y, clockwise seen from above
  const dir = [Math.sin(ang), -Math.cos(ang)];
    const hub = [DIAL[0], DIAL[1]];
  html(pointer, lineSvg(lineOnTop(hub, [DIAL[0] + dir[0] * 3.3, DIAL[1] + dir[1] * 3.3], DIAL[2], P), { tone: "hi" }) + dotsSvg([iso([DIAL[0], DIAL[1], DIAL[2]], P)], { size: 0.5, tone: "hi" }));
  const h = 0.4 + (GAUGE.h - 1.4) * clamp(q, 0, 1);
  html(gaugeFill, '<g class="kl-gauge-water">' + solidSvg(cylinder(GAUGE.x, GAUGE.y, GAUGE.r - 0.5, GAUGE.z0 + 0.2, h, P, 24), { tone: "faint", crease: "none" }) + "</g>");
}

function draw() {
  const m = model(q);
  drawWater(m);
  drawBed();
  drawControls();
  const sp = m.spill > 0.005 ? Math.round((100 * m.spill) / m.q) : 0;
  const s = season(q);
  let text;
  if (lens === "tradition") {
    text = s + ' · legend: "no cement, and no one can explain it"';
  } else if (laying) {
    text = "sand settles back · a new course goes on top";
  } else if (scour > 1.2 && sink < sinkT - 0.03) {
    text = "scour pulls sand from the toe · stones sink and lock";
  } else if (s === "drought") text = "drought · too little water, the fields dry out";
  else if (s === "dry season") text = "dry season · every drop goes to the fields";
  else if (sp < 25) text = "high water · fields full, the weir starts to spill";
  else text = "flood · fields full, ≈" + sp + "% spills to the Kollidam";
  if (readout.textContent !== text) readout.textContent = text;
  const now = Math.round(q * 100);
  if (stage._v !== now) { stage._v = now; stage.setAttribute("aria-valuenow", String(now)); stage.setAttribute("aria-valuetext", s + ", river at " + now + " percent of a flood"); }
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { clock += dt; target = tourAt(clock); }
  const e = (tau) => (calm || first ? 1 : 1 - Math.exp(-dt / tau));
  const dq = target - q;
  q = Math.abs(dq) < 0.0005 ? target : q + dq * e(0.35);
  const m = model(q);
  let moving = q !== target;
  const follow = (cur, want, tau) => { const v = cur + (want - cur) * e(tau); if (Math.abs(want - v) > 0.01) moving = true; return Math.abs(want - v) > 0.002 ? v : want; };
  lv.pond = follow(lv.pond, m.pond, 0.5);
  lv.lanes = lv.lanes.map((z, i) => follow(z, m.lanes[i], 0.6));
  lv.fields = lv.fields.map((z, i) => follow(z, lv.lanes[i] > FLOOR + 0.2 ? Math.min(lv.lanes[i], FLOOR + 1.2) : FLOOR - 0.5, 0.8));
  lv.green = lv.green.map((g) => follow(g, clamp((m.share - 0.18) / 0.5, 0, 1), 1.1));
  lv.tail = follow(lv.tail, m.tail, 0.6);
  eng = follow(eng, lens === "anatomy" ? 1 : 0, 0.3);
  // scour follows the spill with a lag; the sand refills as the river falls
  scour = follow(scour, BOWL.depth * Math.pow(m.s, 0.8), 1.3);
  if (lens === "anatomy") {
    const toeScour = scour * bowl((TOE.x0 + TOE.x1) / 2) * 1.25;
    sinkT = Math.max(sinkT, Math.min(TOE.h, toeScour));
    if (!laying && m.q <= CAP && sinkT >= 0.5 * TOE.h && scour < 1) { laying = true; layT = 0; }
    if (laying) { sinkT = TOE.h; layT = calm ? 1 : Math.min(1, layT + dt / 1.8); moving = true; }
    sink = follow(sink, sinkT, 0.9);
    if (laying && layT >= 1 && sink === sinkT) { laid += 1; sink = 0; sinkT = 0; laying = false; layT = 0; }
  }
  first = false;
  draw();
  frame = visible && (touring || moving) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, Q_MIN, 1); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 4200); run(); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (e) => {
  const box = svg.getBoundingClientRect();
  steer(Q_MIN + clamp(((e.clientX - box.left) / box.width - 0.15) / 0.7, 0, 1) * (1 - Q_MIN));
});
stage.addEventListener("keydown", (e) => {
  let to = null;
  const step = 0.1;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") to = Math.round(target / step) * step + step;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = Math.round(target / step) * step - step;
  if (e.key === "Home") to = Q_MIN;
  if (e.key === "End") to = 1;
  if (to === null) return;
  e.preventDefault();
  steer(to);
});
wireLens((id) => { lens = id; if (id !== "anatomy") { sink = 0; sinkT = 0; laying = false; } run(); });
draw();
`;

const STYLE = `<style>
.iso{--kl-water:var(--anatomy-blue);--kl-flow:#b4d3ff;--kl-water-a:.3;--kl-sec-a:.34;--kl-green:var(--anatomy-green)}
.iso[data-theme="light"]{--kl-flow:#1f5fd6;--kl-water-a:.22;--kl-sec-a:.24}
.kl-water{fill:var(--kl-water);fill-opacity:var(--kl-water-a);stroke:var(--kl-water);stroke-opacity:.6;stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round}
.kl-sheet{fill-opacity:calc(var(--kl-water-a) + .1)}
.kl-water-sec{fill:var(--kl-water);fill-opacity:var(--kl-sec-a);stroke:none}
.kl-waterline{fill:none;stroke:var(--kl-water);stroke-width:.9;vector-effect:non-scaling-stroke;stroke-linecap:round}
.kl-flow{stroke-width:.8;filter:drop-shadow(0 0 1.2px var(--kl-water))}
.kl-sand-top{fill:var(--anatomy-top);stroke:none}
.kl-sand-dn{fill:var(--anatomy-shade-3);stroke:none}
.kl-sand-up{fill:var(--anatomy-shade-1);stroke:none}
.kl-lining{fill:var(--anatomy-shade-1);stroke:none}
.kl-earth{fill:var(--anatomy-shade-2);stroke:none}
.kl-sand-sec{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round}
.kl-stone-sec{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round}
.kl-toe-sec{stroke:var(--anatomy-hi)}
.kl-capcut,.kl-mono-sec{fill:var(--anatomy-lit-top);stroke:var(--anatomy-lit);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke}
.kl-seed circle{fill:var(--anatomy-mid);opacity:.55}
.kl-seed-on circle{fill:var(--kl-green)}
.kl-glow{fill:var(--kl-green);fill-opacity:.22;filter:blur(2.5px)}
.kl-glass>.iso-fill,.kl-glass>.iso-shade,.kl-glass>.iso-top{fill-opacity:.12}
.kl-gauge-water .iso-fill,.kl-gauge-water .iso-top,.kl-gauge-water .iso-shade{fill:var(--kl-water);fill-opacity:.55}
.kl-gauge-water .iso-edge{stroke:var(--kl-water)}
.kl-eng{opacity:0;transition:opacity .7s var(--anatomy-ease)}
.kl-leg{transition:opacity .7s var(--anatomy-ease)}
body[data-lens="anatomy"] .kl-eng{opacity:1}
body[data-lens="anatomy"] .kl-leg{opacity:0}
@media (max-width:560px){.iso-plate{overflow:hidden;padding-bottom:92px}.iso-stage{width:116%;margin:-5% -8% -3%}.iso-plate-corner[data-corner="hint"]{bottom:40px}.iso-plate-corner[data-corner="readout"]{white-space:normal;left:0;text-align:right;line-height:1.35}}
@media (prefers-reduced-motion:reduce){.kl-eng,.kl-leg{transition:none}}
</style>`;

const plate = k.plateHtml({
  fig: "Fig 4",
  title: "Kallanai · the stone weir",
  hint: "Hover or ← → for the monsoon · T / A lens",
  readout: 'dry season · legend: "no cement, and no one can explain it"',
  keys: [
    { mark: "blue", label: "Water: river, canals, flooded paddy" },
    { mark: "green", label: "Paddy that has water" },
    { mark: "lit", label: "Legend: one seamless wall · Engineering: later sluice gates and raised crest" },
    { mark: "raised", label: "Unhewn stones in courses, bedded in sand" },
  ],
  caption:
    "1 · The river comes in from the left. 2 · The weir holds it back and divides it: three head sluices feed the Kaveri, the Vennaru and the Puthu Aru (Grand Anicut Canal). 3 · The fields get their water first; only the surplus spills over the weir into the Kollidam. Turn the monsoon dial from drought to flood. The front edge of the table is cut away to show the riverbed. The table is a schematic, not a map, and the shares are illustrative, not measured.",
  body: `${STYLE}<div class="iso-stage" tabindex="0" role="slider" aria-label="Kallanai sand-table: arrow keys turn the monsoon dial from drought to flood" aria-valuemin="5" aria-valuemax="100" aria-valuenow="30">${svg}</div>`,
});

const html = page({
  title: "Kallanai",
  theme,
  tamil: "கல்லணை · Kallanai, the Grand Anicut",
  lenses: [{ id: "tradition", label: "The legend" }, { id: "anatomy", label: "The engineering" }],
  notes: {
    tradition:
      "<b>What the legend says.</b> Kallanai is traditionally credited to the Chola king <b>Karikalan</b> (Karikala Chola), usually dated to about the 2nd century CE, and it is often called one of the oldest water-regulating works in the world still in use. The version that travels online adds that it was built without cement and that scientists still cannot explain how it stands on a sandy riverbed. This lens draws it the way that story imagines it: one thin, seamless wall standing on the sand, holding back the Kaveri.",
    anatomy:
      "<b>How it actually works.</b> Kallanai is a low diversion weir, not a tall dam: about 329 m long and about 20 m wide, of unhewn stone and clay laid across the Kaveri's sandy bed near Tiruchirappalli. Its job is to hold the river back and divide it, so the delta's channels get water. The usual explanation of how it stands is plain engineering: big stones were laid on the bed, the current scoured the sand from under them, they sank and bedded in deeper, and more stones went on top, until the mass locked together by weight and friction. No cement is needed for that. What stands today is the ancient core under major later work: in the 19th century British engineers, notably <b>Sir Arthur Cotton</b>, studied it closely (Cotton is often quoted as saying its builders taught them how to found a work on loose sand), built the Upper Anicut at Mukkombu in the 1830s, and remodelled the Grand Anicut with sluices and a raised crest, drawn lit here. The flow now divides among the Kaveri, the Vennaru and the Grand Anicut Canal (Puthu Aru), with the surplus going to the Kollidam (Coleroon).",
  },
  sources:
    "Tamil Nadu Water Resources Department, description of the Grand Anicut; Sir Arthur Cotton's 19th-century accounts of the Cauvery works; standard histories of the Chola period for the Karikalan attribution. Dimensions are the commonly cited approximations; the table's channel shares are illustrative.",
  plate,
  script: kitScript() + live,
});

const out = theme === "light" ? "kallanai-light.html" : "kallanai.html";
writeFileSync(join(HERE, out), html);
console.log("wrote", out);
