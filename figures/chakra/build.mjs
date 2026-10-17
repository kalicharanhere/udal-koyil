// Fig 3 — Chakra: the seven wheels, and the rising of bindu.
// Tradition lens: a glass channel (sushumna) rises through seven toothed wheels, one per
// chakra, each with as many teeth as its lotus has petals. A lit bead (bindu, carried by
// kundalini) leaves the coil at the base and climbs; each wheel it pierces spins up.
// Anatomy lens: the wheels stop and dim, the bead stays at the base, and specimen trays slide
// in beside the column carrying what really sits at those heights: nerve plexuses and glands.
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
const HEIGHT = 440;

// ---- truth -------------------------------------------------------------
// Petals, elements, bija and the yantra drawn in each pericarp follow the
// Sat-Chakra-Nirupana (Avalon, The Serpent Power, 1919). Tamil names are the Siddha adharams.
const CHAKRAS = [
  { sa: "Muladhara", ta: "மூலாதாரம்", at: "base of spine", n: 4, el: "earth", bija: "LAM", yantra: "square",
    an: ["base of spine · sacral & coccygeal plexuses", "unspent sperm are reabsorbed; none climb"] },
  { sa: "Svadhisthana", ta: "சுவாதிட்டானம்", at: "genitals", n: 6, el: "water", bija: "VAM", yantra: "crescent",
    an: ["pelvis · hypogastric (pelvic) plexus", "gonads · nothing travels up the spine"] },
  { sa: "Manipura", ta: "மணிபூரகம்", at: "navel", n: 10, el: "fire", bija: "RAM", yantra: "triangle",
    an: ["navel · celiac ('solar') plexus", "mapped to the adrenals and pancreas"] },
  { sa: "Anahata", ta: "அநாகதம்", at: "heart", n: 12, el: "air", bija: "YAM", yantra: "hexagram",
    an: ["heart · cardiac plexus", "thymus, behind the breastbone"] },
  { sa: "Vishuddha", ta: "விசுத்தி", at: "throat", n: 16, el: "space", bija: "HAM", yantra: "circle",
    an: ["throat · pharyngeal plexus", "thyroid, below the larynx"] },
  { sa: "Ajna", ta: "ஆக்ஞை", at: "between the brows", n: 2, el: "mind", bija: "OM", yantra: "yoni",
    an: ["brow · pituitary, under the brain", "a common mapping, not an equivalence"] },
  { sa: "Sahasrara", ta: "சகஸ்ராரம்", at: "crown", n: 1000, el: "beyond the elements", bija: "", yantra: "",
    an: ["pineal gland · about 5–8 mm, deep in brain", "makes melatonin, mostly at night"] },
];

// ---- world -------------------------------------------------------------
const AZ = 58;
const BENCH = { x: -160, y: -40, w: 320, d: 88, r: 8 };
const BENCH_H = 12;
const FOOT_H = 5;

const PL0 = { x: -26, y: -26, w: 52, d: 52, r: 3 }; // tower plinth, lower tier
const PL0_H = 8;
const PL1 = { x: -19, y: -19, w: 38, d: 38, r: 2.5 }; // upper tier
const PL1_TOP = 18;
const FLANGE_TOP = 21;

const TUBE_R = 4; // the glass channel: sushumna
const HUB_R = 6.2, HUB_H = 4;
const PLATE_H = 2;
const CAP_R = 10.5, CAP_H = 1.8;
const STEP = 24;
const plateZ = (i) => 34 + STEP * i;
const hubBottom = (i) => plateZ(i) - HUB_H;
const capTop = (i) => plateZ(i) + PLATE_H + CAP_H;
const DOME_Z = plateZ(6); // the crown canopy's rim
const DOME_R = 26, DOME_H = 18;
const BOSS_Z = DOME_Z - 6;
const STEM_TOP = DOME_Z + DOME_H + 5;
const COLLAR_TOP = STEM_TOP + 4;
const FINIAL_Z = COLLAR_TOP + 3.2;

// petal plates: base radius, petal reach, petal sharpness
const WHEELS = CHAKRAS.slice(0, 6).map((c, i) => ({
  n: c.n,
  z: plateZ(i),
  r0: c.n === 2 ? 8.6 : 12,
  a: c.n === 2 ? 15.5 : 11,
  e: c.n === 2 ? 3.2 : c.n === 4 ? 1.1 : c.n === 6 ? 0.9 : 0.7,
  yantra: c.yantra,
}));

// the bead's resting height at each level (inside the glass just above that wheel)
const BEAD_R = 3.2;
const BEAD_AT = [...WHEELS.map((_, i) => capTop(i) + 8), DOME_Z + 5];
const COIL_R = 6.8;
const COIL_REST = 5; // coiled height on Muladhara

// specimen column: plexuses and glands at the same heights
const COL = { x: 55, y: -5, w: 10, d: 10, r: 1.2 };
const COL_TOP = COLLAR_TOP + 4;
const levelZ = (i) => (i < 6 ? plateZ(i) + 1.2 : DOME_Z);
const TRAY_R = 7.6;
const TRAY_IN = 32, TRAY_OUT = 45.5; // tray centre x: slid in (anatomy) and parked (tradition)
const STRIP = { x: 56.5, y: 5, w: 7, d: 1.2, r: 0.4 };

const BEL = { x: -140, y: -15, w: 34, d: 30, r: 2.4 }; // bellows
const BEL_BASE = 5;
const PLEAT_H = 2.6;
const PLEATS = 4;
const STROKE = 4;

const LABEL = { x: -100, y: 22, w: 36, d: 18, r: 1.4 };
const DIAL = { x: 112, y: 12, r: 13, h: 7 }; // the level selector: a knob with a dial face
// angle 0 points to -y, clockwise from above; the gap in the scale faces away from the viewer
const DIAL_SPAN = (270 * Math.PI) / 180;
const DIAL_FROM = ((AZ + 315) * Math.PI) / 180;

