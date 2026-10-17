// Fig 2 — Pancha Vayu: the five winds and the three nadis.
// Tradition lens: a breath bellows drives a column (sushumna) with two side tubes
// (ida, pingala) and five chambers, one per wind, each showing its direction.
// A gate on top slides between the left and right nozzle.
// Anatomy lens: the bellows is the diaphragm, the column is the airway, the gate
// is the nasal cycle, and the chambers and side tubes go dim: no such channels exist.
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
const HEIGHT = 480;

// ---- truth -------------------------------------------------------------
// Tradition: the five vayus as yoga and Ayurveda place them (seat, direction, work).
// Anatomy: what physiology finds doing that work instead.
const WINDS = [
  { id: "apana", sa: "Apana", ta: "அபானன்", seat: "pelvis", dir: "down", fn: "elimination", real: "pelvic muscle", z0: 60, h: 11, R: 12.5 },
  { id: "samana", sa: "Samana", ta: "சமானன்", seat: "navel", dir: "to centre", fn: "digestion", real: "gut digests", z0: 85, h: 10, R: 14 },
  { id: "vyana", sa: "Vyana", ta: "வியானன்", seat: "whole body", dir: "out", fn: "circulation", real: "heart pumps", z0: 109, h: 9, R: 14.5 },
  { id: "prana", sa: "Prana", ta: "பிராணன்", seat: "chest, head", dir: "inward", fn: "intake", real: "diaphragm", z0: 132, h: 12, R: 13.5 },
  { id: "udana", sa: "Udana", ta: "உதானன்", seat: "throat", dir: "upward", fn: "speech", real: "larynx speaks", z0: 158, h: 9, R: 11.5 },
];
// Breath model: resting adult, about 12–20 breaths a minute and about 500 mL a breath.
// The figure runs at 12 a minute (5 s a breath), inhaling for 40% of it.
const BREATH = { period: 5, inhale: 0.4, tidal: 500, perMin: 12 };
// The nasal cycle takes hours; the figure compresses it to NASAL_S seconds.
const NASAL_S = 48;

// ---- world -------------------------------------------------------------
const AZ = 70;
const TX = -8; // tower axis
const TY = 0;
const BASE = { x: -104, y: -46, w: 254, d: 92, r: 8 };
const BASE_H = 12;
const FOOT_H = 5;
const BED = { x: -38, y: -28, w: 160, d: 56, r: 4 };
const BED_H = 10;
const POST = 17; // bellows guide posts at (TX ± POST, ± POST)
const TOPP = { x: TX - 21, y: -21, w: 42, d: 42, r: 4 };
const TOPP_Z = 42;
const TOPP_H = 5;
const TOP_Z = TOPP_Z + TOPP_H; // 47: the column stands here
const MP = { x: TX - 14, y: -14, w: 28, d: 28, r: 3 }; // moving plate
const MP_H = 3;
const ZP_OUT = 30; // plate z when fully breathed out
const ZP_IN = 18; // plate z at the top of a full tidal breath
const ZP0 = 24; // the plate is built here and moved
const COL_R = 4;
const NADI_R = 2;
const NADI_OFF = 9; // ida at TX − 10 (screen left), pingala at TX + 10
const HEAD = { x: TX - 18, y: -11, w: 36, d: 22, r: 8 };
const HEAD_Z = 181;
const HEAD_H = 6;
const NOZ_Z = HEAD_Z + HEAD_H; // 163
const NOZ_H = 5;
const GATE_Z = NOZ_Z + NOZ_H + 1; // 169, gate rides on the nozzle lips and the back rail
const GATE = { w: 13, d: 10 };
const GATE_TRAVEL = 8;
const STOP_X = 16.2;

const VIEW = [Math.cos((AZ * Math.PI) / 180), Math.sin((AZ * Math.PI) / 180)];
const PHI = (AZ * Math.PI) / 180;

const GX = -58; // height gauge beam centre
const BEAM = { x: GX - 3, y: -3, w: 6, d: 6, r: 0.4 };
const BEAM_TOP = 202;
const SLIDER = { x: GX - 6, y: -6, w: 12, d: 12, r: 1.5 };
const ARM_END = TX - 25;

const DIAL = { x: 96, y: 0, r: 17 }; // tidal volume gauge, on a raised housing
const HOUSE = { x: 74, y: -22, w: 44, d: 44, r: 3 };
const HOUSE_TOP = BED_H + 30;
const NDIAL = { x: 52, y: 10, r: 7.5 }; // nasal cycle dial
const DIAL_Z = BED_H + 4; // puck bottom
const DIAL_H = 7;
const NDIAL_H = 5;

const STOPS = [...WINDS.map((w) => w.z0 + w.h / 2), HEAD_Z + HEAD_H / 2];
const GAPS = [[TOP_Z, WINDS[0].z0], ...WINDS.slice(1).map((w, i) => [WINDS[i].z0 + WINDS[i].h, w.z0]), [WINDS[4].z0 + WINDS[4].h, HEAD_Z - 1.5]];

