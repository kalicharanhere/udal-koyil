// Fig 5 — Isai Thoon: the musical pillars of Nellaiappar, Tirunelveli.
// Legend lens: a cluster of stone colonettes, carved from one block, that sing when tapped.
// Physics lens: each colonette is a stone beam clamped at both ends; its lowest bending
// mode sets the note, f ≈ 3.56 · (d/4) / L² · √(E/ρ). A height gauge on the striker
// carriage shows the free length L and the diameter d of the colonette it taps.
import { readFileSync, writeFileSync } from "node:fs";
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
// Idealised granite: E about 50 GPa (granites range roughly 10-70), rho about 2,700 kg/m^3.
const E = 50e9;
const RHO = 2700;
const C = Math.sqrt(E / RHO); // ≈ 4,300 m/s
const BETA1 = 4.730041; // first clamped-clamped root of cos·cosh = 1
const BETA2 = 7.853205; // second root
const COEF = (BETA1 * BETA1) / (2 * Math.PI); // ≈ 3.56
const freqOf = (d, L) => (COEF * (d / 4) / (L * L)) * C; // d, L in metres -> Hz
const SA = 196; // Sa chosen at G3 for this model
// Shankarabharanam steps from Sa, across ten colonettes: S R G M P D N S' R' G'
const STEPS = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
const SWARA = [
  { en: "Sa", ta: "ச" }, null, { en: "Ri", ta: "ரி" }, null, { en: "Ga", ta: "க" }, { en: "Ma", ta: "ம" }, null,
  { en: "Pa", ta: "ப" }, null, { en: "Dha", ta: "த" }, null, { en: "Ni", ta: "நி" },
];
const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const noteOf = (f) => {
  const n = 12 * Math.log2(f / 440) + 69;
  const r = Math.round(n);
  return { name: NAMES[r % 12] + (Math.floor(r / 12) - 1), cents: Math.round((n - r) * 100) };
};
// Free length falls ~2 cm a colonette; the diameter is then sized (to the millimetre) so the
// model lands near its swara, the way a sculptor would size and tune by ear.
const COLS = STEPS.map((s, i) => {
  const want = SA * 2 ** (s / 12);
  const L = Math.round((1.16 - i * 0.022) * 100) / 100;
  const d = Math.round(((want * L * L) / (COEF / 4) / C) * 1000) / 1000;
  const f = freqOf(d, L);
  const sw = SWARA[s % 12];
  return { i, d, L, f, f2: f * (BETA2 / BETA1) ** 2, note: noteOf(f), sw: sw.en, ta: sw.ta, upper: s >= 12 };
});

// ---- world (units: 1 = 1 cm) ---------------------------------------------
const BENCH = { x: -222, y: -46, w: 412, d: 122, r: 8 };
const BENCH_H = 12;
const FOOT_H = 5;
const BASE_Z = 12; // top of the shared base block
const YC = 6; // colonette row
const GAP = 15;
const colX = (i) => -67.5 + GAP * i;
const radOf = (c) => (c.d * 100) / 2;
const LMAX = Math.max(...COLS.map((c) => c.L * 100));
const FOOT_FIT = 3.4; // turned base of each colonette
const TOP_FIT = 6; // turned capital of each colonette
const CAPZ = BASE_Z + 4 + FOOT_FIT + LMAX + TOP_FIT; // underside of the shared capital
const z1Of = () => CAPZ - TOP_FIT; // top of each free span
const z0Of = (c) => z1Of() - c.L * 100; // bottom of the free span
const pedTop = (c) => z0Of(c) - FOOT_FIT;
const CAP_TOP = CAPZ + 14;
const POT1 = CAP_TOP + 5;
const ROLL_R = 5;
const POT2 = POT1 + 2 * ROLL_R;
const BEAM_TOP = POT2 + 10;

const RAIL = { x: -90, y: 38, w: 180, d: 16, r: 1.5 };
const RAIL_Z = 1.2;
const BAR_Z = 3.2;
const CAR_Z = BAR_Z; // carriage base underside
const CAR_H = 3;
const COL_Y = 47; // gauge column centre (y)
const COL_HALF = 2.5;
const COL_TOP = CAPZ + 2;
const PIVOT = [0, 32, 84];
const ARM = 37;
const HEAD_R = 3;
const HEAD_W = 4.6;
// the arm angle (from hanging straight down, positive toward the colonettes) at contact
const contactPhi = (c) => Math.asin((PIVOT[1] - (YC + radOf(c) + HEAD_R)) / ARM);

const DIAL = { x: 156, y: 28, r: 15 };
const DIAL_Z = 2;
const DIAL_H = 8;
const DIAL_TOP = DIAL_Z + DIAL_H;
const F_MIN = 150;
const F_MAX = 600;
const dialAngle = (f) => (-135 + (270 * Math.log2(f / F_MIN)) / Math.log2(F_MAX / F_MIN)) * (Math.PI / 180);

const HORN = { x: 132, y: -12, z: 40, len: 26 };

const AZ = 57;
const P = k.fitProjection(
  [
    ...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0),
    [-118, -26, BEAM_TOP], [118, -26, BEAM_TOP], [-118, -6, BEAM_TOP], [118, -6, BEAM_TOP],
    [colX(0), 56, COL_TOP], [colX(9), 56, COL_TOP],
  ],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: AZ, elevation: 30 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// ---- the colonette: a round column that can bow in its first clamped-clamped mode --------