const P = k.fitProjection(
  [...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [0, 0, FINIAL_Z + 3], [COL.x + COL.w, COL.y, COL_TOP + 3], [0, -DOME_R, DOME_Z], [0, DOME_R, DOME_Z]],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: AZ, elevation: 30 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const up = [0, 0, 1];

// ---- shared with the page: the wheels and the coil are rebuilt as they move ----
const SHARED_JS = `
function lobeRing(W, angle) {
  const per = W.n <= 2 ? 48 : Math.max(10, Math.round(168 / W.n));
  const total = W.n * per, out = [];
  for (let s = 0; s < total; s++) {
    const t = (s / total) * Math.PI * 2;
    let f = (((t - angle) * W.n) / (2 * Math.PI)) % 1;
    if (f < 0) f += 1;
    const r = W.r0 + W.a * Math.pow(Math.max(0, Math.sin(Math.PI * f)), W.e);
    out.push([r * Math.cos(t), r * Math.sin(t)]);
  }
  return out;
}
function polar(r, a) { return [r * Math.cos(a), r * Math.sin(a)]; }
function yantraOf(kind, angle, z) {
  const ring = (n, r, a0) => Array.from({ length: n }, (_, j) => polar(r, a0 + (j / n) * Math.PI * 2));
  if (kind === "square") return onTop(ring(4, 8.2, angle + Math.PI / 4), z, P, true);
  if (kind === "triangle") return onTop(ring(3, 8.6, angle + Math.PI / 2), z, P, true);
  if (kind === "yoni") return onTop(ring(3, 8.4, angle - Math.PI / 2), z, P, true);
  if (kind === "hexagram") return onTop(ring(3, 8.4, angle), z, P, true) + onTop(ring(3, 8.4, angle + Math.PI / 3), z, P, true);
  if (kind === "circle") return onTop(ring(48, 7.6, angle), z, P, true);
  if (kind === "crescent") {
    const pts = [];
    for (let j = 0; j <= 24; j++) { const t = -Math.PI / 2 + (j / 24) * Math.PI; pts.push([8 * Math.cos(t), 8 * Math.sin(t)]); }
    for (let j = 24; j >= 0; j--) { const t = -Math.PI / 2 + (j / 24) * Math.PI; pts.push([3.4 * Math.cos(t), 8 * Math.sin(t)]); }
    const c = Math.cos(angle), s = Math.sin(angle);
    return onTop(pts.map(([x, y]) => [x * c - y * s, x * s + y * c]), z, P, true);
  }
  return "";
}
function wheelSvg(W, angle, sel) {
  const plate = extrude(lobeRing(W, angle), W.z, ${PLATE_H}, P, { convex: false });
  const top = W.z + ${PLATE_H};
  const cap = cylinder(0, 0, ${CAP_R}, top, ${CAP_H}, P, 44, 0.4);
  return solidSvg(plate, { tone: "hi", crease: "mid", inner: lineSvg(onTop(Array.from({ length: 48 }, (_, j) => polar(W.r0 - 0.6, (j / 48) * Math.PI * 2)), top, P, true), { tone: "faint" }) })
    + solidSvg(cap, { tone: "mid" })
    + lineSvg(yantraOf(W.yantra, angle, top + ${CAP_H}), { tone: sel ? "hi" : "lo" });
}
function helixOf(r, z0, z1, turns) {
  const n = Math.max(8, Math.round(turns * 44));
  const [vx, vy] = towardViewer(P);
  const back = [], front = [];
  let run = [], near = null;
  for (let j = 0; j <= n; j++) {
    const a = (j / n) * turns * Math.PI * 2 + 0.6;
    const flat = iso([r * Math.cos(a), r * Math.sin(a), z0 + ((z1 - z0) * j) / n], P);
    const facing = Math.cos(a) * vx + Math.sin(a) * vy > 0;
    if (near === null) near = facing;
    if (facing !== near) { run.push(flat); (near ? front : back).push(pathOf(run)); run = [flat]; near = facing; continue; }
    run.push(flat);
  }
  if (run.length > 1) (near ? front : back).push(pathOf(run));
  const a1 = turns * Math.PI * 2 + 0.6;
  return { back: back.join(""), front: front.join(""), ends: [iso([r * Math.cos(0.6), r * Math.sin(0.6), z0], P), iso([r * Math.cos(a1), r * Math.sin(a1), z1], P)] };
}
`;
const shared = new Function("P", ...Object.keys(k), `${SHARED_JS}; return { wheelSvg, helixOf, lobeRing };`)(P, ...Object.values(k));

// ---- parts -------------------------------------------------------------
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BENCH, -BENCH_H - FOOT_H, BENCH_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BENCH, 22))) {
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

// the bellows: the practice that drives the rise (breath and bandha, in Hatha Yoga)
function bellows() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BEL, -2), 0, 1, P)}" style="opacity:.5"/>`);
  out.push(S(k.slabOf(BEL, 0, BEL_BASE, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(BEL, 2, P, 4), { tone: "faint" }) }));
  out.push(D(k.corners(BEL, 2.6).map(([x, y]) => at([x, y, BEL_BASE])), { size: 0.45 }));
  // the leather: pleats alternate in and out; each rides its share of the stroke
  for (let j = 0; j < PLEATS; j++) {
    const plan = k.insetPlan(BEL, j % 2 ? 3.2 : 1.2);
    out.push(`<g data-pleat="${j}">${S(k.slabOf(plan, BEL_BASE + j * PLEAT_H, PLEAT_H, P, 4), { tone: j % 2 ? "lo" : "mid", crease: "none" })}</g>`);
  }
  const topZ = BEL_BASE + PLEATS * PLEAT_H;
  const board = k.insetPlan(BEL, 0.4);
  const cx = BEL.x + BEL.w / 2, cy = BEL.y + BEL.d / 2;
  out.push(`<g data-pleat="top">${[
    S(k.slabOf(board, topZ, 2.6, P, 4, 0.5), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(board, 3.2), topZ + 2.6, P, 4), { tone: "faint" }),
    S(k.cylinder(cx, cy, 4.4, topZ + 2.6, 1.4, P, 28), { tone: "lo" }),
    S(k.cylinder(cx, cy, 3, topZ + 4, 4.2, P, 24), { tone: "mid" }),
    L(k.knurl(cx, cy, 3, topZ + 4, topZ + 8.2, 18, P), { tone: "lo" }),
    D(k.corners(board, 2.4).map(([x, y]) => at([x, y, topZ + 2.6])), { size: 0.42 }),
  ].join("")}</g>`);
  return out.join("");
}

// the air duct from the bellows into the plinth, on two saddles
function duct() {
  const out = [];
  const x0 = BEL.x + BEL.w, x1 = PL0.x - 4;
  for (const x of [x0 + 22, x1 - 22]) {
    out.push(S(k.slabOf({ x: x - 3, y: -5.4, w: 6, d: 10.8, r: 1 }, 0, 1.8, P, 2, 0.3), { tone: "lo" }));
    out.push(D([at([x, -3.9, 1.8]), at([x, 3.9, 1.8])], { size: 0.4 }));
  }
  const plan = { x: x0, y: -3.2, w: x1 - x0, d: 6.4, r: 1.2 };
  out.push(S(k.slabOf(plan, 1.8, 3.6, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, 3.6, P, 3), { tone: "faint" }) }));
  // a flange plate where it meets the plinth, and one where it leaves the bellows
  for (const [x, w] of [[x1, 4], [x0, 2.4]]) {
    const f = { x, y: -5.4, w, d: 10.8, r: 0.8 };
    out.push(S(k.slabOf(f, 0.6, 6.8, P, 2, 0.3), { tone: "mid" }));
    out.push(D([at([x + w / 2, -3.9, 7.4]), at([x + w / 2, 3.9, 7.4])], { size: 0.4 }));
  }
  return out.join("");
}

