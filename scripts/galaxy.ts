// Draws the graph as assets/galaxy.svg: every place a star, its tools on flat
// orbits around it, the career as a spine with signals running along it.
// Plain SVG + SMIL so it animates inside a GitHub README, where scripts and
// external fonts are stripped. Seeded, so the output only changes with the CV.
//
//   bun scripts/galaxy.ts

import { buildGraph } from "./graph";

const W = 1000;
const H = 520;
const PAPER = "#101112";
const INK = "#ece9e3";
const INK2 = "#a9a6a0";
const INK3 = "#6f6d69";
const RULE = "#2a2b2c";
const CYAN = "#72ccfc";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// mulberry32: the same galaxy on every run
let seed = 0x7a17;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = (a: number, b: number) => a + random() * (b - a);
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const { places, tools, pairs } = buildGraph();

// ---------- layout ----------
// Stars zig-zag across the frame, current first, like down the page on the site
const stars = places.map((place, i) => {
  const t = places.length > 1 ? i / (places.length - 1) : 0.5;
  const satellites = [...tools.values()].filter((tool) => tool.at[0] === place.key).sort((a, b) => b.weight - a.weight);
  return {
    ...place,
    i,
    x: 150 + t * (W - 300) + rand(-8, 8),
    y: (i % 2 ? 0.67 : 0.4) * H + rand(-14, 14),
    // Every system has one orbital plane, seen from a little above
    flat: rand(0.42, 0.5),
    tilt: rand(-9, 9),
    dir: i % 2 ? -1 : 1,
    satellites,
  };
});
const starOf = new Map(stars.map((s) => [s.key, s]));

// Kepler-ish: farther is slower
const PERIOD = 70; // seconds for one lap at 100 px
const period = (r: number) => PERIOD * Math.pow(Math.max(r, 20) / 100, 1.5);

/** A full ellipse as one path, so a planet can ride it with animateMotion */
const ellipse = (rx: number, ry: number, tiltDeg: number, phase: number) => {
  const a = (tiltDeg * Math.PI) / 180;
  const at = (theta: number) => {
    const x = Math.cos(theta) * rx;
    const y = Math.sin(theta) * ry;
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };
  const [x0, y0] = at(phase);
  const [x1, y1] = at(phase + Math.PI);
  const arc = `A${f(rx)} ${f(ry)} ${f(tiltDeg)} 1 1`;
  return `M${f(x0)} ${f(y0)} ${arc} ${f(x1)} ${f(y1)} ${arc} ${f(x0)} ${f(y0)}`;
};

const maxWeight = Math.max(...[...tools.values()].map((t) => t.weight));
const heavy = new Set(
  [...tools.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 14)
    .map((t) => t.key),
);

// ---------- background: a star field turning around the middle ----------
const dust: string[] = [];
const reach = Math.hypot(W, H) / 2;
for (let i = 0; i < 260; i++) {
  const r = Math.sqrt(random()) * reach;
  const a = random() * Math.PI * 2;
  const o = rand(0.08, 0.4);
  dust.push(`<circle cx="${f(W / 2 + Math.cos(a) * r)}" cy="${f(H / 2 + Math.sin(a) * r)}" r="${f(rand(0.4, 1.1))}" fill="${INK}" opacity="${f(o)}"/>`);
}

// ---------- links between stars: tools they share, and the career spine ----------
const shared = new Map<string, number>();
for (const tool of tools.values()) {
  const [home, ...rest] = tool.at;
  for (const other of rest) {
    const id = [home, other].sort().join("|");
    shared.set(id, (shared.get(id) ?? 0) + 1);
  }
}
// Pairs whose ends orbit different stars link those stars too
for (const [a, b] of pairs) {
  const sa = tools.get(a)!.at[0];
  const sb = tools.get(b)!.at[0];
  if (sa === sb) continue;
  const id = [sa, sb].sort().join("|");
  shared.set(id, (shared.get(id) ?? 0) + 0.5);
}