// Shared verbatim with the page (it is injected as source), so the static and the vibrating
// colonette are the same geometry. Free identifiers: iso, pathOf, circleRing, cameraOf.
const COLUMN_SRC = `
const MODE_B = 4.730041, MODE_S = 0.982502;
const modeRaw = (t) => Math.cosh(MODE_B * t) - Math.cos(MODE_B * t) - MODE_S * (Math.sinh(MODE_B * t) - Math.sin(MODE_B * t));
const MODE_N = modeRaw(0.5);
const modeOf = (t) => modeRaw(t) / MODE_N;
function columnPaths(cx, cy, r, z0, h, amp, dir, P, steps) {
  const K = amp ? 18 : 1;
  const ring = circleRing(cx, cy, r, steps);
  const n = ring.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const [ax, ay] = ring[i], [bx, by] = ring[(i + 1) % n]; area += ax * by - bx * ay; }
  const counter = area > 0;
  const { sinA, cosA } = cameraOf(P);
  const normals = ring.map(([ax, ay], i) => {
    const [bx, by] = ring[(i + 1) % n];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    return counter ? [(by - ay) / len, -(bx - ax) / len] : [-(by - ay) / len, (bx - ax) / len];
  });
  const facing = normals.map(([nx, ny]) => nx * cosA + ny * sinA > 1e-9);
  const levels = [];
  for (let j = 0; j <= K; j++) { const t = j / K; const s = amp ? amp * modeOf(t) : 0; levels.push([dir[0] * s, dir[1] * s, z0 + h * t]); }
  const colOf = (i) => levels.map(([ox, oy, z]) => iso([ring[i][0] + ox, ring[i][1] + oy, z], P));
  const z1 = z0 + h;
  const shades = [[], [], [], []];
  for (let i = 0; i < n; i++) {
    if (!facing[i]) continue;
    const [nx, ny] = normals[i];
    const lit = (nx * -sinA + ny * cosA + 1) / 2;
    const shade = Math.min(3, Math.max(0, Math.floor(lit * 4)));
    const a = colOf(i), b = colOf((i + 1) % n);
    shades[shade].push(pathOf([...a, ...b.reverse()], true));
  }
  let s = 0, e = 0;
  for (let i = 0; i < n; i++) {
    if (!facing[(i + n - 1) % n] && facing[i]) s = i;
    if (facing[(i + n - 1) % n] && !facing[i]) e = i;
  }
  const run = (from, to) => { const out = []; for (let i = from; ; i = (i + 1) % n) { out.push(i); if (i === to) break; } return out; };
  const near = run(s, e), far = run(e, s);
  const bottom = near.map((i) => iso([ring[i][0], ring[i][1], z0], P));
  const topNear = near.map((i) => iso([ring[i][0], ring[i][1], z1], P));
  const topFar = far.map((i) => iso([ring[i][0], ring[i][1], z1], P));
  const left = colOf(s), right = colOf(e);
  const fill = pathOf([...bottom, ...right.slice(1), ...topFar.slice(1), ...left.slice(1).reverse().slice(1)], true);
  const sides = pathOf(left) + pathOf(right);
  return {
    fill,
    shades: shades.map((list) => list.join("")),
    top: pathOf([...topNear, ...topFar.slice(1, -1)], true),
    crease: pathOf(topNear),
    outline: pathOf(bottom) + sides + pathOf(topFar),
    sides,
  };
}
`;
const { columnPaths } = new Function("iso", "pathOf", "circleRing", "cameraOf", COLUMN_SRC + "; return { columnPaths };")(k.iso, k.pathOf, k.circleRing, k.cameraOf);
const COL_STEPS = 32;
const colonette = (c, lit) => S(columnPaths(colX(c.i), YC, radOf(c), z0Of(c), c.L * 100, 0, [0, -1], P, COL_STEPS), { tone: lit ? "hi" : "mid", crease: lit ? "lo" : "faint", lit });

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

// the shared base block of the cluster: a plinth moulding and a block with a fillet band
function baseBlock() {
  const lower = { x: -98, y: -36, w: 196, d: 62, r: 3 };
  const upper = { x: -94, y: -32, w: 188, d: 54, r: 2 };
  const ribs = [];
  for (let x = -88; x <= 88; x += 5) ribs.push(k.segment([x, upper.y + upper.d, 6.4], [x, upper.y + upper.d, 10.6], P));
  for (let y = -27; y <= 18; y += 5) ribs.push(k.segment([upper.x + upper.w, y, 6.4], [upper.x + upper.w, y, 10.6], P));
  return [
    `<path class="iso-halo" d="${k.haloOf(lower, 0, 2, P)}" style="filter:blur(3px)"/>`,
    S(k.slabOf(lower, 0, 5, P, 4, 0.6), { tone: "lo" }),
    S(k.slabOf(upper, 5, BASE_Z - 5, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(upper, 6.4, P, 4) + k.sideSeam(upper, 10.6, P, 4), { tone: "faint" }) }),
    L(ribs.join(""), { tone: "faint" }),
  ].join("");
}

// the main pier behind the colonettes, with bands and two carved panels on its end face
function pier() {
  const plan = { x: -82, y: -28, w: 164, d: 26, r: 2 };
  const h = CAPZ - BASE_Z;
  const bands = [BASE_Z + 22, CAPZ - 24].map((z) => k.sideSeam(plan, z, P, 4)).join("");
  const panel = (z0, z1) => k.pathOf([[82, -24, z0], [82, -6, z0], [82, -6, z1], [82, -24, z1]].map(at), true);
  return [
    S(k.slabOf(plan, BASE_Z, h, P, 4, 0.8), { tone: "mid", inner: L(bands, { tone: "faint" }) }),
    L(panel(BASE_Z + 28, BASE_Z + 62) + panel(BASE_Z + 70, CAPZ - 30), { tone: "faint" }),
    L([BASE_Z + 45, (BASE_Z + 70 + CAPZ - 30) / 2].map((z) => k.sideRing([82, -15, z], 6, "x", P) + k.sideRing([82, -15, z], 3.2, "x", P)).join(""), { tone: "lo" }),
  ].join("");
}

function pedestal(c) {
  const x = colX(c.i);
  const plan = { x: x - 6.5, y: YC - 6.5, w: 13, d: 13, r: 1 };
  const h = pedTop(c) - BASE_Z;
  return S(k.slabOf(plan, BASE_Z, h, P, 3, 0.4), { tone: "mid", inner: h > 9 ? L(k.sideSeam(plan, BASE_Z + 3, P, 3), { tone: "faint" }) : "" });
}

// each colonette is turned with a small moulded base and a pot-shaped capital (kumbha)
function footFit(c) {
  const r = radOf(c);
  const F = G.frameAlong([colX(c.i), YC, pedTop(c)], [0, 0, 1]);
  return S(G.solidOf([[0, r + 2.6], [1, r + 2.6], [1, r + 1.8], [1.5, r + 2.3, 1], [2.5, r + 1.6, 1], [FOOT_FIT, r + 0.7]], F, P), { tone: "mid", crease: "lo" });
}
function topFit(c) {
  const r = radOf(c);
  const F = G.frameAlong([colX(c.i), YC, z1Of()], [0, 0, 1]);
  return S(G.solidOf([[0, r + 0.7], [0.6, r + 1.5, 1], [1.9, r + 2.5, 1], [3.2, r + 2.0, 1], [4, r + 1], [4, r + 2.7], [TOP_FIT, r + 2.7]], F, P), { tone: "mid", crease: "lo" });
}