function dial() {
  const { x, y, r, h } = DIAL;
  const base = { x: x - r - 4, y: y - r - 4, w: 2 * r + 8, d: 2 * r + 8, r: 3 };
  const top = 2 + h;
  const out = [`<path class="iso-halo" d="${k.haloOf(base, 0, 1, P)}" style="opacity:.5"/>`];
  out.push(S(k.slabOf(base, 0, 2, P, 4, 0.5), { tone: "lo" }));
  out.push(L(k.corners(base, 2.6).map(([cx, cy]) => k.ring(cx, cy, 1.4, 2, P, 12)).join(""), { tone: "lo" }));
  out.push(D(k.corners(base, 2.6).map(([cx, cy]) => at([cx, cy, 2])), { size: 0.42 }));
  out.push(S(k.cylinder(x, y, r, 2, h, P, 64, 0.6), { tone: "mid", crease: "lo", inner: L(k.sideArc(x, y, r, top - 2.4, P, 40), { tone: "faint" }) }));
  out.push(L(k.knurl(x, y, r, top - 2.4, top, 70, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(x, y, r - 2, top, P, 64), { tone: "lo" }));
  const t = k.radialTicks(x, y, r - 2, 18, 3, top, [1.2, 2.6], P, DIAL_FROM, DIAL_SPAN);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(`<g data-needle>${needle(0)}</g>`);
  out.push(S(k.cylinder(x, y, 3.2, top, 2.6, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 3.2, top, top + 2.6, 16, P), { tone: "lo" }));
  out.push(D([at([x, y, top + 2.6])], { size: 0.5 }));
  return out.join("");
}
function needle(level) {
  const { x, y, r, h } = DIAL;
  const a = DIAL_FROM + (level / 6) * DIAL_SPAN;
  const sx = Math.sin(a), sy = -Math.cos(a);
  return L(k.lineOnTop([x + sx * 2.4, y + sy * 2.4], [x + sx * (r - 5), y + sy * (r - 5)], 2 + h + 0.1, P), { tone: "hi", free: "end" });
}

function plinth() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(PL0, -2), 0, 1, P)}" style="opacity:.6"/>`];
  out.push(S(k.slabOf(PL0, 0, PL0_H, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(PL0, 3, P, 6), { tone: "faint" }) }));
  const s0 = k.corners(PL0, 3.2);
  out.push(D(s0.map(([x, y]) => at([x, y, PL0_H])), { size: 0.45 }));
  out.push(S(k.slabOf(PL1, PL0_H, PL1_TOP - PL0_H, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(PL1, PL0_H + 5, P, 6), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PL1, 3.4), PL1_TOP, P, 6), { tone: "lo" }));
  out.push(D(k.corners(PL1, 6.8).map(([x, y]) => at([x, y, PL1_TOP])), { size: 0.45 }));
  out.push(S(k.cylinder(0, 0, 9, PL1_TOP, FLANGE_TOP - PL1_TOP, P, 48, 0.5), { tone: "mid" }));
  const bolts = Array.from({ length: 6 }, (_, j) => [7 * Math.cos((j / 6) * Math.PI * 2 + 0.3), 7 * Math.sin((j / 6) * Math.PI * 2 + 0.3), FLANGE_TOP]);
  out.push(D(bolts.map(at), { size: 0.4 }));
  return out.join("");
}

// one length of the glass channel, from z0 to z1
function glass(z0, z1) {
  // a glint down the side between the viewer and the light, rooted on the seam ring at the foot
  const g = (103 * Math.PI) / 180, gx = (TUBE_R - 0.5) * Math.cos(g), gy = (TUBE_R - 0.5) * Math.sin(g);
  const glint = L(k.segment([gx, gy, z0 + 0.6], [gx, gy, z1], P), { tone: "lo" });
  return S(k.cylinder(0, 0, TUBE_R, z0, z1 - z0, P, 36), { tone: "faint", crease: "none", inner: L(k.sideArc(0, 0, TUBE_R, z0 + 0.6, P, 24), { tone: "faint" }) + glint });
}

function hub(i) {
  return S(k.cylinder(0, 0, HUB_R, hubBottom(i), HUB_H, P, 36, 0.3), { tone: "mid", inner: L(k.sideArc(0, 0, HUB_R, hubBottom(i) + 1.2, P, 28), { tone: "faint" }) });
}

// the bead: bindu, a lit ball inside the glass. One copy per glass length, each clipped to its glass,
// so the bead disappears into each hub and comes out above it.
function beadSlot(seg, z0, z1) {
  const glassFill = k.cylinder(0, 0, TUBE_R, z0, z1 - z0, P, 36).fill;
  const ball = G.sphereOf([0, 0, BEAD_AT[0]], BEAD_R, P, { steps: 40 });
  const [cx, cy] = at([0, 0, BEAD_AT[0]]);
  const px = G.scaleOf(P);
  const trail = [3, 2, 1].map((j) => `<g data-trail="${j}"><circle class="ck-trail" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(BEAD_R * px * (1 - 0.17 * j)).toFixed(2)}" opacity="0"/></g>`).join("");
  return `<clipPath id="ck-glass-${seg}"><path d="${glassFill}"/></clipPath><g clip-path="url(#ck-glass-${seg})">${trail}<g data-bead="${seg}" data-tint style="--c:var(--ck-gold)">${S(ball, { tone: "hi", lit: true })}${D([at([0, 0, BEAD_AT[0] + 0.8])], { size: 1.1, tone: "hi" })}</g></g>`;
}