const links: string[] = [];
const pulses: string[] = [];
let pulse = 0;
const signal = (d: string, length: number, color: string, delay: number, every: number) => {
  const dur = Math.max(1.2, length / 260);
  pulses.push(
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="18 ${f(length + 40)}" stroke-dashoffset="18" opacity="0">` +
      `<animate attributeName="stroke-dashoffset" values="18;${f(-length - 4)};${f(-length - 4)}" keyTimes="0;${f(dur / every)};1" dur="${every}s" begin="${f(delay)}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.01;${f((dur / every) * 0.9)};${f(dur / every)};1" dur="${every}s" begin="${f(delay)}s" repeatCount="indefinite"/>` +
      `</path>`,
  );
};

for (const [id, n] of [...shared].sort((a, b) => a[1] - b[1])) {
  const [a, b] = id.split("|").map((k) => starOf.get(k)!);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  // Long links fade, heavier links (more reasons) are thicker
  const o = Math.min(0.5, 0.1 + n * 0.05) * Math.max(0.35, 1 - length / W);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - length * 0.12;
  const d = `M${f(a.x)} ${f(a.y)} Q${f(mx)} ${f(my)} ${f(b.x)} ${f(b.y)}`;
  links.push(`<path d="${d}" fill="none" stroke="${INK2}" stroke-width="${f(Math.min(2, 0.5 + n * 0.2))}" opacity="${f(o)}"/>`);
  if (n >= 2) signal(d, length * 1.04, INK, 3.4 + (pulse++ % 9) * 1.3 + rand(0, 1), 12);
}

// The jobs in order, newest first
const jobs = stars.filter((s) => s.job);
for (let i = 1; i < jobs.length; i++) {
  const a = jobs[i - 1];
  const b = jobs[i];
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const d = `M${f(a.x)} ${f(a.y)} L${f(b.x)} ${f(b.y)}`;
  links.push(`<path d="${d}" fill="none" stroke="${CYAN}" stroke-width="1" stroke-dasharray="2 5" opacity="0.45"/>`);
  signal(d, length, CYAN, 3 + i * 0.5, 9);
}

// ---------- systems ----------
const orbits = new Map<string, { r: number; tilt: number }>();
const systems: string[] = [];
const labels: string[] = [];
for (const star of stars) {
  const n = star.satellites.length;
  const inner = 30;
  const outer = Math.min(135, inner + n * 11);
  const gap = n > 1 ? (outer - inner) / (n - 1) : 0;
  const born = 0.2 + star.i * 0.18; // stars arrive in turn
  const parts: string[] = [];

  // Orbits, faint like a star chart
  star.satellites.forEach((tool, k) => {
    const r = inner + gap * k;
    const tilt = star.tilt + rand(-2, 2);
    parts.push(`<ellipse rx="${f(r)}" ry="${f(r * star.flat)}" transform="rotate(${f(tilt)})" fill="none" stroke="${RULE}" stroke-width="0.8"/>`);
    orbits.set(tool.key, { r, tilt });
  });

  // Planets: heavier tools closer, a gauge dot sized by links, the name riding along
  star.satellites.forEach((tool, k) => {
    const { r, tilt } = orbits.get(tool.key)!;
    const lap = period(r);
    const phase = (k / n) * Math.PI * 2 + rand(-0.4, 0.4);
    const path = ellipse(r, r * star.flat, tilt, phase);
    const size = 1.4 + (tool.weight / maxWeight) * 2.4;
    const big = heavy.has(tool.key);
    const reverse = star.dir < 0 ? ` keyPoints="1;0" keyTimes="0;1" calcMode="linear"` : "";
    parts.push(
      `<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${f(born + 0.4 + k * 0.04)}s" dur="0.6s" fill="freeze"/>` +
        `<animateMotion dur="${f(lap)}s" repeatCount="indefinite" path="${path}"${reverse}/>` +
        `<circle r="${f(size)}" fill="${big ? INK : INK2}"/>` +
        `<text x="${f(size + 3)}" y="3" font-size="${big ? 10.5 : 9}" fill="${big ? INK2 : INK3}">${esc(tool.label)}</text>` +
        `</g>`,
    );
  });

  // The star: core, ring, turning ticks
  const current = star.i === 0;
  const color = current ? CYAN : INK;
  const ticks = [0, 90, 180, 270].map((a) => `<line x1="0" y1="-9" x2="0" y2="-12" transform="rotate(${a})"/>`).join("");
  parts.push(
    `<circle r="7.5" fill="${PAPER}" stroke="${color}" stroke-width="1" opacity="0.7"/>`,
    `<circle r="3.2" fill="${color}"/>`,
    `<g stroke="${color}" stroke-width="1" opacity="0.6">${ticks}<animateTransform attributeName="transform" type="rotate" from="0" to="${star.dir * 360}" dur="24s" repeatCount="indefinite"/></g>`,
  );
  systems.push(
    `<g transform="translate(${f(star.x)} ${f(star.y)})" opacity="0">` +
      `<animate attributeName="opacity" from="0" to="1" begin="${f(born)}s" dur="0.8s" fill="freeze"/>` +
      parts.join("") +
      `</g>`,
  );

  // Numbered callout above the star
  const num = String(star.i + 1).padStart(2, "0");
  const up = star.i % 2 ? 1 : -1;
  const ly = star.y + up * (outer * star.flat + 22) + (up > 0 ? 10 : 0);
  labels.push(
    `<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${f(born + 0.2)}s" dur="0.8s" fill="freeze"/>` +
      `<line x1="${f(star.x)}" y1="${f(star.y + up * 9)}" x2="${f(star.x)}" y2="${f(ly - up * 12)}" stroke="${RULE}" stroke-width="1"/>` +
      `<text x="${f(star.x)}" y="${f(ly)}" text-anchor="middle" font-size="13" fill="${INK}"><tspan fill="${CYAN}">${num}</tspan> ${esc(star.label)}</text>` +
      `<text x="${f(star.x)}" y="${f(ly + 13)}" text-anchor="middle" font-size="10" fill="${INK3}">${esc(star.note)}</text>` +
      `</g>`,
  );
}