function capital() {
  const lower = { x: -96, y: -34, w: 192, d: 50, r: 3 };
  const upper = { x: -100, y: -38, w: 200, d: 58, r: 3 };
  const lowerPaths = k.slabOf(lower, CAPZ, 6, P, 4, 0.5);
  const upperPaths = k.slabOf(upper, CAPZ + 6, 8, P, 4, 1);
  const za = CAPZ + 1.2, zb = CAPZ + 4.8;
  const ribs = [];
  for (let x = -90; x <= 90; x += 6) ribs.push(k.segment([x, lower.y + lower.d, za], [x, lower.y + lower.d, zb], P));
  for (let y = -28; y <= 10; y += 6) ribs.push(k.segment([lower.x + lower.w, y, za], [lower.x + lower.w, y, zb], P));
  return {
    svg: [
      S(lowerPaths, { tone: "mid", inner: L(k.sideSeam(lower, za, P, 4) + k.sideSeam(lower, zb, P, 4), { tone: "faint" }) }),
      L(ribs.join(""), { tone: "faint" }),
      S(upperPaths, { tone: "mid", inner: L(k.sideSeam(upper, CAPZ + 10, P, 4), { tone: "faint" }) }),
      L(k.planOutline(k.insetPlan(upper, 6), CAP_TOP, P, 4), { tone: "faint" }),
    ].join(""),
    clip: lowerPaths.fill + upperPaths.fill,
  };
}

// the bracket (potigai): a block on the capital, rolled corbels at each end, a bud under
// each roll, and the beam they carry
function bracketAndBeam() {
  const t1 = { x: -104, y: -31, w: 208, d: 30, r: 2 };
  const t2 = { x: -107, y: -28, w: 214, d: 24, r: 2 };
  const beam = { x: -118, y: -26, w: 236, d: 20, r: 1.2 };
  const rollX = 107 + ROLL_R * 0.4;
  const out = [S(k.slabOf(t1, CAP_TOP, POT1 - CAP_TOP, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(t1, CAP_TOP + 2.5, P, 3), { tone: "faint" }) })];
  out.push(S(k.slabOf(t2, POT1, POT2 - POT1, P, 3, 0.5), { tone: "mid" }));
  for (const sx of [-1, 1]) {
    const x = sx * rollX;
    const B = G.frameAlong([x, -16, POT1], [0, 0, -1]);
    out.push(S(G.solidOf([[0, 1.6], [1.2, 2.4, 1], [3, 3, 1], [5, 2.5, 1], [6.6, 1.3, 1], [7.4, 0.3, 1], [7.5, 0]], B, P), { tone: "mid" }));
    const F = G.frameAlong([x, t2.y, POT1 + ROLL_R], [0, 1, 0]);
    out.push(S(G.disc(0, t2.d, ROLL_R, F, P), { tone: "mid", inner: L(G.arcOf(F, t2.d / 2, ROLL_R, P), { tone: "faint" }) }));
    out.push(L(G.circleOf(F, t2.d, ROLL_R - 1.6, P) + G.circleOf(F, t2.d, ROLL_R - 3.2, P), { tone: "faint" }));
    out.push(D([at([x, t2.y + t2.d, POT1 + ROLL_R])], { size: 0.45 }));
  }
  out.push(S(k.slabOf(beam, POT2, BEAM_TOP - POT2, P, 3, 0.8), { tone: "lo", inner: L(k.sideSeam(beam, POT2 + 3.5, P, 3), { tone: "faint" }) }));
  out.push(D([at([-112, -16, BEAM_TOP]), at([112, -16, BEAM_TOP])], { size: 0.45 }));
  return out.join("");
}

// the carver's station: a colonette blank on two V-blocks, half dressed, with chisel and mallet.
// Tuning was done by ear, by carving material away.
function station() {
  const out = [];
  const zt = 9, R = 5.6;
  for (const x of [-200, -150]) {
    const plan = { x: x - 5, y: -14, w: 10, d: 20, r: 1 };
    out.push(S(k.slabOf(plan, 0, zt, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, 3, P, 3), { tone: "faint" }) }));
    // felt pads: the dressed end is thinner, so its pad is thicker
    out.push(S(k.slabOf({ x: x - 5, y: -6.5, w: 10, d: 5, r: 0.6 }, zt, x > -170 ? 2 : 0.8, P, 2), { tone: "lo", crease: "none" }));
  }
  const F = G.frameOf([-212, -4, zt + 0.8 + R], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const oct = Array.from({ length: 8 }, (_, j) => { const a = (j + 0.5) * Math.PI / 4; return [Math.cos(a) * R / Math.cos(Math.PI / 8), Math.sin(a) * R / Math.cos(Math.PI / 8)]; });
  out.push(S(G.prismOf(F, oct, 0, 34, P), { tone: "mid" }));
  out.push(S(G.solidOf([[34, R - 0.2], [36, R - 0.6, 1], [38, R - 1.1, 1], [40, R - 1.2], [96, R - 1.2]], F, P), { tone: "mid", inner: L(G.arcOf(F, 70, R - 1.2, P), { tone: "faint" }) }));
  // chips under the dressed end
  out.push(D([[-176, 9], [-170, 13], [-166, 7], [-160, 12], [-172, 16], [-163, 17]].map(([x, y]) => at([x, y, 0])), { size: 0.6, tone: "mid" }));
  // chisel lying on the bench
  const C = G.frameAlong([-196, 20, 1.5], [Math.cos(0.25), Math.sin(0.25), 0]);
  out.push(S(G.solidOf([[0, 1.5], [9, 1.5], [9.6, 1.1], [10.4, 1.1], [10.4, 0.6], [18, 0.6], [19.4, 0.25]], C, P), { tone: "mid" }));
  // wooden mallet: head across, handle along
  const M = G.frameAlong([-170, 30, 3.6], [0, 1, 0]);
  out.push(S(G.disc(-5, 5, 3.6, M, P), { tone: "mid", inner: L(G.arcOf(M, -3.6, 3.6, P) + G.arcOf(M, 3.6, 3.6, P), { tone: "faint" }) }));
  const H = G.frameAlong([-166.4, 30, 1.6], [1, 0, 0]);
  out.push(S(G.solidOf([[0, 1.1], [18, 1.3], [18, 1.6], [20, 1.6]], H, P), { tone: "mid" }));
  return out.join("");
}