function crown() {
  const out = [];
  out.push(S(k.cylinder(0, 0, HUB_R, BOSS_Z, DOME_Z - BOSS_Z, P, 36, 0.3), { tone: "mid", inner: L(k.sideArc(0, 0, HUB_R, BOSS_Z + 1.4, P, 28), { tone: "faint" }) }));
  // the thousand-petalled canopy: a lip band, then a dome with fine ribs
  const F = G.frameOf([0, 0, DOME_Z], up, [1, 0, 0], [0, 1, 0]);
  const LIP = 1.6;
  const radius = (s) => {
    if (s <= LIP) return DOME_R;
    const t = Math.min(1, (s - LIP) / DOME_H);
    return DOME_R * Math.sqrt(Math.max(0, 1 - t * t));
  };
  const slope = (s) => {
    if (s <= LIP) return 0;
    const t = Math.min(0.999, (s - LIP) / DOME_H);
    return (-DOME_R * t) / (DOME_H * Math.sqrt(1 - t * t));
  };
  const knots = [[0, DOME_R], [LIP, DOME_R]];
  const TOP_T = 0.97;
  for (let j = 1; j <= 26; j++) {
    const t = (j / 26) * TOP_T;
    const s = LIP + t * DOME_H;
    knots.push([s, radius(s), 1]);
  }
  const lip = G.disc(0, LIP, DOME_R, F, P);
  const domeProfile = knots.slice(1);
  const dome = G.solidOf(domeProfile, F, P, { smooth: { slope } });
  out.push(S(lip, { tone: "mid", inner: "" }));
  // ribs: one meridian every 4 degrees, drawn where it faces the viewer and fading toward the turn
  const V = G.viewOf(P);
  const ribs = [];
  const sTop = LIP + TOP_T * DOME_H * 0.86;
  for (let j = 0; j < 90; j++) {
    const a = (j / 90) * Math.PI * 2;
    const pts = [];
    let alpha = 1;
    for (let q = 0; q <= 18; q++) {
      const s = LIP + 0.01 + (q / 18) * (sTop - LIP - 0.01);
      const r = radius(s);
      const n = G.unit3([Math.cos(a), Math.sin(a), -slope(s)]);
      const f = G.dot3(n, V);
      if (f < 0.05) { if (pts.length > 1) break; pts.length = 0; continue; }
      alpha = Math.min(alpha, G.fadeOf(f, [0.05, 0.35]));
      pts.push(at([r * Math.cos(a), r * Math.sin(a), DOME_Z + s]));
    }
    if (pts.length > 1) ribs.push({ d: k.pathOf(pts), alpha });
  }
  const ringTop = G.arcOf(F, sTop, radius(sTop), P, { slope: slope(sTop), least: -1 });
  const seam = G.arcOf(F, LIP + 0.01, DOME_R - 0.02, P, { slope: slope(LIP + 0.2) });
  out.push(S(dome, { tone: "hi", crease: "lo", inner: k.fadedSvg(ribs, { tone: "lo" }) + L(ringTop, { tone: "lo" }) + L(seam, { tone: "lo" }) }));
  // stem, collar and finial above the canopy
  out.push(S(k.cylinder(0, 0, 2.6, DOME_Z + DOME_H * 0.98, STEM_TOP - DOME_Z - DOME_H * 0.98, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(0, 0, 4.2, STEM_TOP, COLLAR_TOP - STEM_TOP, P, 28, 0.3), { tone: "mid" }));
  return out.join("");
}

function finial() {
  return `<g data-finial>${S(G.sphereOf([0, 0, FINIAL_Z], 3.2, P, { steps: 40 }), { tone: "hi" })}</g>`;
}

// ---- the specimen column ----
// small turned bodies stand for each gland; shapes are schematic, not to scale
const ovoid = (h, a, lean = 0) => {
  const out = [];
  for (let j = 0; j <= 14; j++) {
    const t = j / 14;
    const s = t * h;
    const r = a * Math.pow(Math.sin(Math.PI * t), 0.62) * (1 - lean * t);
    out.push([s, Math.max(0.12, r), j > 0 && j < 14 ? 1 : 0]);
  }
  return out;
};
const vertical = (x, y, z) => G.frameOf([x, y, z], up, [1, 0, 0], [0, 1, 0]);
function body(profile, x, y, z, style = { tone: "mid", crease: "lo" }) {
  return S(G.solidOf(profile, vertical(x, y, z), P), style);
}
function plexusNode(x, y, z, len = 3) {
  // a small ganglion with fibres running out over the tray, each ending on a terminal dot
  const out = [];
  const fibres = [0.4, 1.7, 2.9, 4.2, 5.3].map((a) => [x + len * Math.cos(a), y + len * Math.sin(a)]);
  out.push(L(fibres.map(([fx, fy]) => k.lineOnTop([x, y], [fx, fy], z, P)).join(""), { tone: "mid" }));
  out.push(D(fibres.map(([fx, fy]) => at([fx, fy, z])), { size: 0.6, tone: "hi" }));
  out.push(S(G.sphereOf([x, y, z + 1.9], 2.1, P, { steps: 28 }), { tone: "mid" }));
  return out.join("");
}
// gland bodies are schematic shapes, scaled by M; not to scale with each other or with the tower
const M = 1.3;
function specimen(i) {
  const x = TRAY_IN, z = levelZ(i);
  const out = [];
  out.push(S(k.cylinder(x, 0, TRAY_R, z - 2, 2, P, 44, 0.4), { tone: "mid" }));
  out.push(L(k.ring(x, 0, TRAY_R - 1.4, z, P, 44), { tone: "faint" }));
  const items = [];
  const ov = (h, a, lean) => ovoid(h * M, a * M, lean);
  if (i === 0) items.push([x, 0, plexusNode(x, 0, z, 5.2)]);
  if (i === 1) { // gonads
    items.push([x + 1, -2.8 * M, body(ov(5.2, 2.1), x + 1, -2.8 * M, z)], [x + 1, 2.8 * M, body(ov(5.2, 2.1), x + 1, 2.8 * M, z)]);
    items.push([x - 3.6, 0, plexusNode(x - 3.6, 0, z)]);
  }
  if (i === 2) { // adrenal and pancreas: one tapered body lying along the tray
    const F = G.frameAlong([x - 4.6 * M, 1.2, z + 2.1 * M], [1, 0, 0]);
    items.push([x, 1.2, S(G.solidOf(ov(9.2, 2.1, 0.45), F, P), { tone: "mid", crease: "lo" })]);
    items.push([x - 2.4, -4, plexusNode(x - 2.4, -4, z)]);
  }
  if (i === 3) { // thymus: two tall lobes
    items.push([x + 1.6, -2.4 * M, body(ov(7.4, 1.9, 0.25), x + 1.6, -2.4 * M, z)], [x + 1.6, 2.4 * M, body(ov(6.4, 1.8, 0.25), x + 1.6, 2.4 * M, z)]);
    items.push([x - 3.4, 0, plexusNode(x - 3.4, 0, z)]);
  }
  if (i === 4) { // thyroid: two lobes and an isthmus
    const F = G.frameAlong([x + 1.6, -3 * M, z + 1.6 * M], [0, 1, 0]);
    items.push([x + 1.6, 0, S(G.disc(0, 6 * M, 1.1 * M, F, P), { tone: "mid", crease: "none" })]);
    items.push([x + 1.6, -3.3 * M, body(ov(6, 2), x + 1.6, -3.3 * M, z)], [x + 1.6, 3.3 * M, body(ov(6, 2), x + 1.6, 3.3 * M, z)]);
    items.push([x - 3.6, 0, plexusNode(x - 3.6, 0, z)]);
  }
  if (i === 5) { // pituitary on its stalk
    items.push([x, 0, [
      S(k.cylinder(x, 0, 4.4, z, 1.2, P, 28), { tone: "lo" }),
      S(k.cylinder(x, 0, 0.9, z + 1.2, 5.8, P, 14), { tone: "mid", crease: "none" }),
      S(G.sphereOf([x, 0, z + 9.2], 3.2, P, { steps: 32 }), { tone: "mid" }),
    ].join("")]);
  }
  if (i === 6) { // pineal: a small pine-cone body
    const pts = [];
    for (let j = 0; j <= 16; j++) {
      const t = j / 16;
      pts.push([t * 10, Math.max(0.12, 3.8 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.7) * (1 - 0.42 * t)), j > 0 && j < 16 ? 1 : 0]);
    }
    items.push([x, 0, `<g data-pineal>${S(k.cylinder(x, 0, 4.6, z, 1, P, 28), { tone: "lo" })}${body(pts, x, 0, z + 1, { tone: "hi", crease: "lo" })}</g>`]);
  }
  for (const [, , svg] of items.sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) out.push(svg);
  return out.join("");
}