// ---------- frame ----------
const linkCount = shared.size + Math.max(0, jobs.length - 1);
const caption = `${places.length} places · ${tools.size} tools · ${pairs.length} pairs · ${linkCount} links`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${MONO}" role="img" aria-label="My stack as a galaxy: ${esc(caption)}">
<title>zeitiv · stack galaxy</title>
<rect width="${W}" height="${H}" rx="10" fill="${PAPER}"/>
<g>${dust.join("")}<animateTransform attributeName="transform" type="rotate" from="0 ${W / 2} ${H / 2}" to="360 ${W / 2} ${H / 2}" dur="900s" repeatCount="indefinite"/></g>
<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="2.4s" dur="1s" fill="freeze"/>${links.join("")}</g>
${pulses.join("\n")}
${systems.join("\n")}
${labels.join("\n")}
<text x="24" y="32" font-size="14" fill="${INK}">zeitiv<tspan fill="${INK3}"> / stack.galaxy</tspan></text>
<text x="24" y="${H - 22}" font-size="11" fill="${INK3}">${esc(caption)} · generated from cv.json</text>
<g font-size="11" fill="${INK3}" text-anchor="end">
<text x="${W - 24}" y="32">star = place · planet = tool · closer = more links</text>
<text x="${W - 24}" y="${H - 22}"><tspan fill="${CYAN}">- - -</tspan> career  <tspan fill="${INK2}">⌒</tspan> shared tools</text>
</g>
<rect width="${W}" height="${H}" rx="10" fill="none" stroke="${RULE}"/>
</svg>
`;

await Bun.write("assets/galaxy.svg", svg);
console.log(`assets/galaxy.svg · ${caption} · ${(svg.length / 1024).toFixed(1)} KB`);