function rail() {
  const out = [S(k.slabOf(RAIL, 0, RAIL_Z, P, 3), { tone: "lo", crease: "none" })];
  const t = k.topTicks(colX(0), colX(9), GAP / 2, 2, RAIL.y + 0.8, RAIL_Z, [2, 3.8], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  for (const y of [42, 50]) {
    out.push(S(k.slabOf({ x: RAIL.x + 6, y, w: RAIL.w - 12, d: 3, r: 1 }, RAIL_Z, BAR_Z - RAIL_Z, P, 3, 0.3), { tone: "mid" }));
  }
  for (const x of [RAIL.x + 1, RAIL.x + RAIL.w - 6]) {
    const stop = { x, y: RAIL.y + 1, w: 5, d: RAIL.d - 2, r: 1 };
    out.push(S(k.slabOf(stop, RAIL_Z, 6, P, 3, 0.4), { tone: "mid" }));
    out.push(D([at([x + 2.5, stop.y + 3, RAIL_Z + 6]), at([x + 2.5, stop.y + stop.d - 3, RAIL_Z + 6])], { size: 0.42 }));
  }
  return out.join("");
}

function horn() {
  const out = [];
  const px = HORN.x - 8, py = HORN.y;
  out.push(S(k.cylinder(px, py, 4.2, 0, 1.6, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(px, py, 1.3, 1.6, HORN.z - 2.6 - 1.6, P, 16), { tone: "mid", crease: "none", inner: L(k.sideArc(px, py, 1.3, 14, P, 10), { tone: "faint" }) }));
  // the bell: an analytic flare, throat at HORN.x, mouth toward the colonettes
  const F = G.frameAlong([HORN.x, HORN.y, HORN.z], [-1, 0, 0]);
  const radius = (s) => 1.6 + 6.6 * Math.pow(s / HORN.len, 2.4);
  const slope = (s) => 6.6 * 2.4 * Math.pow(s / HORN.len, 1.4) / HORN.len;
  const prof = Array.from({ length: 25 }, (_, j) => { const s = (j / 24) * HORN.len; return [s, radius(s), 1]; });
  out.push(S(G.lathe([[0, 0], ...prof, [HORN.len, 0]], F, P, { smooth: { slope } }), { tone: "mid" }));
  // clamp band where the stand holds it
  const band = G.frameAlong([px, HORN.y, HORN.z], [-1, 0, 0]);
  out.push(S(G.disc(-1.2, 1.2, 2.6, band, P), { tone: "mid" }));
  return out.join("");
}

function wire() {
  const from = [HORN.x + 0.02, HORN.y, HORN.z];
  return k.wireSvg(at(from), at([DIAL.x - 6, DIAL.y - 6, DIAL_Z + 1]), {
    via: [at([HORN.x + 5, HORN.y, HORN.z]), at([HORN.x + 5, HORN.y, 1]), at([HORN.x + 5, DIAL.y - 14, 1])],
    tone: "lo",
    ends: "from",
    size: 0.9,
  });
}

function dialTicks(freqs, majors) {
  const r0 = DIAL.r - 3;
  const minor = [], major = [];
  for (const f of freqs) {
    const big = majors.includes(f);
    const a = dialAngle(f);
    const r1 = r0 - (big ? 3 : 1.5);
    const seg = k.lineOnTop([DIAL.x + Math.sin(a) * r1, DIAL.y - Math.cos(a) * r1], [DIAL.x + Math.sin(a) * r0, DIAL.y - Math.cos(a) * r0], DIAL_TOP, P);
    (big ? major : minor).push(seg);
  }
  return L(minor.join(""), { tone: "lo" }) + L(major.join(""), { tone: "mid" });
}

function dial() {
  const { x, y, r } = DIAL;
  const out = [S(k.cylinder(x, y, r + 3, 0, DIAL_Z, P, 48), { tone: "lo" })];
  out.push(S(k.cylinder(x, y, r, DIAL_Z, DIAL_H, P, 64, 0.8), { tone: "mid", inner: L(k.sideArc(x, y, r, DIAL_TOP - 3.4, P, 40), { tone: "faint" }) }));
  out.push(L(k.knurl(x, y, r, DIAL_TOP - 3.4, DIAL_TOP, 64, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(x, y, r - 2.2, DIAL_TOP, P, 64), { tone: "lo" }));
  out.push(L(k.ring(x, y, r - 3, DIAL_TOP, P, 64), { tone: "faint" }));
  // legend face: the swaras of two octaves from Sa = G3; physics face: hertz on a log scale
  const sw = [-2, -1, 0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23].map((s) => SA * 2 ** (s / 12)).filter((f) => f >= F_MIN && f <= F_MAX);
  out.push(`<g data-face="tradition">${dialTicks(sw, [SA, SA * 2])}</g>`);
  const hz = []; for (let f = 150; f <= 600; f += 50) hz.push(f);
  out.push(`<g data-face="anatomy" opacity="0">${dialTicks(hz, [200, 300, 400, 500, 600])}</g>`);
  // crown on the +x side
  out.push(S(k.slabOf({ x: x + r - 0.5, y: y - 2, w: 3, d: 4, r: 0.6 }, DIAL_Z + 2.5, 3, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x + r + 2.5, y: y - 3, w: 2.4, d: 6, r: 1 }, DIAL_Z + 1.8, 4.4, P, 3), { tone: "mid" }));
  out.push(L(k.lineOnTop([x, y], [x, y - r + 5], DIAL_TOP, P), { tone: "hi", free: "end" }).replace("<path", '<path data-needle'));
  out.push(L(k.ring(x, y, 1.6, DIAL_TOP, P, 16), { tone: "hi" }));
  out.push(D([at([x, y, DIAL_TOP])], { size: 0.55 }));
  return out.join("");
}

function labelPlate() {
  const plan = { x: 128, y: 50, w: 40, d: 19, r: 1.4 };
  return [
    S(k.slabOf(plan, 0, 0.8, P, 4), { tone: "lo", crease: "none" }),
    L(k.planOutline(k.insetPlan(plan, 1.6), 0.8, P, 4), { tone: "faint" }),
    k.faceTextSvg(k.topMatrix([plan.x + 4, plan.y + 7.5], 0.8, P, "x"), "இசைத் தூண்", { size: 4, tone: "mid" }),
    L(k.lineOnTop([plan.x + 4, plan.y + 11.5], [plan.x + 30, plan.y + 11.5], 0.8, P), { tone: "lo", free: true }),
    L(k.lineOnTop([plan.x + 4, plan.y + 14.5], [plan.x + 20, plan.y + 14.5], 0.8, P), { tone: "lo", free: true }),
    D([at([plan.x + 2.4, plan.y + 2.4, 0.8]), at([plan.x + plan.w - 2.4, plan.y + plan.d - 2.4, 0.8])], { size: 0.42 }),
  ].join("");
}

// ---- the striker carriage (built at x = 0, moved along the rail) ------------------------
const COL_RING = box(-COL_HALF, COL_Y - COL_HALF, COL_HALF, COL_Y + COL_HALF);
function carriageBase() {
  const plan = { x: -8, y: 40.5, w: 16, d: 15, r: 2 };
  return [
    `<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 1), CAR_Z, 0.1, P)}" style="filter:blur(3px)"/>`,
    S(k.slabOf(plan, CAR_Z, CAR_H, P, 4, 0.5), { tone: "mid" }),
    D([[-5.5, 43], [5.5, 43], [-5.5, 53], [5.5, 53]].map(([x, y]) => at([x, y, CAR_Z + CAR_H])), { size: 0.42 }),
  ].join("");
}
function carriageColumn() {
  const zb = CAR_Z + CAR_H;
  const foot = { x: -5, y: COL_Y - 5, w: 10, d: 10, r: 1.2 };
  const out = [S(k.slabOf(foot, zb, 3, P, 3, 0.4), { tone: "mid" })];
  out.push(S(k.extrude(COL_RING, zb + 3, COL_TOP - zb - 3, P), { tone: "mid" }));
  // the rule: ticks every 5 cm on the column's front face, rooted on its left edge
  const minor = [], major = [];
  for (let z = BASE_Z; z <= COL_TOP - 3; z += 5) {
    const big = (z - BASE_Z) % 25 === 0;
    const seg = k.segment([-COL_HALF, COL_Y + COL_HALF, z], [-COL_HALF + (big ? 3.4 : 1.8), COL_Y + COL_HALF, z], P);
    (big ? major : minor).push(seg);
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  // cap
  out.push(S(k.slabOf({ x: -3.2, y: COL_Y - 3.2, w: 6.4, d: 6.4, r: 1 }, COL_TOP, 1.6, P, 3, 0.3), { tone: "mid" }));
  return out.join("");
}
// the hammer's clamp on the column, with its bracket reaching back to the pivot
function hammerClamp() {
  const z = PIVOT[2] - 4;
  const clamp = { x: -4, y: COL_Y - 4, w: 8, d: 8, r: 1 };
  return [
    S(k.slabOf(clamp, z, 8, P, 3, 0.4), { tone: "mid" }),
    S(G.disc(0, 2, 1.4, G.frameAlong([4, COL_Y, z + 4], [1, 0, 0]), P), { tone: "mid" }),
    S(G.disc(2, 4.4, 2.2, G.frameAlong([4, COL_Y, z + 4], [1, 0, 0]), P), { tone: "hi", crease: "lo" }),
  ].join("");
}
function hammerBracket() {
  const z = PIVOT[2] - 1.5;
  return [
    S(k.slabOf({ x: -3.2, y: PIVOT[1] - 1.5, w: 1.6, d: COL_Y - 4 - PIVOT[1] + 1.5, r: 0.3 }, z, 3, P, 2), { tone: "mid" }),
    S(k.slabOf({ x: 1.6, y: PIVOT[1] - 1.5, w: 1.6, d: COL_Y - 4 - PIVOT[1] + 1.5, r: 0.3 }, z, 3, P, 2), { tone: "mid" }),
  ];
}
function knob() {
  const cy = 55.5 + 2.6;
  return [
    S(k.slabOf({ x: -1.4, y: 55.5, w: 2.8, d: 1.6, r: 0.3 }, CAR_Z + 0.8, 1.6, P, 2), { tone: "mid" }),
    S(k.cylinder(0, cy, 2.6, CAR_Z, 2.8, P, 24), { tone: "mid" }),
    L(k.knurl(0, cy, 2.6, CAR_Z, CAR_Z + 2.8, 16, P), { tone: "lo" }),
  ].join("");
}

// ---- assemble, back to front -------------------------------------------
const cap = capital();
const body = [bench(), station(), baseBlock(), pier()];
COLS.forEach((c) => {
  body.push(pedestal(c));
  body.push(footFit(c));
  body.push(`<g data-col="${c.i}">${colonette(c, c.i === 4)}</g>`);
  body.push(`<g data-ghost="${c.i}"></g>`);
  body.push(topFit(c));
});
body.push(cap.svg, bracketAndBeam());
body.push(horn(), wire(), rail(), dial(), labelPlate());
const [bracketL, bracketR] = hammerBracket();
body.push(
  `<g data-part="carriage" transform="${k.translateAlong(P, [colX(4), 0, 0])}">`,
  `<clipPath id="pl-under-cap"><path data-hold clip-rule="evenodd" d="M-200 -200H1000V800H-200Z${cap.clip}"/></clipPath>`,
  carriageBase(),
  bracketL,
  `<g data-live="feel0"></g><g clip-path="url(#pl-under-cap)"><g data-live="feel1"></g></g><g data-live="hammer"></g>`,
  bracketR,
  carriageColumn(),
  `<g data-live="jaws"></g>`,
  hammerClamp(),
  knob(),
  `</g>`,
);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A stone pillar cluster on a bench: ten slender colonettes, stepped in height and thickness, stand in a row in front of a carved pier, all rising from one base block to one capital with a bracket and beam above. A carriage on a rail in front carries a hanging hammer that swings in to tap the chosen colonette, which bows and rings; a horn on the right feeds a dial that reads the pitch. In the physics lens a height gauge on the carriage grips the colonette at both ends to show its free length and diameter.",
  body,
});

// ---- live --------------------------------------------------------------
const LIVE_COLS = COLS.map((c) => ({
  x: colX(c.i), r: radOf(c), z0: z0Of(c), h: c.L * 100, phi: contactPhi(c),
  d: c.d, L: c.L, f: c.f, f2: c.f2, note: c.note.name, sw: c.sw, ta: c.ta, upper: c.upper,
}));
const live = `
${LENS_JS}
${COLUMN_SRC}
const P = ${JSON.stringify(P)};
const COLS = ${JSON.stringify(LIVE_COLS)};
const YC = ${YC}, COL_Y = ${COL_Y}, COL_HALF = ${COL_HALF}, PIVOT = ${JSON.stringify(PIVOT)}, ARM = ${ARM}, HEAD_R = ${HEAD_R}, HEAD_W = ${HEAD_W};
const DIAL = ${JSON.stringify(DIAL)}, DIAL_TOP = ${DIAL_TOP}, F_MIN = ${F_MIN}, F_MAX = ${F_MAX};
const PARK = [${BASE_Z + 4}, ${BASE_Z + 14}];
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (s) => svg.querySelector(s);
const carriage = q('[data-part="carriage"]');
const readout = document.querySelector("[data-readout]");
const colEls = COLS.map((_, i) => q('[data-col="' + i + '"]'));
const ghostEls = COLS.map((_, i) => q('[data-ghost="' + i + '"]'));
const hammerEl = q('[data-live="hammer"]');
const feelEls = [q('[data-live="feel0"]'), q('[data-live="feel1"]')];
const jawsEl = q('[data-live="jaws"]');
const needle = q("[data-needle]");
const faces = { tradition: q('[data-face="tradition"]'), anatomy: q('[data-face="anatomy"]') };
const muteBtn = document.querySelector("[data-mute]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const follow = (x, t, dt, tau, calm) => calm ? t : x + (t - x) * (1 - Math.exp(-dt / tau));
const CAL = 5; // exaggerated bow at midspan, world units
const TAU_V = 0.85; // visual decay, seconds
const visHz = (f) => 2.4 + f / 140; // slowed: the real note is hundreds of hertz

let lens = "tradition", sel = 4, cx = COLS[4].x, ext = 0, clock = 0, last = 0, frame = 0, visible = false, idle = 0;
let touring = !still.matches, tourWait = 1.4, logF = Math.log(COLS[4].f);
let jz = [PARK[0], PARK[1]];
let swing = null; // { at, i, user, hit }
let pending = null; // { user }
const vib = COLS.map(() => -1);
const shown = COLS.map(() => "");
let muted = false, audio = null;

const dirOf = [0, -1];
function colSvg(i, amp) {
  const c = COLS[i];
  return solidSvg(columnPaths(c.x, YC, c.r, c.z0, c.h, amp, dirOf, P, 32), i === sel ? { tone: "hi", crease: "lo", lit: true } : { tone: "mid", crease: "faint" });
}
function ghostSvg(i) {
  const c = COLS[i];
  const a = columnPaths(c.x, YC, c.r, c.z0, c.h, 9, dirOf, P, 32).sides;
  const b = columnPaths(c.x, YC, c.r, c.z0, c.h, -9, dirOf, P, 32).sides;
  return lineSvg(a + b, { tone: "mid", dotted: true });
}
function slab(x0, y0, x1, y1, z, h, tone) {
  return solidSvg(slabOf({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), d: Math.abs(y1 - y0), r: 0.3 }, z, h, P, 2), { tone });
}
// a feeler: an arm from the jaw back toward the colonette, ending in a fork that grips its sides
function feelerSvg(z, r, e) {
  const back = COL_Y - COL_HALF - 1.2;
  const tipY = back - e * (back - (YC + r + 1.2));
  let out = slab(-0.9, tipY, 0.9, back, z - 0.8, 1.6, "mid");
  if (e > 0.02) {
    const w = r + 0.5 + 1;
    const pl = YC + 0.35 * r;
    out = slab(-w, tipY - 1.2, -r - 0.05, tipY, z - 0.8, 1.6, "hi") + out;
    out = slab(-w, pl, -w + 1, tipY - 1.2, z - 0.8, 1.6, "hi") + out;
    out += slab(r + 0.05, tipY - 1.2, w, tipY, z - 0.8, 1.6, "hi") + slab(w - 1, pl, w, tipY - 1.2, z - 0.8, 1.6, "hi");
  }
  return out;
}
function jawSvg(z) {
  const plan = { x: -4.2, y: COL_Y - 4.2, w: 8.4, d: 8.4, r: 1 };
  const F = G.frameAlong([4.2, COL_Y + 1.5, z], [1, 0, 0]);
  return solidSvg(slabOf(plan, z - 2.8, 5.6, P, 3, 0.4), { tone: "mid" }) +
    solidSvg(G.disc(0, 1.6, 0.9, F, P), { tone: "mid" }) + solidSvg(G.disc(1.6, 3.6, 1.7, F, P), { tone: "hi", crease: "lo" });
}
function hammerSvg(phi) {
  const dir = [0, -Math.sin(phi), -Math.cos(phi)];
  const head = [PIVOT[0], PIVOT[1] + dir[1] * ARM, PIVOT[2] + dir[2] * ARM];
  const FA = G.frameAlong(PIVOT, dir);
  const FH = G.frameAlong(head, [1, 0, 0]);
  const pin = G.frameAlong(PIVOT, [1, 0, 0]);
  return solidSvg(G.solidOf([[0, 1.6], [2.4, 1.6], [2.4, 0.85], [ARM - HEAD_R + 0.2, 1]], FA, P), { tone: "mid" }) +
    solidSvg(G.solidOf([[-HEAD_W, 0], [-HEAD_W, HEAD_R - 0.6], [-HEAD_W + 0.8, HEAD_R], [HEAD_W - 0.8, HEAD_R], [HEAD_W, HEAD_R - 0.6], [HEAD_W, 0]], FH, P), { tone: "hi", crease: "lo" }) +
    solidSvg(G.disc(-1.6, 1.6, 0.7, pin, P), { tone: "hi" });
}

const swaraOf = (c) => c.ta + " " + c.sw + (c.upper ? " (upper)" : "");
function say() {
  const c = COLS[sel];
  const ringing = vib[sel] >= 0 && clock - vib[sel] < 2.2;
  const text = lens === "tradition"
    ? swaraOf(c) + " · " + (ringing ? "the stone sings" : "each pillar a swara")
    : "d " + (c.d * 100).toFixed(1) + " cm · L " + c.L.toFixed(2) + " m · f ≈ " + Math.round(c.f) + " Hz ≈ " + c.note;
  if (readout.textContent !== text) readout.textContent = text;
}
function describe() {
  const c = COLS[sel];
  stage.setAttribute("aria-valuenow", String(sel + 1));
  stage.setAttribute("aria-valuetext", lens === "tradition"
    ? "Colonette " + (sel + 1) + " of 10, " + c.sw + (c.upper ? " in the upper octave" : "")
    : "Colonette " + (sel + 1) + ": diameter " + (c.d * 100).toFixed(1) + " centimetres, free length " + c.L.toFixed(2) + " metres, about " + Math.round(c.f) + " hertz, near " + c.note.replace("♯", " sharp"));
}

function tone(f, f2) {
  if (muted) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const t = audio.currentTime + 0.01;
    const out = audio.createGain();
    out.gain.value = 1;
    out.connect(audio.destination);
    for (const [hz, peak, fall] of [[f, 0.07, 1.5], [f2, 0.012, 0.45]]) {
      if (hz > 8000) continue;
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine"; o.frequency.value = hz;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + fall);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + fall + 0.05);
    }
  } catch (err) { /* no audio: the figure still works */ }
}
function warmAudio() {
  if (muted) return;
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume(); } catch (err) {}
}

function phiAt() {
  if (!swing) return 0;
  const c = COLS[swing.i];
  const t = clock - swing.at;
  const back = -0.22, wind = 0.2, fly = 0.13;
  if (t < wind) return back * ease(t / wind);
  if (t < wind + fly) { const u = (t - wind) / fly; return back + (c.phi - back) * u * u; }
  const u = t - wind - fly;
  return c.phi * Math.exp(-u / 0.32) * Math.cos(2 * Math.PI * 0.9 * u);
}

function draw() {
  carriage.setAttribute("transform", translateAlong(P, [cx, 0, 0]));
  holdStill(carriage, axisVector(P, [cx, 0, 0]));
  const phi = still.matches ? 0 : phiAt();
  hammerEl.innerHTML = hammerSvg(phi);
  const c = COLS[sel];
  const r = COLS.reduce((best, col) => Math.abs(col.x - cx) < Math.abs(best.x - cx) ? col : best).r;
  feelEls[0].innerHTML = feelerSvg(jz[0] + 0.9, r, ext);
  feelEls[1].innerHTML = feelerSvg(jz[1] - 0.9, r, ext);
  jawsEl.innerHTML = jawSvg(jz[0]) + jawSvg(jz[1]);
  COLS.forEach((col, i) => {
    const age = vib[i] >= 0 ? clock - vib[i] : 99;
    const env = still.matches ? 0 : Math.exp(-age / TAU_V);
    const amp = env > 0.01 ? CAL * env * Math.sin(2 * Math.PI * visHz(col.f) * age) : 0;
    const key = (i === sel ? "L" : "") + amp.toFixed(3);
    if (shown[i] !== key) { colEls[i].innerHTML = colSvg(i, amp); shown[i] = key; }
    const g = lens === "anatomy" && i === sel && ext > 0.6 ? ghostSvg(i) : "";
    if (ghostEls[i]._h !== g) { ghostEls[i].innerHTML = g; ghostEls[i]._h = g; }
  });
  const a = (-135 + 270 * (logF - Math.log(F_MIN)) / Math.log(F_MAX / F_MIN)) * Math.PI / 180;
  needle.setAttribute("d", lineOnTop([DIAL.x, DIAL.y], [DIAL.x + Math.sin(a) * (DIAL.r - 5), DIAL.y - Math.cos(a) * (DIAL.r - 5)], DIAL_TOP, P));
  faces.tradition.setAttribute("opacity", String(1 - ext));
  faces.anatomy.setAttribute("opacity", String(ext));
  say();
}

function strike(user) {
  if (user) warmAudio();
  pending = { user };
  run();
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  const calm = still.matches;
  const c = COLS[sel];
  if (touring) {
    tourWait -= dt;
    if (tourWait <= 0 && !swing && !pending) {
      if (Math.abs(cx - c.x) < 0.3) { pending = { user: false }; tourWait = 2.4; }
    }
    if (tourWait <= 0 && swing && clock - swing.at > 1.9) { sel = (sel + 1) % COLS.length; describe(); swing = null; tourWait = 0.1; }
  }
  cx = follow(cx, c.x, dt, 0.28, calm);
  if (Math.abs(cx - c.x) < 0.01) cx = c.x;
  const wantExt = lens === "anatomy" ? 1 : 0;
  ext = follow(ext, wantExt, dt, 0.3, calm);
  if (Math.abs(ext - wantExt) < 0.002) ext = wantExt;
  const wz = lens === "anatomy" ? [c.z0, c.z0 + c.h] : PARK;
  jz = jz.map((z, j) => { const n = follow(z, wz[j], dt, 0.3, calm); return Math.abs(n - wz[j]) < 0.01 ? wz[j] : n; });
  logF = follow(logF, Math.log(c.f), dt, 0.35, calm);
  if (Math.abs(logF - Math.log(c.f)) < 1e-4) logF = Math.log(c.f);
  if (pending && Math.abs(cx - c.x) < 0.4 && (!swing || clock - swing.at > 0.6)) {
    swing = { at: clock, i: sel, user: pending.user, hit: false };
    pending = null;
  }
  if (swing && !swing.hit && (calm || clock - swing.at >= 0.33)) {
    swing.hit = true;
    vib[swing.i] = clock;
    if (swing.user) tone(COLS[swing.i].f, COLS[swing.i].f2);
  }
  draw();
  const ringing = vib.some((v) => v >= 0 && clock - v < 4.2);
  const busy = touring || pending || (swing && clock - swing.at < 2.4) || ringing || cx !== c.x || ext !== wantExt || jz[0] !== wz[0] || jz[1] !== wz[1] || logF !== Math.log(c.f);
  frame = visible && busy ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const hold = () => { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; tourWait = 0.6; run(); }, 4200); };
const pick = (i) => { i = clamp(i, 0, COLS.length - 1); if (i !== sel) { sel = i; describe(); } hold(); run(); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
const XS = COLS.map((col) => iso([col.x, YC, col.z0 + col.h / 2], P)[0]);
function pointerPick(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const m = svg.getScreenCTM();
  if (!m) return sel;
  const x = pt.matrixTransform(m.inverse()).x;
  let best = 0;
  XS.forEach((sx, i) => { if (Math.abs(sx - x) < Math.abs(XS[best] - x)) best = i; });
  return best;
}
stage.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") pick(pointerPick(e)); });
stage.addEventListener("pointerdown", (e) => { pick(pointerPick(e)); strike(true); });
stage.addEventListener("keydown", (e) => {
  let to = null;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") to = sel + 1;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = sel - 1;
  if (e.key === "Home") to = 0;
  if (e.key === "End") to = COLS.length - 1;
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hold(); strike(true); return; }
  if (e.key === "m" || e.key === "M") { setMute(!muted); return; }
  if (to === null) return;
  e.preventDefault();
  pick(to);
});
function setMute(m) {
  muted = m;
  if (muteBtn) { muteBtn.setAttribute("aria-pressed", String(m)); muteBtn.textContent = m ? "sound off" : "sound on"; }
}
if (muteBtn) muteBtn.addEventListener("click", () => setMute(!muted));
wireLens((id) => { lens = id; describe(); run(); });
describe();
draw();
`;

const MUTE_CSS = `<style>
.pl-mute{position:absolute;top:13px;left:72px;appearance:none;border:0;background:transparent;color:var(--anatomy-muted);font:10.5px/1 var(--anatomy-mono);letter-spacing:.04em;padding:5px 6px;cursor:pointer;border-radius:5px}
.pl-mute:hover{color:var(--anatomy-strong)}
.pl-mute:focus-visible{outline:1px solid var(--anatomy-mid)}
.pl-mute[aria-pressed="true"]{text-decoration:line-through}
@media (max-width:600px){.pl-mute{top:30px;left:14px}}
.iso-stage{touch-action:pan-y;cursor:pointer}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
</style>`;

const best = COLS.map((c) => c.note.cents);
const plate = k.plateHtml({
  fig: "Fig 5",
  title: "Isai Thoon · the singing stone",
  hint: "Hover to pick · click or Enter to strike",
  readout: "ப Pa · each pillar a swara",
  keys: [
    { mark: "lit", label: "The colonette being struck" },
    { mark: "raised", label: "Ten colonettes and a pier, one block of stone" },
    { mark: "dotted", label: "Bending mode, drawn in the physics lens" },
  ],
  caption:
    "Ten colonettes rise from one base block to one capital, carved with the pier as a single piece. The hammer on the carriage swings in and taps the one you pick; it bows and rings (the bow is exaggerated and slowed here). Sizes are illustrative, tuned to a scale with Sa at G3; the dial reads the pitch the horn hears. Switch to The physics to see each note worked out from the colonette's thickness and free length.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Musical pillar cluster: arrow keys pick a colonette, Enter strikes it, M mutes" aria-valuemin="1" aria-valuemax="10" aria-valuenow="5">${svg}</div><button type="button" class="pl-mute" data-mute aria-pressed="false">sound on</button>`,
});

const html = page({
  title: "Isai Thoon",
  theme,
  tamil: "இசைத் தூண்கள் · Musical Pillars, Nellaiappar",
  lenses: [{ id: "tradition", label: "The legend" }, { id: "anatomy", label: "The physics" }],
  notes: {
    tradition:
      "<b>What the legend says.</b> In the Nellaiappar temple at Tirunelveli, slender stone colonettes are carved in clusters around main pillars, each cluster from a single block of stone. Tap one and it rings; tap its neighbour and the note changes, so each pillar is said to hold a swara. The pillars are traditionally attributed to the Pandya period, around the 7th century CE. Similar musical pillars stand at the Meenakshi temple in Madurai and at Suchindram, and, outside Tamil Nadu, at the Vittala temple in Hampi. Today they are often shared as stone that sings for reasons no one understands.",
    anatomy:
      "<b>What the physics shows.</b> Each colonette is a stone beam fixed at both ends, to the base and to the capital. Struck, it bends back and forth, and its lowest bending mode sets the note. For an idealised round rod clamped at both ends, <b>f ≈ 3.56 · (d/4) / L² · √(E/ρ)</b>. For granite, with E about 50 GPa and ρ about 2,700 kg/m³, √(E/ρ) is about 4,300 m/s. So a thicker or shorter colonette sounds higher and a longer one lower: double the length and the note drops two octaves. The next mode sits about 2.76 times higher, not at a whole-number harmonic, which is part of why struck stone has a bell-like clink rather than a string's tone. Real colonettes are carved, tapered and irregular, and granite's stiffness varies widely, so real notes depend on the exact shape and stone; this model is idealised. Nothing here is a mystery. The honest wonder is the craft: choosing sound stone, sizing each colonette, and tuning it by ear by carving material away.",
  },
  sources:
    "Legend: temple descriptions of the Nellaiappar temple, Tirunelveli (Tamil Nadu HR&amp;CE); the Pandya date is a traditional attribution. Physics: Euler–Bernoulli beam theory for a beam clamped at both ends (first two modes βL ≈ 4.730 and 7.853); granite E roughly 10–70 GPa and ρ about 2,600–2,800 kg/m³ from standard material tables. Colonette sizes and notes in the model are illustrative, not measured at the temple.",
  plate: MUTE_CSS + plate,
  script: kitScript() + "\n" + latheScript() + live,
});

// lathe.mjs, inlined like the kit (its import line removed; it uses the kit's own globals)
function latheScript() {
  const src = readFileSync(join(HERE, "..", "..", "kit", "lathe.mjs"), "utf8").replace(/^import .*$/m, "").replace(/^export /gm, "");
  return `const G = (() => {
${src}
return { frameAlong, solidOf, disc };
})();
`;
}

const out = theme === "light" ? "pillars-light.html" : "pillars.html";
writeFileSync(join(HERE, out), html);
console.log("wrote", out);
console.log(COLS.map((c) => `${c.sw}${c.upper ? "'" : ""} d=${(c.d * 100).toFixed(1)}cm L=${c.L}m f=${c.f.toFixed(1)}Hz ${c.note.name} ${c.note.cents}c`).join("\n"));
void best;