function column() {
  const out = [];
  // brackets and arms come first: they meet the column's far face
  for (let i = 0; i < 7; i++) {
    const z = levelZ(i);
    out.push(S(k.slabOf({ x: COL.x - 5, y: -3.4, w: 5, d: 6.8, r: 0.8 }, z - 9, 5, P, 2, 0.3), { tone: "lo" }));
    out.push(S(k.slabOf({ x: 28, y: -2, w: COL.x - 28, d: 4, r: 0.8 }, z - 4, 2, P, 2, 0.3), { tone: "mid", inner: "" }));
    out.push(L(k.lineOnTop([28, 0], [COL.x, 0], z - 2, P), { tone: "faint" }));
    out.push(`<g data-spec="${i}"><g data-tray="${i}">${specimen(i)}</g></g>`);
  }
  // the stay that holds the crown
  out.push(S(k.slabOf({ x: 3.6, y: -2, w: COL.x - 3.6, d: 4, r: 0.8 }, STEM_TOP, 3.4, P, 2, 0.4), { tone: "mid" }));
  // the column
  const foot = { x: COL.x - 5, y: COL.y - 5, w: COL.w + 10, d: COL.d + 10, r: 2 };
  out.push(`<path class="iso-halo" d="${k.haloOf(foot, 0, 1, P)}" style="opacity:.5"/>`);
  out.push(S(k.slabOf(foot, 0, 3, P, 4, 0.5), { tone: "lo" }));
  out.push(D(k.corners(foot, 2.4).map(([x, y]) => at([x, y, 3])), { size: 0.42 }));
  out.push(S(k.slabOf(COL, 3, COL_TOP - 3, P, 3), {
    tone: "mid",
    inner: L([40, 120].map((z) => k.sideSeam(COL, z, P, 3)).join(""), { tone: "faint" }),
  }));
  out.push(S(k.slabOf(k.insetPlan(COL, -1), COL_TOP, 2.4, P, 3, 0.4), { tone: "mid" }));
  out.push(D(k.corners(k.insetPlan(COL, -1), 2).map(([x, y]) => at([x, y, COL_TOP + 2.4])), { size: 0.4 }));
  // the level scale on the front face
  out.push(S(k.slabOf(STRIP, 8, COL_TOP - 14, P, 2), { tone: "lo", crease: "none" }));
  const minor = [], major = [];
  const face = STRIP.y + STRIP.d;
  for (let i = 0; i < 7; i++) {
    const z = levelZ(i);
    major.push(k.segment([STRIP.x, face, z], [STRIP.x + 3.6, face, z], P));
    if (i < 6) for (const dz of [STEP / 3, (2 * STEP) / 3]) minor.push(k.segment([STRIP.x, face, z + dz], [STRIP.x + 2, face, z + dz], P));
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  // the level slider
  const slider = { x: STRIP.x - 0.6, y: face, w: STRIP.w + 1.2, d: 2.2, r: 0.6 };
  out.push(`<g data-slider>${[
    S(k.slabOf(slider, levelZ(0) - 2.2, 4.4, P, 2, 0.3), { tone: "hi", inner: L(k.sideSeam(slider, levelZ(0), P, 2), { tone: "hi" }) }),
  ].join("")}</g>`);
  return out.join("");
}

function labelPlate() {
  const plan = LABEL;
  return [
    S(k.slabOf(plan, 0, 0.8, P, 4), { tone: "lo", crease: "none" }),
    L(k.planOutline(k.insetPlan(plan, 1.6), 0.8, P, 4), { tone: "faint" }),
    k.faceTextSvg(k.topMatrix([plan.x + 4, plan.y + 7.5], 0.8, P, "x"), "ஆறு ஆதாரம்", { size: 3.6, tone: "mid" }),
    L(k.lineOnTop([plan.x + 4, plan.y + 11.5], [plan.x + 24, plan.y + 11.5], 0.8, P), { tone: "lo", free: true }),
    L(k.lineOnTop([plan.x + 4, plan.y + 14.5], [plan.x + 16, plan.y + 14.5], 0.8, P), { tone: "lo", free: true }),
    D([at([plan.x + 2.4, plan.y + 2.4, 0.8]), at([plan.x + plan.w - 2.4, plan.y + plan.d - 2.4, 0.8])], { size: 0.42 }),
  ].join("");
}

// ---- assemble, back to front -------------------------------------------
const body0 = [bench(), bellows(), duct(), plinth(), glass(FLANGE_TOP, hubBottom(0))];
for (let i = 0; i < 6; i++) {
  body0.push(hub(i));
  body0.push(`<g data-wheel="${i}" data-tint style="--c:var(--ck-c${i})">${shared.wheelSvg(WHEELS[i], 0, false)}</g>`);
  const z0 = capTop(i), z1 = i < 5 ? hubBottom(i + 1) : BOSS_Z;
  const c = i === 0 ? shared.helixOf(COIL_R, capTop(0), capTop(0) + COIL_REST, 3.5) : null;
  if (c) body0.push(`<g data-coil="back">${L(c.back, { tone: "hi" })}</g>`);
  body0.push(glass(z0, z1));
  body0.push(beadSlot(i + 1, z0, z1));
  if (c) body0.push(`<g data-coil="front">${L(c.front, { tone: "hi" })}${D(c.ends, { size: 0.7, tone: "hi" })}</g>`);
}
body0.push(`<g data-canopy data-tint style="--c:var(--ck-c6)">${crown()}${finial()}</g>`);
body0.push(column());
body0.push(dial());
body0.push(labelPlate());

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A tower on a bench: a glass channel rises from a plinth through six toothed wheels to a ribbed canopy at the top. The wheels have 4, 6, 10, 12, 16 and 2 teeth, the petal counts of the six lower chakras, and the canopy stands for the thousand-petalled crown. A coil spring sits on the lowest wheel with a lit bead on it; a bellows beside the plinth drives the bead up the glass, and each wheel spins as the bead passes. Beside the tower a column carries seven specimen trays at the same heights. In the anatomy lens the wheels stop and dim, the bead stays down, and the trays slide in, holding nerve plexuses and glands, with the pineal lit at the top.",
  body: body0,
});

