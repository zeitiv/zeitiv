// The graph behind the galaxy, built from data/cv.json. The same rules as the
// background of zeitiv.dev (src/utils/tech-graph.ts in zeitiv/cv):
//
//   place  a job or project, linked to every tool I used there
//   pair   tools that belong together in the ecosystem (Prisma - PostgreSQL)
//   topic  a skills topic, linked to its tools
//   time   the jobs in order, a spine through the career
//
// Every tool orbits one star: the newest place that used it.

import cv from "../data/cv.json";

type Tech = { label: string };

export interface Place {
  key: string;
  label: string;
  job: boolean;
  note: string;
  tools: string[];
}

export interface Tool {
  key: string;
  label: string;
  /** Places that used it, newest first; the first one is its star */
  at: string[];
  /** Number of links: places, pairs and topics */
  weight: number;
}

export interface Graph {
  places: Place[];
  tools: Map<string, Tool>;
  /** Tools that belong together, both ends in the CV */
  pairs: [string, string][];
  topics: { label: string; tools: string[] }[];
}

// The self-hosted side: what runs on the Mac mini at home
const HOMELAB = ["Docker", "Portainer", "n8n", "Ollama", "Paperless", "Qdrant", "Traefik", "Tailscale", "SilverBullet"];

const PAIRS: [string, string][] = [
  ["typescript", "javascript"], ["typescript", "angular"], ["typescript", "react"], ["typescript", "nextjs"],
  ["typescript", "astro"], ["typescript", "nodejs"], ["typescript", "zod"], ["typescript", "trpc"],
  ["typescript", "prisma"], ["javascript", "nodejs"], ["react", "nextjs"], ["react", "reactrouter"],
  ["react", "trpc"], ["angular", "angularmaterial"], ["angular", "scss"], ["astro", "threejs"],
  ["astro", "unocss"], ["astro", "tailwind"], ["tailwind", "unocss"], ["tailwind", "scss"],
  ["nextjs", "nodejs"], ["trpc", "zod"], ["trpc", "nodejs"], ["prisma", "postgresql"], ["prisma", "nodejs"],
  ["nodejs", "redis"], ["nodejs", "websockets"], ["redis", "websockets"], ["nodejs", "strapi"],
  ["nodejs", "ghost"], ["nodejs", "openapi"], ["springboot", "openapi"], ["springboot", "postgresql"],
  ["aws", "postgresql"], ["aws", "redis"], ["aws", "docker"], ["arcgisesri", "openstreetmap"],
  ["git", "github"], ["git", "bitbucket"], ["github", "githubactions"], ["githubactions", "docker"],
  ["githubactions", "cypress"], ["githubactions", "playwright"], ["cypress", "playwright"],
  ["docker", "portainer"], ["docker", "traefik"], ["docker", "strapi"], ["docker", "ghost"],
  ["docker", "n8n"], ["docker", "qdrant"], ["docker", "paperless"], ["docker", "silverbullet"],
  ["n8n", "ollama"], ["n8n", "paperless"], ["n8n", "qdrant"], ["ollama", "qdrant"], ["ollama", "paperless"],
  ["ollama", "silverbullet"], ["traefik", "tailscale"], ["portainer", "githubactions"],
  ["python", "fastapi"], ["fastapi", "sqlite"], ["python", "sqlite"], ["bun", "typescript"],
  ["bun", "elysia"], ["elysia", "websockets"], ["bun", "vercel"], ["bun", "mcp"], ["mcp", "zod"],
  ["supabase", "postgresql"], ["drizzle", "postgresql"], ["drizzle", "supabase"], ["vitest", "typescript"],
  ["vitest", "playwright"], ["biome", "typescript"], ["vercel", "githubactions"],
];

const ALIASES: Record<string, string> = { sass: "scss" };

/** "Node.js" / "NodeJS" -> "nodejs", "OpenAPI (Elements)" -> "openapi" */
export const techKey = (label: string) => {
  const key = label.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
  return ALIASES[key] ?? key;
};

/** "Swisscom AG / BBW" -> "Swisscom" */
const placeName = (name: string) => name.replace(/\s*\/.*$/, "").replace(/\s+(AG|GmbH)$/, "");

/** "https://www.example.com" -> "example.com", "https://github.com/a/b" -> "a/b" */
const site = (url: string) => {
  const { hostname, pathname } = new URL(url);
  return hostname === "github.com" ? pathname.slice(1) : hostname.replace(/^www\./, "");
};

/** "08/2024 - Present" -> "2024–now" */
const years = (date: string) => {
  const [from, to] = date.split(/\s*-\s*/).map((part) => (/present/i.test(part) ? "now" : part.slice(-4)));
  return from === to ? from : `${from}–${to}`;
};

/** "DevOps Engineer (Frontend)" -> "DevOps Engineer" */
const role = (position: string) => position.replace(/\s*\(.*?\)/g, "");

export function buildGraph(): Graph {
  const places: Place[] = [];
  const addPlace = (name: string, tech: Tech[] = [], job: boolean, note: string) => {
    if (!tech.length) return;
    const label = placeName(name);
    const tools = tech.map((t) => t.label);
    const existing = places.find((p) => p.label === label);
    if (existing) existing.tools.push(...tools);
    else places.push({ key: techKey(label), label, job, note, tools });
  };

  for (const job of cv.experience) {
    addPlace(job.company, job.technologies, true, `${role(job.position)} · ${years(job.date)}`);
    for (const sub of job.subItems) addPlace(sub.company, sub.technologies, true, `${role(sub.position)} · ${years(sub.date)}`);
  }
  for (const school of cv.education) addPlace(school.institution, school.technologies, true, `${school.studyType} · ${years(school.date)}`);
  for (const project of cv.projects) addPlace(project.name, project.technologies, false, site(project.url));
  addPlace("Homelab", HOMELAB.map((label) => ({ label })), false, "Mac mini · self-hosted");

  const tools = new Map<string, Tool>();
  const tool = (label: string) => {
    const key = techKey(label);
    let t = tools.get(key);
    if (!t) tools.set(key, (t = { key, label, at: [], weight: 0 }));
    return t;
  };
  // Prefer the spelling from the skills list ("TypeScript", not "Typescript")
  for (const topic of cv.skills) for (const name of topic.skills) tool(name);

  for (const place of places) {
    place.tools = [...new Set(place.tools.map((label) => tool(label).key))];
    for (const key of place.tools) {
      const t = tools.get(key)!;
      t.at.push(place.key);
      t.weight++;
    }
  }
  // Skills that no place used have no star to orbit
  for (const [key, t] of tools) if (!t.at.length) tools.delete(key);

  const pairs = PAIRS.filter(([a, b]) => tools.has(a) && tools.has(b));
  for (const [a, b] of pairs) {
    tools.get(a)!.weight++;
    tools.get(b)!.weight++;
  }

  const topics = cv.skills.map((t) => ({ label: t.topic, tools: t.skills.map(techKey).filter((k) => tools.has(k)) }));
  for (const topic of topics) for (const key of topic.tools) tools.get(key)!.weight++;

  return { places, tools, pairs, topics };
}