const P = k.fitProjection(
  [
    ...k.boxCorners(BASE, -BASE_H - FOOT_H, 0),
    [BEAM.x, BEAM.y, BEAM_TOP + 2],
    [BEAM.x + BEAM.w, BEAM.y + BEAM.d, BEAM_TOP + 2],
    [HEAD.x, HEAD.y, GATE_Z + 4],
    [HEAD.x + HEAD.w, HEAD.y + HEAD.d, GATE_Z + 4],
    [HOUSE.x + HOUSE.w, HOUSE.y + HOUSE.d, HOUSE_TOP + 12],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: AZ, elevation: 30 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const polar = (r, a) => [TX + Math.cos(a) * r, TY + Math.sin(a) * r];
const ringDots = (cx, cy, r, z, n, phase = 0) => Array.from({ length: n }, (_, i) => at([cx + Math.cos(phase + (i / n) * 2 * Math.PI) * r, cy + Math.sin(phase + (i / n) * 2 * Math.PI) * r, z]));
const facing = (a) => Math.cos(a - PHI); // > 0: a port at floor angle a points toward the viewer

// pleats of the bellows between the moving plate and the top plate; rebuilt live
const PLEATS = (zb, zt, cx, cy, P, K) => {
  const n = 6;
  const h = (zt - zb) / n;
  let s = "";
  for (let i = 0; i < n; i++) {
    const half = i % 2 ? 10.4 : 12.6;
    const plan = { x: cx - half, y: cy - half, w: half * 2, d: half * 2, r: i % 2 ? 2.4 : 3.2 };
    s += K.solidSvg(K.slabOf(plan, zb + i * h, h, P, 3), { tone: i % 2 ? "lo" : "mid" });
  }
  return s;
};


// ---- colour ------------------------------------------------------------
// Every colour is a token with a dark and a light value. Wind colours are this figure's
// choice; the nadi colours follow the moon (ida) and sun (pingala) association, sushumna gold.
// Glows are drop-shadows in normal blending: on paper a saturated body at lower alpha.
const VY_CSS = `<style>
.iso{--vy-ida:#aecbf0;--vy-pin:#ff9152;--vy-sus:#ffd166;--vy-prana:#f2c14b;--vy-apana:#e07a55;--vy-samana:#62d394;--vy-vyana:#b59bff;--vy-udana:#63b3ff;--vy-air:#b8ddff;--vy-ga:72%;--vy-gb:30%;--vy-col:var(--vy-sus)}
.iso[data-theme="light"]{--vy-ida:#3d6ea8;--vy-pin:#c94a16;--vy-sus:#b07a00;--vy-prana:#a57500;--vy-apana:#a8432a;--vy-samana:#1c8a4e;--vy-vyana:#6b46cc;--vy-udana:#1d6ec2;--vy-air:#2b7cc0;--vy-ga:48%;--vy-gb:22%}
body[data-lens="anatomy"]{--vy-col:var(--vy-air)}
.vy-ida{--c:var(--vy-ida)}.vy-pin{--c:var(--vy-pin)}.vy-col{--c:var(--vy-col)}
.vy-w,.vy-n,.vy-f{--cl:color-mix(in srgb,var(--c) var(--vy-chroma,100%),var(--anatomy-mid))}
.vy-col,.vy-f.vy-col{--cl:var(--c)}
.vy-w [data-v="off"] .iso-edge,.vy-n [data-v="off"] .iso-edge{stroke:color-mix(in srgb,var(--cl) 42%,var(--anatomy-mid))}
.vy-w [data-v="on"] .iso-edge,.vy-n [data-v="on"] .iso-edge{stroke:var(--cl)}
.vy-w [data-v="on"] .iso-solid[data-lit]>.iso-top,.vy-n [data-v="on"] .iso-solid[data-lit]>.iso-top{fill:color-mix(in srgb,var(--cl) 16%,var(--anatomy-lit-top))}
.vy-w [data-v="on"] .iso-solid[data-lit]>.iso-shade,.vy-n [data-v="on"] .iso-solid[data-lit]>.iso-shade{fill:color-mix(in srgb,var(--cl) 10%,var(--anatomy-lit-shade))}
.vy-w [data-v="on"]{filter:drop-shadow(0 0 2.4px color-mix(in srgb,var(--cl) var(--vy-ga),transparent))}
.vy-n [data-v="on"]{filter:drop-shadow(0 0 calc(1px + 3px * var(--vy-br,.5)) color-mix(in srgb,var(--cl) var(--vy-ga),transparent))}
.vy-w .iso-line[data-tone="lit"],.vy-f .iso-line{stroke:var(--cl)}
.vy-f .iso-wire[data-tone] .iso-wire-end{stroke:var(--cl)}
.vy-f{filter:drop-shadow(0 0 1.6px color-mix(in srgb,var(--cl) var(--vy-ga),transparent))}
.vy-w [data-ribs]{filter:drop-shadow(0 0 1.2px color-mix(in srgb,var(--cl) var(--vy-gb),transparent))}
.vy-air .iso-edge,.vy-air .iso-line[data-tone="lit"]{stroke:var(--vy-air)}
.vy-air .iso-solid[data-lit]>.iso-top{fill:color-mix(in srgb,var(--vy-air) 18%,var(--anatomy-lit-top))}
.vy-air .iso-solid[data-lit]>.iso-shade{fill:color-mix(in srgb,var(--vy-air) 12%,var(--anatomy-lit-shade))}
.vy-air{filter:drop-shadow(0 0 calc(.6px + 2.6px * var(--vy-br,.5)) color-mix(in srgb,var(--vy-air) var(--vy-ga),transparent))}
.iso-swatch.vy-key path{stroke:var(--vy-prana)}
</style>`;

// ---- parts -------------------------------------------------------------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 22))) {
    out.push(S(k.cylinder(x, y, 7.5, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.8, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(BASE, -BASE_H + 4, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(BASE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  return out.join("");
}

function labelPlate() {
  const plan = { x: -96, y: 21, w: 34, d: 18, r: 1.4 };
  return [
    S(k.slabOf(plan, 0, 0.8, P, 4), { tone: "lo", crease: "none" }),
    L(k.planOutline(k.insetPlan(plan, 1.6), 0.8, P, 4), { tone: "faint" }),
    k.faceTextSvg(k.topMatrix([plan.x + 4, plan.y + 7.5], 0.8, P, "x"), "ஐந்து வாயு", { size: 4, tone: "mid" }),
    L(k.lineOnTop([plan.x + 4, plan.y + 11.5], [plan.x + 28, plan.y + 11.5], 0.8, P), { tone: "lo", free: true }),
    L(k.lineOnTop([plan.x + 4, plan.y + 14.5], [plan.x + 19, plan.y + 14.5], 0.8, P), { tone: "lo", free: true }),
    D([at([plan.x + 2.4, plan.y + 2.4, 0.8]), at([plan.x + plan.w - 2.4, plan.y + plan.d - 2.4, 0.8])], { size: 0.42 }),
  ].join("");
}

// a machinist's height gauge: its scriber points at the wind being read
function heightGauge() {
  const out = [];
  const foot = { x: GX - 12, y: -12, w: 24, d: 24, r: 2.4 };
  out.push(`<path class="iso-halo" d="${k.haloOf(foot, 0, 8, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(foot, 0, 8, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(foot, 3, P, 4), { tone: "faint" }) }));
  out.push(D(k.corners(foot, 2.6).map(([x, y]) => at([x, y, 8])), { size: 0.45 }));
  // fine-adjust knob on the foot
  out.push(S(k.cylinder(GX + 7, 6.5, 2.8, 8, 3, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(GX + 7, 6.5, 2.8, 8, 11, 16, P), { tone: "lo" }));
  out.push(L(k.lineOnTop([GX + 7, 6.5], [GX + 9.2, 6.5], 11, P), { tone: "hi" }));
  // beam with its scale on the front face, ticks rooted on the left silhouette edge
  const ticks = { minor: [], major: [] };
  for (let z = 15, n = 0; z <= BEAM_TOP - 6; z += 5, n++) {
    const big = n % 5 === 0;
    (big ? ticks.major : ticks.minor).push(k.segment([BEAM.x, BEAM.y + BEAM.d, z], [BEAM.x + (big ? 3.4 : 1.8), BEAM.y + BEAM.d, z], P));
  }
  out.push(S(k.slabOf(BEAM, 8, BEAM_TOP - 8, P, 2), { tone: "mid", crease: "faint", inner: L(ticks.minor.join(""), { tone: "lo" }) + L(ticks.major.join(""), { tone: "mid" }) }));
  return out.join("");
}

function beamCap() {
  const cap = { x: GX - 4, y: -4, w: 8, d: 8, r: 1 };
  return [S(k.slabOf(cap, BEAM_TOP, 2.2, P, 3, 0.3), { tone: "mid" }), D([at([GX, 0, BEAM_TOP + 2.2])], { size: 0.5 })].join("");
}

// the slider, built at the first stop and moved up and down the beam
function slider() {
  const z = STOPS[0];
  const out = [];
  out.push(S(k.slabOf(SLIDER, z - 5, 10, P, 3, 0.5), { tone: "hi", crease: "lo", inner: L(k.sideSeam(SLIDER, z - 1.5, P, 3), { tone: "faint" }) }));
  out.push(D([at([SLIDER.x + 1.6, SLIDER.y + 1.6, z + 5]), at([SLIDER.x + SLIDER.w - 1.6, SLIDER.y + SLIDER.d - 1.6, z + 5])], { size: 0.42 }));
  // lock screw on the front face
  const F = G.frameAlong([GX - 1.5, SLIDER.y + SLIDER.d, z], [0, 1, 0]);
  out.push(S(G.disc(0, 1.4, 1.5, F, P), { tone: "mid" }));
  out.push(S(G.disc(1.4, 3.6, 2.6, F, P), { tone: "mid" }));
  out.push(L(G.circleOf(F, 3.6, 1.6, P), { tone: "lo" }));
  // arm and scriber
  out.push(S(k.slabOf({ x: SLIDER.x + SLIDER.w, y: -1.6, w: ARM_END - SLIDER.x - SLIDER.w, d: 3.2, r: 0.6 }, z - 1.6, 3.2, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(SLIDER.x + SLIDER.w + 4, 0, 1.5, z + 1.6, 1.4, P, 14), { tone: "mid" }));
  out.push(S(k.extrude([[ARM_END, -1.6], [ARM_END + 7, 0], [ARM_END, 1.6]], z - 1, 2, P), { tone: "hi", lit: true }));
  return `<g data-part="slider">${out.join("")}</g>`;
}

function bed() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BED, 0, BED_H, P)}" style="filter:blur(5px)"/>`];
  out.push(S(k.slabOf(BED, 0, BED_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(BED, 3.5, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BED, 3), BED_H, P, 4), { tone: "faint" }));
  out.push(D(k.corners(BED, 6).map(([x, y]) => at([x, y, BED_H])), { size: 0.45 }));
  // the bellows' air intake: a grille of closed slots in the bed top
  const slots = [];
  for (let i = 0; i < 6; i++) slots.push(k.planOutline({ x: 22 + i * 4.2, y: -21, w: 2, d: 14, r: 1 }, BED_H, P, 3));
  out.push(L(slots.join(""), { tone: "lo" }));
  out.push(L(k.planOutline({ x: 19, y: -24, w: 29, d: 20, r: 2 }, BED_H, P, 3), { tone: "faint" }));
  return out.join("");
}

// one bellows guide post with its collars
function post(sx, sy) {
  const x = TX + sx * POST, y = TY + sy * POST;
  return [
    S(k.cylinder(x, y, 2.8, BED_H, 1.5, P, 20), { tone: "lo" }),
    S(k.cylinder(x, y, 1.6, BED_H + 1.5, TOPP_Z - BED_H - 3, P, 16), { tone: "mid", crease: "none" }),
    S(k.cylinder(x, y, 2.8, TOPP_Z - 1.5, 1.5, P, 20), { tone: "lo" }),
  ].join("");
}

// the bushing that rides the post, and the lug that ties it to the moving plate
function bushing(sx, sy) {
  const x = TX + sx * POST, y = TY + sy * POST;
  const lx = TX + sx * 14.1, ly = TY + sy * 14.1;
  const lug = S(k.cylinder(lx, ly, 1.4, ZP0 + 0.5, 2, P, 14), { tone: "mid", crease: "none" });
  const bush = [S(k.cylinder(x, y, 2.6, ZP0 - 0.5, 4, P, 20), { tone: "hi", crease: "lo" }), D([at([x, y, ZP0 + 3.5])], { size: 0.4 })].join("");
  // the lug is behind the bushing for the far posts and in front for the near one
  return `<g data-move="plate">${sx + sy > 0 ? lug + bush : bush + lug}</g>`;
}

function movingPlate() {
  return `<g data-move="plate">${S(k.slabOf(MP, ZP0, MP_H, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(MP, ZP0 + 1.2, P, 3), { tone: "faint" }) })}</g>`;
}

// anatomy: the diaphragm, a dome that flattens downward when it contracts
function dome() {
  const F = G.frameAlong([TX, TY, ZP0 + MP_H], [0, 0, 1]);
  const prof = [[0, 12.6], [0.8, 12.6], [1.7, 12.2, 1], [3.2, 10.9, 1], [4.7, 8.7, 1], [6, 5.8, 1], [6.9, 2.9, 1], [7.3, 0]];
  return `<g data-move="plate" data-dome class="vy-air" opacity="0">${S(G.solidOf(prof, F, P), { tone: "hi", lit: true })}</g>`;
}

function topPlate() {
  return [
    S(k.slabOf(TOPP, TOPP_Z, TOPP_H, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(TOPP, TOPP_Z + 2, P, 4), { tone: "faint" }) }),
    L(k.ring(TX, TY, COL_R + 2.2, TOP_Z, P, 32), { tone: "lo" }),
    D([-1, 1].flatMap((sx) => [-1, 1].map((sy) => at([TX + sx * POST, TY + sy * POST, TOP_Z]))), { size: 0.45 }),
  ].join("");
}

// one horizontal port on a chamber wall, pointing along floor angle a
const vari = (i, make) => `<g data-ch="${i}"><g data-v="off">${make(false)}</g><g data-v="on" style="display:none">${make(true)}</g></g>`;

function port(c, a, { collar, pipe, lip, len }, lit) {
  const z = c.z0 + c.h / 2;
  const [x, y] = polar(c.R, a);
  const F = G.frameAlong([x, y, z], [Math.cos(a), Math.sin(a), 0]);
  return [
    S(G.disc(-0.4, 1.2, collar, F, P), { tone: "mid" }),
    S(G.disc(1.2, len, pipe, F, P), { tone: lit ? "hi" : "mid", crease: lit ? "lo" : "faint", lit }),
    S(G.disc(len, len + 1, lip, F, P), { tone: "mid" }),
  ].join("");
}

// a flow wire along the top of a port, outward or inward
function portFlow(c, a, { pipe, len }, inward) {
  const z = c.z0 + c.h / 2 + pipe;
  const p0 = polar(c.R + 1.6, a), p1 = polar(c.R + len - 0.4, a);
  const [from, to] = inward ? [p1, p0] : [p0, p1];
  return k.wireSvg(at([...from, z]), at([...to, z]), { tone: "lit", flow: true, ends: "to", size: 0.7 });
}

// side ports turn 12° toward the viewer so their end faces never sit exactly edge-on
const SIDE = Math.PI / 2 - 0.21;
const VYANA_PORTS = [PHI + Math.PI * (5 / 6), PHI - Math.PI * (5 / 6), PHI + SIDE, PHI - SIDE, PHI + Math.PI / 6, PHI - Math.PI / 6];
const VYANA_SIZE = { collar: 2.8, pipe: 1.8, lip: 2.4, len: 6.5 };
const PRANA_PORTS = [PHI + SIDE, PHI - SIDE];
const PRANA_SIZE = { collar: 3.4, pipe: 2.3, lip: 3.2, len: 7.5 };
const STUB = polar(10.5, PHI);
const SAM_R0 = 11.4, SAM_R1 = 14.4; // apana's downspout and udana's riser sit here, toward the viewer

function chamberBody(c, lit) {
  const top = c.z0 + c.h;
  const bodyH = c.h - 2.8;
  return [
    S(k.cylinder(TX, TY, c.R + 1.2, c.z0, 1.4, P, 56), { tone: "mid" }),
    S(k.cylinder(TX, TY, c.R, c.z0 + 1.4, bodyH, P, 64), { tone: lit ? "hi" : "mid", crease: lit ? "lo" : "faint", lit, inner: L(k.sideArc(TX, TY, c.R, c.z0 + 1.4 + bodyH / 2, P, 48), { tone: "faint" }) }),
    S(k.cylinder(TX, TY, c.R + 1.2, top - 1.4, 1.4, P, 56, 0.4), { tone: "mid" }),
    D(ringDots(TX, TY, c.R + 0.55, top, 12, 0.13), { size: 0.4 }),
  ].join("");
}

function chamber(i) {
  const c = WINDS[i];
  const top = c.z0 + c.h;
  const back = [], front = [];
  const ports = c.id === "vyana" ? [VYANA_PORTS, VYANA_SIZE] : c.id === "prana" ? [PRANA_PORTS, PRANA_SIZE] : null;
  const flows = [];
  if (ports) {
    for (const a of ports[0]) (facing(a) < -0.01 ? back : front).push(vari(i, (lit) => port(c, a, ports[1], lit)));
    for (const a of ports[0]) flows.push(portFlow(c, a, ports[1], c.id === "prana"));
  }
  let face = "";
  if (c.id === "samana") {
    // inward swirl: two rings on the top flange, ribs between them turn, a spiral flows in
    face += L(k.ring(TX, TY, SAM_R0, top, P, 48), { tone: "lo" }) + L(k.ring(TX, TY, SAM_R1, top, P, 48), { tone: "lo" });
    face += `<g data-ribs></g>`;
    const spiral = [];
    for (let t = 0; t <= 1.0001; t += 1 / 60) spiral.push([TX + Math.cos(PHI + 1 + t * 3 * Math.PI) * (SAM_R1 - (SAM_R1 - SAM_R0) * t), TY + Math.sin(PHI + 1 + t * 3 * Math.PI) * (SAM_R1 - (SAM_R1 - SAM_R0) * t)]);
    flows.push(L(k.onTop(spiral, top, P), { tone: "lit", flow: true }));
  }
  const body = vari(i, (lit) => chamberBody(c, lit));
  return {
    svg: `<g data-dim="w" class="vy-w" style="--c:var(--vy-${c.id})">${back.join("")}${body}${face}${front.join("")}</g>`,
    flows: flows.length ? `<g data-wflow="${i}" class="vy-f" style="--c:var(--vy-${c.id})" opacity="0">${flows.join("")}</g>` : "",
  };
}

// the column and the two side tubes in the gap between two chambers
function gap(za, zb, index) {
  const tube = (x, r, tone, lit, inner = "") => S(k.cylinder(x, TY, r, za, zb - za, P, r > 3 ? 32 : 16), { tone, crease: "faint", lit, inner });
  const seam = zb - za > 7 ? L(k.sideArc(TX, TY, COL_R, (za + zb) / 2, P, 20), { tone: "faint" }) : "";
  const both = (name, off, on) => `<g data-tube="${name}" class="vy-n vy-${name}"><g data-v="off">${off}</g><g data-v="on" style="display:none">${on}</g></g>`;
  const items = [
    { at: [TX, TY], svg: both("col", tube(TX, COL_R, "mid", false, seam), tube(TX, COL_R, "hi", true, seam)), r: COL_R, flow: "col" },
    { at: [TX - NADI_OFF, TY], svg: `<g data-dim="n">${both("ida", tube(TX - NADI_OFF, NADI_R, "mid", false), tube(TX - NADI_OFF, NADI_R, "hi", true))}</g>`, r: NADI_R, flow: "ida" },
    { at: [TX + NADI_OFF, TY], svg: `<g data-dim="n">${both("pin", tube(TX + NADI_OFF, NADI_R, "mid", false), tube(TX + NADI_OFF, NADI_R, "hi", true))}</g>`, r: NADI_R, flow: "pin" },
  ];
  const out = [];
  for (const it of byDepth(items.map((it) => [...it.at, it])).map((p) => p[2])) {
    out.push(it.svg);
    // on the front generator, from rim to rim, so both ends sit on the tube's own outline
    const fx = it.at[0] + VIEW[0] * it.r, fy = it.at[1] + VIEW[1] * it.r;
    const down = L(k.segment([fx, fy, zb], [fx, fy, za], P), { tone: "lit", flow: true });
    const up = L(k.segment([fx, fy, za], [fx, fy, zb], P), { tone: "lit", flow: true });
    out.push(`<g class="vy-f vy-${it.flow}"><g data-nflow="${it.flow}-down" opacity="0">${down}</g><g data-nflow="${it.flow}-up" opacity="0">${up}</g></g>`);
  }
  // apana's downspout hangs into the lowest gap; udana's riser stands in the highest
  if (index === 0) {
    const c = WINDS[0];
    out.push(`<g data-dim="w" class="vy-w" style="--c:var(--vy-apana)">${vari(0, (lit) => S(k.cylinder(STUB[0], STUB[1], 1.9, c.z0 - 5, 5, P, 16), { tone: lit ? "hi" : "mid", lit, inner: L(k.sideArc(STUB[0], STUB[1], 1.9, c.z0 - 2.4, P, 12), { tone: "faint" }) }))}${S(k.cylinder(STUB[0], STUB[1], 1.3, c.z0 - 6.2, 1.2, P, 14), { tone: "lo" })}</g>`);
    out.push(`<g data-wflow="0" class="vy-f" style="--c:var(--vy-apana)" opacity="0">${k.wireSvg(at([STUB[0], STUB[1], c.z0 - 6.4]), at([STUB[0], STUB[1], TOP_Z + 0.2]), { tone: "lit", flow: true, ends: "to", size: 0.7 })}</g>`);
  }
  if (index === GAPS.length - 1) {
    const c = WINDS[4];
    const top = c.z0 + c.h;
    out.push(`<g data-dim="w" class="vy-w" style="--c:var(--vy-udana)">${vari(4, (lit) => S(k.cylinder(STUB[0], STUB[1], 1.9, top, 3, P, 16), { tone: lit ? "hi" : "mid", lit }))}${S(k.cylinder(STUB[0], STUB[1], 1.3, top + 3, 1.2, P, 14), { tone: "lo" })}</g>`);
    out.push(`<g data-wflow="4" class="vy-f" style="--c:var(--vy-udana)" opacity="0">${k.wireSvg(at([STUB[0], STUB[1], top + 4.3]), at([STUB[0], STUB[1], HEAD_Z - 1.7]), { tone: "lit", flow: true, ends: "from", size: 0.7 })}</g>`);
  }
  return out.join("");
}

function headBody(lit) {
  const flange = k.insetPlan(HEAD, -1);
  return [
    S(k.slabOf(flange, HEAD_Z - 1.5, 1.5, P, 6), { tone: "mid" }),
    S(k.slabOf(HEAD, HEAD_Z, HEAD_H, P, 6, 0.5), { tone: "hi", crease: "lo", lit, inner: L(k.sideSeam(HEAD, HEAD_Z + 2.6, P, 6), { tone: "faint" }) }),
  ].join("");
}

// the nose: two nozzles, a back rail between two end stops, and the sliding gate
function head() {
  const out = [`<g class="vy-w" style="--c:var(--vy-col)">${vari(5, headBody)}</g>`];
  out.push(D([[HEAD.x + 3, HEAD.y + HEAD.d - 3], [HEAD.x + HEAD.w - 3, HEAD.y + 3]].map(([x, y]) => at([x, y, NOZ_Z])), { size: 0.42 }));
  const parts = [];
  const rail = { x: TX - STOP_X, y: -7.4, w: STOP_X * 2, d: 2.4, r: 0.6 };
  parts.push({ at: [TX, -6.2], svg: S(k.slabOf(rail, NOZ_Z + NOZ_H - 1, 1, P, 2), { tone: "lo" }) });
  for (const sx of [-1, 1]) {
    const x = TX + sx * STOP_X;
    parts.push({ at: [x, -6.2], svg: S(k.cylinder(x, -6.2, 1.4, NOZ_Z, NOZ_H + 3.4, P, 14), { tone: "mid" }) + D([at([x, -6.2, NOZ_Z + NOZ_H + 3.4])], { size: 0.4 }) });
  }
  for (const sx of [-1, 1]) {
    const x = TX + sx * NADI_OFF;
    const mouth = k.cylinder(x, TY, 2.2, NOZ_Z + NOZ_H + 0.99, 0.01, P, 28).fill;
    parts.push({
      at: [x, TY],
      svg: [
        S(k.cylinder(x, TY, 2.6, NOZ_Z, NOZ_H, P, 28), { tone: "hi", crease: "lo", inner: L(k.sideArc(x, TY, 2.6, NOZ_Z + 1.6, P, 20), { tone: "faint" }) }),
        S(k.cylinder(x, TY, 3.3, NOZ_Z + NOZ_H, 1, P, 28), { tone: "mid" }),
        `<path class="iso-shade" data-shade="0" d="${mouth}"/>`,
        L(k.ring(x, TY, 2.2, NOZ_Z + NOZ_H + 1, P, 28), { tone: "lo" }),
      ].join(""),
    });
  }
  for (const p of byDepth(parts.map((p) => [...p.at, p])).map((p) => p[2])) out.push(p.svg);
  return out.join("");
}

function gate() {
  const plan = { x: TX - GATE.w / 2, y: -7.6, w: GATE.w, d: GATE.d, r: 1.2 };
  return `<g data-part="gate">${[
    S(k.slabOf(plan, GATE_Z, 1.8, P, 3, 0.4), { tone: "mid", crease: "lo" }),
    S(k.cylinder(TX, plan.y + plan.d - 2.6, 1.3, GATE_Z + 1.8, 1.6, P, 14), { tone: "mid" }),
    D([at([plan.x + 1.6, plan.y + 1.6, GATE_Z + 1.8]), at([plan.x + plan.w - 1.6, plan.y + 1.6, GATE_Z + 1.8])], { size: 0.4 }),
  ].join("")}</g>`;
}

// tidal volume gauge: face-up dial reading 0–600 mL
const DIAL_FROM = -0.75 * Math.PI;
const DIAL_SPAN = 1.5 * Math.PI;
// the instrument housing the volume dial stands on: banded box, vents on its front face, screws
function housing() {
  const out = [`<path class="iso-halo" d="${k.haloOf(HOUSE, BED_H, 30, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(HOUSE, BED_H, HOUSE_TOP - BED_H, P, 4, 0.7), { tone: "mid", inner: L(k.sideSeam(HOUSE, BED_H + 4, P, 4) + k.sideSeam(HOUSE, HOUSE_TOP - 4, P, 4), { tone: "faint" }) }));
  const yf = HOUSE.y + HOUSE.d;
  const vents = [];
  for (let i = 0; i < 5; i++) {
    const z = BED_H + 8 + i * 3.4;
    vents.push(k.pathOf([[HOUSE.x + 8, yf, z], [HOUSE.x + HOUSE.w - 8, yf, z], [HOUSE.x + HOUSE.w - 8, yf, z + 1.6], [HOUSE.x + 8, yf, z + 1.6]].map((p) => at(p)), true));
  }
  out.push(L(vents.join(""), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(HOUSE, 2.4), HOUSE_TOP, P, 4), { tone: "faint" }));
  out.push(D(k.corners(HOUSE, 3.4).map(([x, y]) => at([x, y, HOUSE_TOP])), { size: 0.45 }));
  return out.join("");
}

function volumeDial() {
  const { x, y, r } = DIAL;
  const z0 = HOUSE_TOP + 4;
  const top = z0 + DIAL_H;
  const out = [];
  out.push(housing());
  out.push(S(k.cylinder(x, y, 7, HOUSE_TOP, 4, P, 32), { tone: "lo" }));
  // crown on the far side
  const cx = x + Math.cos(PHI + Math.PI * 0.62) * (r + 1.6), cy = y + Math.sin(PHI + Math.PI * 0.62) * (r + 1.6);
  out.push(S(k.cylinder(cx, cy, 1.9, top - 5, 3.4, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, r, z0, DIAL_H, P, 72, 0.8), { tone: "hi", crease: "lo", inner: L(k.knurl(x, y, r, top - 3, top, 84, P, 0.3), { tone: "lo" }) + L(k.sideArc(x, y, r, top - 3, P, 48), { tone: "faint" }) }));
  out.push(L(k.ring(x, y, r - 2, top, P, 64), { tone: "lo" }));
  const t = k.radialTicks(x, y, r - 2, 30, 5, top, [1.2, 2.6], P, DIAL_FROM, DIAL_SPAN);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(L(k.ring(x, y, 1.5, top, P, 16), { tone: "lo" }));
  out.push(`<g data-needle="vol" class="vy-air"></g>`);
  out.push(D([at([x, y, top])], { size: 0.6 }));
  return out.join("");
}

// nasal cycle dial: a half scale, left to right
function nasalDial() {
  const { x, y, r } = NDIAL;
  const top = DIAL_Z + NDIAL_H;
  const out = [];
  out.push(S(k.cylinder(x, y, 4, BED_H, 4, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, r, DIAL_Z, NDIAL_H, P, 48, 0.6), { tone: "hi", crease: "lo", inner: L(k.knurl(x, y, r, top - 2, top, 40, P, 0.3), { tone: "lo" }) }));
  out.push(L(k.ring(x, y, r - 1.4, top, P, 48), { tone: "lo" }));
  const t = k.radialTicks(x, y, r - 1.4, 10, 5, top, [1, 2], P, -Math.PI / 2, Math.PI);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(`<g data-needle="nasal"></g>`);
  out.push(D([at([x, y, top])], { size: 0.5 }));
  return out.join("");
}

// ---- assemble, back to front -------------------------------------------
const body = [base(), labelPlate(), heightGauge(), slider(), beamCap(), bed()];
// bellows: far post, side posts, plate, dome, pleats, near post, top plate
const corners = [[-1, -1], [1, -1], [-1, 1]];
for (const [sx, sy] of corners) body.push(post(sx, sy), bushing(sx, sy));
body.push(movingPlate(), dome(), `<g data-pleats></g>`, post(1, 1), bushing(1, 1), topPlate());
const flowsAfter = [];
GAPS.forEach(([za, zb], g) => {
  body.push(gap(za, zb, g));
  if (g < WINDS.length) {
    const c = chamber(g);
    body.push(c.svg, c.flows);
  }
});
body.push(head(), gate(), nasalDial(), volumeDial());

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A standing pneumatic tower on a bench. A bellows at its base breathes in and out; above it a central column with two thin side tubes carries five round chambers, one for each wind: apana with a downspout, samana with a turning swirl, vyana with six outward ports, prana with two intake ports, udana with an upward riser. On top, two nozzles share a sliding gate. A height gauge at left points at the chosen wind, and two dials on the bench read breath volume and which nozzle is open. In the anatomy lens the bellows becomes a domed diaphragm, the column becomes the airway, and the chambers and side tubes go dim.",
  body,
});

// ---- live --------------------------------------------------------------
const live = `
${LENS_JS}
const P = ${JSON.stringify(P)};
const W = ${JSON.stringify(WINDS.map(({ id, sa, ta, seat, dir, fn, real }) => ({ id, sa, ta, seat, dir, fn, real })))};
const STOPS = ${JSON.stringify(STOPS)};
const STOP_Y = ${JSON.stringify(STOPS.map((z) => at([TX, TY, z])[1]))};
const B = ${JSON.stringify(BREATH)};
const NASAL_S = ${NASAL_S};
const HEIGHT = ${HEIGHT};
const ZP_OUT = ${ZP_OUT}, ZP_IN = ${ZP_IN}, ZP0 = ${ZP0}, MP_TOP = ${MP_H}, TOPP_Z = ${TOPP_Z};
const TX = ${TX}, TY = ${TY}, GATE_TRAVEL = ${GATE_TRAVEL};
const DIAL = ${JSON.stringify({ ...DIAL, z: HOUSE_TOP + 4 + DIAL_H, from: DIAL_FROM, span: DIAL_SPAN })};
const NDIAL = ${JSON.stringify({ ...NDIAL, z: DIAL_Z + NDIAL_H })};
const SAM = ${JSON.stringify({ z: WINDS[1].z0 + WINDS[1].h, r0: SAM_R0, r1: SAM_R1 })};
const PLEATS = ${PLEATS.toString()};
const K = { slabOf, solidSvg };
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (s) => svg.querySelector(s);
const qa = (s) => [...svg.querySelectorAll(s)];
const readout = document.querySelector("[data-readout]");
const sliderEl = q('[data-part="slider"]');
const gateEl = q('[data-part="gate"]');
const plateEls = qa('[data-move="plate"]');
const domeEl = q("[data-dome]");
const pleatsEl = q("[data-pleats]");
const ribsEl = q("[data-ribs]");
const volNeedle = q('[data-needle="vol"]');
const nasNeedle = q('[data-needle="nasal"]');
const chambers = qa("[data-ch]");
const wflows = [0, 1, 2, 3, 4].map((i) => qa('[data-wflow="' + i + '"]'));
const nflow = {};
["col", "ida", "pin"].forEach((n) => ["down", "up"].forEach((d) => (nflow[n + "-" + d] = qa('[data-nflow="' + n + "-" + d + '"]'))));
const dimW = qa('[data-dim="w"]');
const tubes = qa("[data-tube]");
const breathers = [...tubes, ...qa(".vy-air")];
const dimN = qa('[data-dim="n"]');
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
let lens = "tradition", sel = 3, selZ = STOPS[3], clock = 1.2, nasalClock = NASAL_S * 0.08, lensAt = 0, frame = 0, last = 0, touring = true, tourAt = 0, visible = false, idle = 0, lastSel = -1;
const setAttr = (el, name, value) => { if (el && el["_" + name] !== value) { el.setAttribute(name, value); el["_" + name] = value; } };
const setHtml = (el, html) => { if (el && el._h !== html) { el.innerHTML = html; el._h = html; } };
// breath: volume above the resting level, mL, and whether we are breathing in
function breath(t) {
  const p = ((t % B.period) + B.period) % B.period / B.period;
  if (p < B.inhale) return { v: B.tidal * (1 - Math.cos(Math.PI * p / B.inhale)) / 2, inhale: true };
  return { v: B.tidal * (1 + Math.cos(Math.PI * (p - B.inhale) / (1 - B.inhale))) / 2, inhale: false };
}
// nasal dominance: +1 left side open (ida), −1 right side open (pingala)
const nasal = (t) => Math.sin(2 * Math.PI * t / NASAL_S);
function needle(cx, cy, z, r, angle, tone, tail) {
  const sx = Math.sin(angle), sy = -Math.cos(angle);
  return lineSvg(lineOnTop([cx - sx * tail, cy - sy * tail], [cx + sx * r, cy + sy * r], z, P), { tone, free: true });
}
function draw() {
  // what the figure shows follows the slider, not the target: the nearest stop to where it is
  let shown = 0;
  STOPS.forEach((z, i) => { if (Math.abs(z - selZ) < Math.abs(STOPS[shown] - selZ)) shown = i; });
  const b = still.matches ? { v: B.tidal * 0.55, inhale: true } : breath(clock);
  const d = still.matches ? 0.75 : nasal(nasalClock);
  const zp = ZP_OUT - (ZP_OUT - ZP_IN) * b.v / B.tidal;
  const plateT = translateAlong(P, [0, 0, zp - ZP0]);
  // glow strength follows the breath; colour drains to grey toward the anatomy lens
  const br = (Math.round((b.v / B.tidal) * 20) / 20).toFixed(2);
  breathers.forEach((el) => { if (el._br !== br) { el._br = br; el.style.setProperty("--vy-br", br); } });
  const chroma = Math.round((1 - lensAt) * 100) + "%";
  if (svg._chroma !== chroma) { svg._chroma = chroma; svg.style.setProperty("--vy-chroma", chroma); }
  plateEls.forEach((el) => setAttr(el, "transform", plateT));
  setHtml(pleatsEl, PLEATS(zp + MP_TOP, TOPP_Z, TX, TY, P, K));
  setAttr(pleatsEl, "opacity", String(Math.round((1 - lensAt) * 100) / 100));
  setAttr(domeEl, "opacity", String(Math.round(lensAt * 100) / 100));
  setAttr(sliderEl, "transform", translateAlong(P, [0, 0, selZ - STOPS[0]]));
  setAttr(gateEl, "transform", translateAlong(P, [GATE_TRAVEL * d, 0, 0]));
  const dimV = String(Math.round((1 - 0.72 * lensAt) * 100) / 100);
  dimW.forEach((el) => setAttr(el, "opacity", dimV));
  dimN.forEach((el) => setAttr(el, "opacity", dimV));
  // lit chamber: the selected wind, in the tradition lens only
  chambers.forEach((el) => {
    const on = lens === "tradition" && Number(el.dataset.ch) === shown;
    if (el._on !== on) { el._on = on; el.children[0].style.display = on ? "none" : ""; el.children[1].style.display = on ? "" : "none"; }
  });
  wflows.forEach((list, i) => {
    let on = lens === "tradition" && i === shown ? 1 : 0;
    if (i === 3 && !b.inhale) on = 0;
    list.forEach((el) => setAttr(el, "opacity", String(on)));
  });
  // nadi flow: the open side in the tradition, the central channel when balanced; the airway in anatomy
  const dir = b.inhale ? "down" : "up";
  const balanced = Math.abs(d) < 0.2;
  const want = { col: lens === "anatomy" || balanced, ida: lens === "tradition" && !balanced && d > 0, pin: lens === "tradition" && !balanced && d < 0 };
  tubes.forEach((el) => {
    const on = want[el.dataset.tube];
    if (el._on !== on) { el._on = on; el.children[0].style.display = on ? "none" : ""; el.children[1].style.display = on ? "" : "none"; }
  });
  for (const key in nflow) {
    const [n, way] = key.split("-");
    const on = want[n] && way === dir && !still.matches ? "1" : (want[n] && still.matches && way === "down" ? "1" : "0");
    nflow[key].forEach((el) => setAttr(el, "opacity", on));
  }
  // samana's turning ribs
  const spin = still.matches ? 0 : clock * 0.7;
  let ribs = "";
  for (let i = 0; i < 12; i++) {
    const a = spin + (i / 12) * Math.PI * 2;
    ribs += lineOnTop([TX + Math.cos(a) * SAM.r0, TY + Math.sin(a) * SAM.r0], [TX + Math.cos(a + 0.22) * SAM.r1, TY + Math.sin(a + 0.22) * SAM.r1], SAM.z, P);
  }
  setHtml(ribsEl, lineSvg(ribs, { tone: lens === "tradition" && shown === 1 ? "lit" : "lo" }));
  // dials
  const va = DIAL.from + DIAL.span * clamp(b.v / 600, 0, 1);
  setHtml(volNeedle, needle(DIAL.x, DIAL.y, DIAL.z + 0.2, DIAL.r - 3.4, va, lens === "anatomy" ? "lit" : "hi", 2.4));
  setHtml(nasNeedle, needle(NDIAL.x, NDIAL.y, NDIAL.z + 0.2, NDIAL.r - 2.2, -d * Math.PI / 2 * 0.9, "hi", 1.4));
  // readout
  const vol = Math.round(b.v / 10) * 10;
  const side = d > 0.2 ? "left" : d < -0.2 ? "right" : "even";
  let text;
  if (lens === "tradition") {
    if (shown < 5) { const w = W[shown]; text = w.ta + " " + w.sa + " · " + w.seat + " · " + w.dir + " · " + w.fn; }
    else text = side === "left" ? "இடகலை Ida · left · lunar, cooling" : side === "right" ? "பிங்கலை Pingala · right · solar, heating" : "சுழுமுனை Sushumna · sides even · centre";
  } else {
    if (shown === 5) text = "nasal cycle · " + (side === "even" ? "both sides even" : side + " side more open");
    else if (shown === 3) text = (b.inhale ? "inhale · " : "exhale · ") + vol + " of ≈" + B.tidal + " mL · " + B.perMin + "/min";
    else text = "no " + W[shown].id + " channel · " + W[shown].real + " · " + (b.inhale ? "inhale " : "exhale ") + vol + " mL";
  }
  if (readout.textContent !== text) readout.textContent = text;
  if (lastSel !== sel) {
    lastSel = sel;
    const name = sel < 5 ? W[sel].sa : "the nose and three nadis";
    stage.setAttribute("aria-valuenow", String(sel));
    stage.setAttribute("aria-valuetext", name);
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (!calm) { clock += dt; nasalClock += dt; }
  if (touring && !calm) { tourAt += dt; if (tourAt > 3.2) { tourAt = 0; sel = (sel + 1) % STOPS.length; } }
  const ease = calm ? 1 : 1 - Math.exp(-dt / 0.28);
  selZ += (STOPS[sel] - selZ) * ease;
  if (Math.abs(STOPS[sel] - selZ) < 0.01) selZ = STOPS[sel];
  const lw = lens === "anatomy" ? 1 : 0;
  lensAt += (lw - lensAt) * (calm ? 1 : 1 - Math.exp(-dt / 0.35));
  if (Math.abs(lw - lensAt) < 0.003) lensAt = lw;
  draw();
  const moving = !calm || selZ !== STOPS[sel] || lensAt !== lw;
  frame = visible && moving ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; sel = clamp(next, 0, STOPS.length - 1); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; tourAt = 0; run(); }, 4200); run(); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (e) => {
  const box = svg.getBoundingClientRect();
  const y = ((e.clientY - box.top) / box.height) * HEIGHT;
  let best = 0;
  STOP_Y.forEach((sy, i) => { if (Math.abs(sy - y) < Math.abs(STOP_Y[best] - y)) best = i; });
  if (best !== sel || touring) steer(best);
});
stage.addEventListener("keydown", (e) => {
  let to = null;
  if (e.key === "ArrowUp" || e.key === "ArrowRight") to = sel + 1;
  if (e.key === "ArrowDown" || e.key === "ArrowLeft") to = sel - 1;
  if (e.key === "Home") to = 0;
  if (e.key === "End") to = STOPS.length - 1;
  if (to === null) return;
  e.preventDefault();
  steer(to);
});
wireLens((id) => { lens = id; run(); });
draw();
`;

const plate = k.plateHtml({
  fig: "Fig 2",
  title: "Pancha Vayu · the five winds",
  hint: "Hover to pick a wind · T / A to switch lens",
  readout: "பிராணன் Prana · chest, head · inward · intake",
  keys: [
    { mark: "lit", label: "The wind picked glows; the diaphragm and airway (anatomy)" },
    { mark: "raised", label: "Five chambers on the central column" },
    { mark: "dotted", label: "Flow: in a nadi, a wind, or the airway" },
  ],
  caption:
    "A bellows at the base breathes; the column above carries five chambers, each showing its wind's direction: apana's downspout, samana's inward swirl, vyana's outward ports, prana's intake, udana's riser. The gate on top slides between the left and right nozzle, and the flow follows the open side. Switch to Anatomy to see what the breathing machinery really is.",
  body: `${VY_CSS}<div class="iso-stage" tabindex="0" role="slider" aria-label="Five-wind tower: arrow keys step through the winds" aria-valuemin="0" aria-valuemax="5" aria-valuenow="3" aria-valuetext="Prana">${svg}</div>`,
});

const html = page({
  title: "Pancha Vayu",
  theme,
  tamil: "ஐந்து வாயுக்கள் · Pancha Vayu",
  lenses: [{ id: "tradition", label: "Tradition" }, { id: "anatomy", label: "Anatomy" }],
  notes: {
    tradition:
      "<b>What the tradition says.</b> Yoga and Ayurveda describe <b>prana</b>, the life-breath, moving in five ways, the <b>pancha vayu</b>: <b>prana</b> draws in at the chest and head; <b>apana</b> moves down and out from the pelvis (elimination, menstruation, birth); <b>samana</b> gathers at the navel and digests; <b>udana</b> rises at the throat (speech and effort, and in the tradition it carries awareness up at death); <b>vyana</b> pervades the whole body, moving outward. Tamil Siddha counts ten vayus, these five and five minor ones. The winds travel in <b>nadis</b>, 72,000 of them in the Hatha Yoga Pradipika. Three matter most: <b>ida</b> (left, cooling, lunar), <b>pingala</b> (right, heating, solar) and <b>sushumna</b>, the central channel along the spine, which the tradition says flows when the two sides are even. This is the tradition's model, drawn as the tradition draws it; vyana has no single seat and is placed mid-column only for the drawing. The wind colours are this figure's choice, since the tradition gives no single scheme; the nadi colours follow its moon (ida, silver-blue) and sun (pingala, red-gold) association, with sushumna gold.",
    anatomy:
      "<b>What anatomy shows.</b> Breathing is driven by the diaphragm, a dome that flattens downward as it contracts, and by the intercostal muscles between the ribs. At rest an adult breathes about 12–20 times a minute and moves about 500 mL each breath (the tidal volume); the figure runs at 12. The nasal cycle is real: in most people congestion shifts slowly between the left and right nostril over a few hours, a physical echo of ida and pingala taking turns (the figure compresses hours into seconds). Breathing out slowly raises vagal (parasympathetic) tone, and the heart slows a little on each exhale (respiratory sinus arrhythmia), a real basis for breath practice calming the body. Reading ida as parasympathetic and pingala as sympathetic is a modern reading, not an equivalence. No channels called nadis or vayus have been found in the body; nadi is a model of practice, which is why the chambers and side tubes go dim and their colours drain to grey.",
  },
  sources:
    "Tradition: Hatha Yoga Pradipika (ida, pingala, sushumna; 72,000 nadis); Charaka Samhita (the five vayus); Tamil Siddha dasa vayu (ten vayus). Anatomy: standard respiratory physiology (resting rate, tidal volume); nasal cycle: Kahana-Zweig et al., PLoS ONE 2016. Values approximate; educational, not medical advice.",
  plate,
  script: kitScript() + live,
});

const out = theme === "light" ? "vayu-light.html" : "vayu.html";
writeFileSync(join(HERE, out), html);
console.log("wrote", out);