// ---- live --------------------------------------------------------------
const live = `
${LENS_JS}
const P = ${JSON.stringify(P)};
${SHARED_JS}
const CH = ${JSON.stringify(CHAKRAS)};
const WHEELS = ${JSON.stringify(WHEELS)};
const BEAD_AT = ${JSON.stringify(BEAD_AT)};
const PLATE_Z = ${JSON.stringify(WHEELS.map((w) => w.z))};
const LEVEL_Z = ${JSON.stringify(CHAKRAS.map((_, i) => levelZ(i)))};
const LEVEL_Y = LEVEL_Z.map((z, i) => iso([0, 0, i < 6 ? z : z + 8], P)[1]);
const COIL = { r: ${COIL_R}, z0: ${capTop(0)}, rest: ${COIL_REST}, max: ${hubBottom(1) - capTop(0) - 0.8} };
const BEAD_R = ${BEAD_R}, TRAY_SLIDE = ${TRAY_OUT - TRAY_IN}, STROKE = ${STROKE}, PLEATS = ${PLEATS};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (s) => svg.querySelector(s);
const qa = (s) => [...svg.querySelectorAll(s)];
const readout = document.querySelector("[data-readout]");
const wheels = WHEELS.map((_, i) => q('[data-wheel="' + i + '"]'));
const beads = qa("[data-bead]");
const coilBack = q('[data-coil="back"]'), coilFront = q('[data-coil="front"]');
const trays = CH.map((_, i) => q('[data-tray="' + i + '"]'));
const specs = CH.map((_, i) => q('[data-spec="' + i + '"]'));
const slider = q("[data-slider]");
const needleEl = q("[data-needle]");
const DIAL = ${JSON.stringify({ ...DIAL, from: DIAL_FROM, span: DIAL_SPAN })};
const finialSolid = q("[data-finial] .iso-solid");
const canopy = q("[data-canopy]");
const pinealSolids = qa("[data-pineal] .iso-solid");
const pleats = [...qa("[data-pleat]")];
const trails = [1, 2, 3].map((j) => qa('[data-trail="' + j + '"]'));
const pinealGroup = q("[data-pineal]");
const LIGHT = document.body.dataset.theme === "light";
const css = getComputedStyle(stage);
const rgbOf = (name) => { const h = css.getPropertyValue(name).trim().replace("#", ""); return [0, 2, 4].map((o) => parseInt(h.slice(o, o + 2), 16)).join(","); };
const HUES = WHEELS.map((_, i) => rgbOf("--ck-c" + i)), VIOLET = rgbOf("--ck-c6"), GOLD = rgbOf("--ck-gold");
// how a tinted part shows a glow of strength g (0..1) at chroma c (0 in anatomy):
// dark plates take a wide soft halo; on paper the halo stays tight and the colour lives in the body
function paint(el, rgb, g, c) {
  if (!el) return;
  const p = (LIGHT ? 22 + 48 * g : 18 + 42 * g) * c, qv = (45 + 50 * g) * c;
  const blur = LIGHT ? 0.7 + 1.5 * g : 1.5 + 5.5 * g, alpha = (LIGHT ? 0.12 + 0.42 * g : 0.18 + 0.62 * g) * c;
  const key = p.toFixed(1) + "|" + qv.toFixed(1) + "|" + alpha.toFixed(3) + "|" + blur.toFixed(2);
  if (el._g === key) return;
  el._g = key;
  el.style.setProperty("--p", p.toFixed(1) + "%");
  el.style.setProperty("--q", qv.toFixed(1) + "%");
  el.style.filter = alpha > 0.01 ? "drop-shadow(0 0 " + blur.toFixed(2) + "px rgba(" + rgb + "," + alpha.toFixed(3) + "))" : "none";
}
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const ease = (x, to, dt, tau, calm) => (calm ? to : x + (to - x) * (1 - Math.exp(-dt / tau)));
const markDim = (el, on) => { if (!el) return; if (on) el.setAttribute("data-dim", ""); else el.removeAttribute("data-dim"); };
const markLit = (el, on) => { if (!el) return; if (on) el.setAttribute("data-lit", ""); else el.removeAttribute("data-lit"); };

let lens = "tradition", level = 0, target = 0, sel = 0, frame = 0, last = 0, clock = 0, idle = 0;
let dialAt = 0, touring = true, visible = false, slide = 0, pump = 0, pumpAt = 0, beadFade = 1, sliderZ = LEVEL_Z[0];
let chroma = 1, crownGlow = 0.15, pinealGlow = 0;
const glow = WHEELS.map(() => 0.22), trailZ = [0, 0, 0];
const spin = WHEELS.map(() => 0), angle = WHEELS.map((_, i) => i * 0.37), drawn = WHEELS.map(() => ({ a: null, sel: null }));

const zOf = (c) => { const i = clamp(Math.floor(c), 0, 5); const f = clamp(c - i, 0, 1); return BEAD_AT[i] + (BEAD_AT[i + 1] - BEAD_AT[i]) * f; };
// the climb: a slow staircase that rests at each wheel, a stay at the crown, and an eased descent
const RISE = 2.1, HOLD = 3.2, FALL = 4.2, REST = 1.6, CYCLE = 6 * RISE + HOLD + FALL + REST;
function tourAt(t) {
  t = t % CYCLE;
  if (t < 6 * RISE) { const u = t / RISE; return Math.floor(u) + smooth((u % 1) * 1.25); }
  t -= 6 * RISE;
  if (t < HOLD) return 6;
  t -= HOLD;
  if (t < FALL) return 6 * (1 - smooth(t / FALL));
  return 0;
}
const ANAT_DWELL = 2.8;

function say() {
  const c = CH[sel];
  let text;
  if (lens === "tradition") {
    const top = c.ta + " " + c.sa + " · " + c.at;
    let low = sel === 6 ? "a thousand petals · " + c.el : c.n + " petals · " + c.el + " · " + c.bija;
    if (sel === 6 && level > 5.9) low = "bindu at the crown, refined into ojas";
    text = top + "\\n" + low;
  } else {
    text = c.an[0] + "\\n" + c.an[1];
  }
  if (readout.textContent !== text) readout.textContent = text;
}
function describe() {
  const c = CH[sel];
  const v = lens === "tradition"
    ? c.sa + ", " + c.at + (sel < 6 ? ", " + c.n + " petals, " + c.el + ", bija " + c.bija : ", a thousand petals")
    : c.an[0] + ". " + c.an[1];
  stage.setAttribute("aria-valuenow", String(sel));
  stage.setAttribute("aria-valuetext", v);
}

function draw() {
  const z = zOf(level);
  beads.forEach((b) => b.setAttribute("transform", translateAlong(P, [0, 0, z - BEAD_AT[0]])));
  beads.forEach((b) => { b.setAttribute("opacity", beadFade.toFixed(3)); markLit(b.firstElementChild, lens === "tradition"); markDim(b, lens !== "tradition"); });
  // kundalini's coil stretches with the bead until the bead leaves the first length of glass
  const top = clamp(z - BEAD_R - COIL.z0, COIL.rest, COIL.max);
  const h = helixOf(COIL.r, COIL.z0, COIL.z0 + top, 3.5);
  const back = '<path class="iso-line" data-tone="hi" d="' + h.back + '"/>';
  const front = '<path class="iso-line" data-tone="hi" d="' + h.front + '"/>' + dotsSvg(h.ends, { size: 0.7, tone: "hi" });
  if (coilBack._h !== back) { coilBack.innerHTML = back; coilBack._h = back; }
  if (coilFront._h !== front) { coilFront.innerHTML = front; coilFront._h = front; }
  markDim(coilBack, lens !== "tradition"); markDim(coilFront, lens !== "tradition");
  WHEELS.forEach((W, i) => {
    const s = lens === "tradition" && sel === i;
    const a = Math.round(angle[i] * 400) / 400;
    if (drawn[i].a !== a || drawn[i].sel !== s) { wheels[i].innerHTML = wheelSvg(W, a, s); drawn[i].a = a; drawn[i].sel = s; }
    markDim(wheels[i], lens !== "tradition");
  });
  WHEELS.forEach((_, i) => paint(wheels[i], HUES[i], glow[i], chroma));
  paint(canopy, VIOLET, crownGlow, chroma);
  beads.forEach((b) => paint(b, GOLD, 1, chroma));
  trails.forEach((list, j) => {
    const tz = trailZ[j];
    const o = clamp((z - tz) / 5, 0, 1) * (0.5 - 0.12 * j) * chroma * beadFade;
    const tr = translateAlong(P, [0, 0, tz - BEAD_AT[0]]);
    list.forEach((t) => { t.setAttribute("transform", tr); t.firstElementChild.setAttribute("opacity", o.toFixed(3)); });
  });
  if (pinealGroup) pinealGroup.style.filter = !LIGHT && pinealGlow > 0.01 ? "drop-shadow(0 0 " + (3 * pinealGlow).toFixed(2) + "px rgba(255,255,255," + (0.45 * pinealGlow).toFixed(3) + "))" : "none";
  markLit(finialSolid, lens === "tradition" && level > 5.85);
  markDim(canopy, lens !== "tradition");
  pinealSolids.forEach((el) => markLit(el, lens === "anatomy"));
  trays.forEach((t) => t.setAttribute("transform", translateAlong(P, [TRAY_SLIDE * (1 - slide), 0, 0])));
  specs.forEach((s, i) => markDim(s, lens === "tradition"));
  slider.setAttribute("transform", translateAlong(P, [0, 0, sliderZ - LEVEL_Z[0]]));
  const na = DIAL.from + (dialAt / 6) * DIAL.span, nx = Math.sin(na), ny = -Math.cos(na);
  const nd = lineOnTop([DIAL.x + nx * 2.4, DIAL.y + ny * 2.4], [DIAL.x + nx * (DIAL.r - 5), DIAL.y + ny * (DIAL.r - 5)], 2 + DIAL.h + 0.1, P);
  if (needleEl._d !== nd) { needleEl.innerHTML = lineSvg(nd, { tone: "hi", free: "end" }); needleEl._d = nd; }
  const press = STROKE * (0.5 - 0.5 * Math.cos(pump));
  pleats.forEach((p) => { const j = p.dataset.pleat === "top" ? PLEATS : Number(p.dataset.pleat); p.setAttribute("transform", translateAlong(P, [0, 0, -press * (j / PLEATS)])); });
  say();
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) clock += dt;
  if (lens === "tradition") {
    if (touring) target = calm ? 0 : tourAt(clock);
    const was = level;
    level = calm ? target : ease(level, target, dt, 0.32, false);
    if (Math.abs(target - level) < 0.001) level = target;
    if (!calm && level > was + 1e-4) pump += dt * 5.2; // the bellows works while the bead climbs
    else if (!calm) pump = ease(pump, Math.round(pump / (2 * Math.PI)) * 2 * Math.PI, dt, 0.4, false);
    const s = touring ? clamp(Math.floor(level + 0.25), 0, 6) : sel;
    if (s !== sel) { sel = s; describe(); }
  } else {
    target = 0;
    level = ease(level, 0, dt, 0.5, calm);
    if (level < 0.001) level = 0;
    pump = ease(pump, Math.round(pump / (2 * Math.PI)) * 2 * Math.PI, dt, 0.4, calm);
    if (touring && !calm) { const s = Math.floor(clock / ANAT_DWELL) % 7; if (s !== sel) { sel = s; describe(); } }
  }
  const z = zOf(level);
  let moving = Math.abs(target - level) > 0;
  WHEELS.forEach((W, i) => {
    const pierced = lens === "tradition" && (i === 0 ? level > 0.04 : z >= W.z + 1);
    const want = pierced && !calm ? 0.55 + 0.06 * i : 0;
    spin[i] = ease(spin[i], want, dt, 0.9, calm);
    if (Math.abs(spin[i] - want) < 0.002) spin[i] = want;
    angle[i] += spin[i] * dt;
    if (spin[i] > 0) moving = true;
  });
  const trad = lens === "tradition";
  const cw = trad ? 1 : 0;
  chroma = ease(chroma, cw, dt, 0.6, calm); if (Math.abs(chroma - cw) < 0.002) chroma = cw; else moving = true;
  WHEELS.forEach((W, i) => {
    const near = smooth(1 - Math.abs(z - W.z - 3) / 16);
    const gw = Math.max(sel === i ? 1 : 0.22, near);
    glow[i] = ease(glow[i], gw, dt, 0.35, calm); if (Math.abs(glow[i] - gw) < 0.002) glow[i] = gw; else moving = true;
  });
  const bw = level > 5.85 ? 1 : sel === 6 ? 0.6 : 0.15;
  crownGlow = ease(crownGlow, bw, dt, 0.5, calm); if (Math.abs(crownGlow - bw) < 0.002) crownGlow = bw; else moving = true;
  const pw = trad ? 0 : 1;
  pinealGlow = ease(pinealGlow, pw, dt, 0.6, calm); if (Math.abs(pinealGlow - pw) < 0.002) pinealGlow = pw; else moving = true;
  trailZ.forEach((tz, j) => { trailZ[j] = calm ? z : ease(tz, z, dt, 0.11 * (j + 1), false); if (Math.abs(trailZ[j] - z) < 0.01) trailZ[j] = z; else moving = true; });
  const sw = lens === "anatomy" ? 1 : 0;
  slide = ease(slide, sw, dt, 0.45, calm); if (Math.abs(slide - sw) < 0.002) slide = sw; else moving = true;
  const fw = lens === "anatomy" ? 0.28 : 1;
  beadFade = ease(beadFade, fw, dt, 0.5, calm); if (Math.abs(beadFade - fw) < 0.002) beadFade = fw; else moving = true;
  dialAt = ease(dialAt, sel, dt, 0.25, calm); if (Math.abs(dialAt - sel) < 0.002) dialAt = sel; else moving = true;
  sliderZ = ease(sliderZ, LEVEL_Z[sel], dt, 0.25, calm); if (Math.abs(sliderZ - LEVEL_Z[sel]) < 0.01) sliderZ = LEVEL_Z[sel]; else moving = true;
  if (Math.abs(pump % (2 * Math.PI)) > 0.002 && Math.abs((pump % (2 * Math.PI)) - 2 * Math.PI) > 0.002) moving = true;
  draw();
  frame = visible && (touring || moving) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const resume = () => {
  touring = !still.matches;
  // pick the tour up from where the bead is, so nothing jumps
  if (lens === "tradition") clock = level >= 6 ? 6 * RISE : (level / 1) * RISE;
  else clock = sel * ANAT_DWELL;
  run();
};
const steer = (to) => {
  touring = false;
  sel = clamp(to, 0, 6);
  if (lens === "tradition") target = sel;
  describe();
  clearTimeout(idle);
  idle = setTimeout(resume, 4200);
  run();
};
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (e) => {
  const box = svg.getBoundingClientRect();
  const y = ((e.clientY - box.top) / box.height) * ${HEIGHT};
  let best = 0;
  LEVEL_Y.forEach((ly, i) => { if (Math.abs(ly - y) < Math.abs(LEVEL_Y[best] - y)) best = i; });
  if (best !== sel || touring) steer(best);
});
stage.addEventListener("keydown", (e) => {
  let to = null;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") to = sel + 1;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = sel - 1;
  if (e.key === "Home") to = 0;
  if (e.key === "End") to = 6;
  if (to === null) return;
  e.preventDefault();
  steer(to);
});
wireLens((id) => {
  lens = id;
  clock = 0;
  if (id === "anatomy") { sel = touring ? 0 : sel; } else if (touring) { level = Math.min(level, 0); }
  describe();
  run();
});
describe();
draw();
`;

