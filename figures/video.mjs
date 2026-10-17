// Records a square social video of one figure: header + lens switch + card, dark theme.
// Frames come from headless Chrome with the page clock frozen per frame (scripts/drive-rec.mjs),
// so motion is smooth regardless of capture speed. Pillars also get synthesized strike tones
// from the same beam model the page uses.
//   node figures/video.mjs <id>   →   video/<id>.mp4
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const id = process.argv[2];
const STEP = 40; // ms of page time per frame → 25 fps
const fr = (s) => Math.round((s * 1000) / STEP);
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// a plan is a list of segments: { s: seconds, before: [drive actions], strike?: colonette index }
const PLANS = {
  dhatu: [
    { s: 0.6, before: [["key", "Home"]] },
    ...Array.from({ length: 37 }, () => ({ s: 0.42, before: [["key", "ArrowRight"]] })),
    { s: 1.2, before: [["key", "a"], ["key", "Home"]] },
    ...Array.from({ length: 6 }, () => ({ s: 1.1, before: [1, 2, 3, 4, 5].map(() => ["key", "ArrowRight"]) })),
  ],
  vayu: [{ s: 11 }, { s: 9, before: [["key", "a"]] }],
  chakra: [{ s: 12 }, { s: 9, before: [["key", "a"]] }],
  kallanai: [{ s: 8 }, { s: 13, before: [["key", "a"]] }],
  pillars: (() => {
    const segs = [{ s: 0.6, before: [["key", "Home"]] }];
    segs.push({ s: 0.75, before: [["key", "Enter"]], strike: 0 });
    for (let i = 1; i <= 7; i++) segs.push({ s: i === 7 ? 1.8 : 0.75, before: [["key", "ArrowRight"], ["key", "Enter"]], strike: i });
    segs.push({ s: 0.8, before: [["key", "a"], ["key", "Home"]] });
    for (const i of [0, 4, 7, 9]) {
      const moves = [["key", "Home"], ...Array.from({ length: i }, () => ["key", "ArrowRight"])];
      segs.push({ s: 2.2, before: [...moves, ["key", "Enter"]], strike: i });
    }
    return segs;
  })(),
};

const plan = PLANS[id];
if (!plan) throw new Error("no plan for " + id);
const page = join(HERE, id, `${id}.html`);
const work = join(ROOT, "video", "work", id);
const encodeOnly = process.argv.includes("--encode");
if (!encodeOnly) rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const hide = `document.querySelectorAll('.iso-legend,.uk-note,.uk-src').forEach(e=>e.style.display='none');document.querySelector('main').style.margin='28px auto 28px';document.head.insertAdjacentHTML('beforeend','<style>.iso-stage:focus,.iso-stage:focus-visible{outline:none!important;box-shadow:none!important}</style>');'ok'`;
// pages whose idle-tour timer runs on real time would resume touring mid-recording (capture is slower
// than page time), so for key-driven plans the timer is switched off
const PRE = { dhatu: "window.setTimeout=function(){return 0};'ok'", pillars: "window.setTimeout=function(){return 0};'ok'" };
const actions = [["eval", hide], ...(PRE[id] ? [["eval", PRE[id]]] : []), ["wait", 1200]];
let start = 0;
const strikes = [];
for (const seg of plan) {
  if (seg.before) actions.push(...seg.before);
  if (seg.strike !== undefined) strikes.push({ t: (start * STEP) / 1000, i: seg.strike });
  const n = fr(seg.s);
  actions.push(["record", work, n, STEP, "main", 1.4, start]);
  start += n;
}
const actionsFile = join(work, "actions.json");
writeFileSync(actionsFile, JSON.stringify(actions));
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT, env: { ...process.env, CHROME_PATH: CHROME } });
  if (r.status !== 0) throw new Error(cmd + " failed");
};
if (!encodeOnly) run(process.execPath, ["--experimental-websocket", join(ROOT, "scripts/drive-rec.mjs"), page, "--actions", actionsFile, "--width", "1200", "--height", "1100"]);

const seconds = (start * STEP) / 1000;
const out = join(ROOT, "video", `${id}.mp4`);
const vf = "scale=1064:-2:flags=lanczos,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=0x0b0b0b,format=yuv420p";
const vin = ["-framerate", String(1000 / STEP), "-i", join(work, "frame-%05d.jpg")];

if (id === "pillars") {
  // the page's own model: f = 3.56·(d/4)/L²·√(E/ρ), sized to Shankarabharanam from Sa = G3
  const C = Math.sqrt(50e9 / 2700), COEF = 4.730041 ** 2 / (2 * Math.PI), R2 = (7.853205 / 4.730041) ** 2;
  const STEPS = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
  const freq = STEPS.map((s, i) => {
    const want = 196 * 2 ** (s / 12);
    const L = Math.round((1.16 - i * 0.022) * 100) / 100;
    const d = Math.round(((want * L * L) / (COEF / 4) / C) * 1000) / 1000;
    return (COEF * (d / 4) / (L * L)) * C;
  });
  // stone clink: fundamental with a 0.9 s decay, inharmonic second mode decaying fast, a short tick
  const terms = strikes.map(({ t, i }) => {
    const f = freq[i].toFixed(2), f2 = (freq[i] * R2).toFixed(2), u = `max(t-${t.toFixed(3)},0)`;
    return `gt(t,${t.toFixed(3)})*(0.55*sin(2*PI*${f}*${u})*exp(-${u}/0.9)+0.18*sin(2*PI*${f2}*${u})*exp(-${u}/0.12)+0.08*sin(2*PI*2400*${u})*exp(-${u}/0.008))`;
  });
  const expr = `0.5*(${terms.join("+")})`;
  run("ffmpeg", ["-loglevel", "error", "-y", ...vin, "-f", "lavfi", "-i", `aevalsrc='${expr}':s=44100:d=${seconds.toFixed(2)}`,
    "-vf", vf, "-af", "afade=t=out:st=" + (seconds - 0.6).toFixed(2) + ":d=0.6", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out]);
} else {
  // silent tracks are rejected by some uploaders; add a silent audio stream for compatibility
  run("ffmpeg", ["-loglevel", "error", "-y", ...vin, "-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo`, "-t", seconds.toFixed(2),
    "-vf", vf, "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-c:a", "aac", "-shortest", "-movflags", "+faststart", out]);
}
console.log("video", out, seconds.toFixed(1) + " s", existsSync(out) ? "ok" : "MISSING");