const css = `<style>
.ck{--ck-c0:#ff5d52;--ck-c1:#ff9a3d;--ck-c2:#ffd84a;--ck-c3:#52d987;--ck-c4:#4fa9ff;--ck-c5:#8c86ff;--ck-c6:#e2c8ff;--ck-gold:#ffc94a}
body[data-theme="light"] .ck{--ck-c0:#d3221a;--ck-c1:#e0650a;--ck-c2:#d19a00;--ck-c3:#17994a;--ck-c4:#1d6fd8;--ck-c5:#4a3cc8;--ck-c6:#8e46d8;--ck-gold:#c98600}
.ck [data-tint] .iso-top{fill:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-top))}
.ck [data-tint] [data-seamless]>.iso-top{stroke:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-top))}
.ck [data-tint] .iso-shade[data-shade="0"],.ck [data-tint] [data-seamless]>.iso-shade[data-shade="0"]{fill:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-shade-0))}
.ck [data-tint] [data-seamless]>.iso-shade[data-shade="0"]{stroke:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-shade-0))}
.ck [data-tint] .iso-shade[data-shade="1"],.ck [data-tint] [data-seamless]>.iso-shade[data-shade="1"]{fill:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-shade-1))}
.ck [data-tint] [data-seamless]>.iso-shade[data-shade="1"]{stroke:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-shade-1))}
.ck [data-tint] .iso-shade[data-shade="2"],.ck [data-tint] [data-seamless]>.iso-shade[data-shade="2"]{fill:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-shade-2))}
.ck [data-tint] [data-seamless]>.iso-shade[data-shade="2"]{stroke:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-shade-2))}
.ck [data-tint] .iso-shade[data-shade="3"],.ck [data-tint] [data-seamless]>.iso-shade[data-shade="3"]{fill:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-shade-3))}
.ck [data-tint] [data-seamless]>.iso-shade[data-shade="3"]{stroke:color-mix(in srgb,var(--c) var(--p,0%),var(--anatomy-shade-3))}
.ck [data-tint] .iso-edge[data-tone="hi"]{stroke:color-mix(in srgb,var(--c) var(--q,0%),var(--anatomy-hi))}
.ck [data-tint] .iso-edge[data-tone="mid"]{stroke:color-mix(in srgb,var(--c) var(--q,0%),var(--anatomy-mid))}
.ck .ck-trail{fill:var(--ck-gold)}
.ck .iso-line{transition:stroke .7s ease}
.ck [data-dim] .iso-line[data-tone]{stroke:var(--anatomy-faint)}
.ck [data-dim] .iso-edge[data-tone]{stroke:var(--anatomy-lo)}
.ck [data-dim] .iso-dots circle{opacity:.12}
.iso-plate-corner[data-corner="readout"]{white-space:pre;text-align:right;line-height:1.55}
@media (max-width:560px){.iso-plate{padding-bottom:88px}.iso-plate-corner[data-corner="hint"]{bottom:36px}}
</style>`;

const plate = k.plateHtml({
  fig: "Fig 3",
  title: "Chakra · the seven wheels",
  hint: "Hover up and down · T / A to switch lens",
  readout: `${CHAKRAS[0].ta} ${CHAKRAS[0].sa} · ${CHAKRAS[0].at}\n${CHAKRAS[0].n} petals · ${CHAKRAS[0].el} · ${CHAKRAS[0].bija}`,
  keys: [
    { mark: "lit", label: "Gold bindu rising and the glowing wheels (tradition) · the pineal (anatomy)" },
    { mark: "raised", label: "Six wheels, teeth = petals; a ribbed crown" },
    { mark: "dim", label: "Specimen trays: plexuses and glands at the same heights" },
  ],
  caption:
    "A glass channel, sushumna, rises through six toothed wheels: 4, 6, 10, 12, 16 and 2 teeth, the petal counts of the six lower chakras, with the figure from each lotus's centre engraved on its hub; a fine-ribbed canopy stands for the thousand-petalled crown. Kundalini is the coil of three and a half turns on the lowest wheel, and the bellows is the practice that drives the rise. The colours follow the popular modern rainbow scheme. Hover up and down to read each wheel. Switch to Anatomy to see what actually sits at those heights, and the colours drain away, since nothing in the body corresponds to them; the specimens are schematic and not to scale.",
  body: `${css}<div class="iso-stage ck" tabindex="0" role="slider" aria-label="Chakra tower: arrow keys step from wheel to wheel" aria-valuemin="0" aria-valuemax="6" aria-valuenow="0">${svg}</div>`,
});

const html = page({
  title: "Chakra",
  theme,
  tamil: "ஆறு ஆதாரங்கள் · Chakras",
  lenses: [{ id: "tradition", label: "Tradition" }, { id: "anatomy", label: "Anatomy" }],
  notes: {
    tradition:
      "<b>What the tradition says.</b> In the classical Tantric and Hatha model, set out in the <i>Ṣaṭ-cakra-nirūpaṇa</i> (translated in Arthur Avalon's <i>The Serpent Power</i>), six lotuses sit along <b>sushumna</b>, the central channel: the Tamil Siddhas' six ādhārams, from moolaadhaaram at the base of the spine to aakkinai between the brows, with the thousand-petalled sahasrara above the head. Each has its petals, element and seed sound (bija). <b>Kundalini</b> sleeps at the base, coiled three and a half times; awakened, she rises up sushumna and pierces each lotus in turn. The teaching on brahmacharya (urdhva-retas, the seed turned upward) adds that retained shukra, or <b>bindu</b>, is refined into ojas and carried up the channel to the crown, bringing radiance and inner vision; the Hatha Yoga Pradipika says that losing bindu is death and keeping it is life. The rainbow colours on the wheels are a modern scheme, popular since the 20th century; the classical Ṣaṭ-cakra-nirūpaṇa gives the lotuses different colours. This is the tradition's model, drawn as the tradition draws it: the wheels are its picture, not organs.",
    anatomy:
      "<b>What anatomy shows.</b> No wheel-like organs sit along the spine. Modern writers often line the chakras up with nerve plexuses (sacral, pelvic, celiac or 'solar', cardiac, pharyngeal) and with endocrine glands (gonads, adrenals and pancreas, thymus, thyroid, pituitary, pineal). That is a common modern mapping, not an equivalence, and writers disagree on several of the pairs. Sperm that are not ejaculated are broken down and reabsorbed in the male reproductive tract; nothing travels up the spine to the brain, which is why the bead stays down. The <b>pineal gland</b> is real: about 5–8 mm long, deep in the brain, it makes melatonin, mostly at night. And the 'third eye' has a true echo in evolution: in lampreys, the tuatara and many lizards, a related parietal eye on top of the head really does sense light.",
  },
  sources:
    "Tradition: Ṣaṭ-cakra-nirūpaṇa, in Arthur Avalon, The Serpent Power (1919), for petals, elements, bija, the figures in each pericarp and kundalini's three and a half coils; Hatha Yoga Pradipika, ch. 3, on bindu; Tamil Siddha names of the six ādhārams. Anatomy: standard anatomy of the autonomic plexuses; endocrinology of the pineal gland and melatonin; reabsorption of unejaculated sperm in the male tract; comparative anatomy of the parietal eye (lampreys, tuatara, lizards). Sizes are approximate.",
  plate,
  script: kitScript() + live,
});

const out = theme === "light" ? "chakra-light.html" : "chakra.html";
writeFileSync(join(HERE, out), html);
console.log("wrote", out);
