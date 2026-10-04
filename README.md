<a href="https://zeitiv.dev"><img src="assets/galaxy.svg" alt="My stack as a galaxy: every place I worked or built something is a star, the tools I used there orbit it, signals run along the career spine" width="100%"></a>

```ts
const alex = {
  role: "fullstack developer",
  base: "Zürich, CH",
  now: { team: "Amazon · Lens", via: "Makeen", since: 2024 },
  stack: ["TypeScript", "React", "Angular", "Node", "PostgreSQL", "AWS"],
  sideStack: ["Bun", "Astro", "three.js", "FastAPI", "MCP"],
  homelab: "Mac mini → Docker, Ollama, n8n, Paperless, Qdrant, Traefik",
  site: "https://zeitiv.dev",
};
```

### ./projects

| | what | how |
|---|---|---|
| **[Gradus](https://gradus-self.vercel.app)** | Open-source school workspace for Swiss schools | Angular 22 (zoneless, signals) over a FastAPI core that owns roles, rules and data. The AI runs on Swiss-hosted models through 37 MCP tools; every write becomes a proposal in a server-side ledger, shown as a diff, applied only when someone with the right role accepts it. |
| **[NULLPUNKT](https://edugym-navy.vercel.app)** | Cooperative maths game for the classroom | One Angular 20 app, three surfaces: operator iPads, teacher console, a three.js station on the projector. Server-authoritative rooms over WebSockets (Bun + Elysia): clients send intents, the engine reduces them, each audience gets its own filtered view. CI plays the whole lesson in Playwright. |
| **[zeitiv.dev](https://zeitiv.dev)** | CV as a website | Astro + three.js. The background is the graph in this README, live: GPU lines and points with custom shaders, a 2D overlay for names, neuron-style firing. Self-hosted: Docker + Nginx, GHCR, Portainer. |
| **[lustlaune.ch](https://lustlaune.ch)** | Site and server for a rave collective | Astro, MDX, Astro DB. |

### ./work

```diff
+ 2024–now   Amazon · Lens (via Makeen)   React, tRPC, Prisma, PostgreSQL, Redis, AWS
              live progress over WebSockets, a picklist service across PostgreSQL + Salesforce,
              an OpenStreetMap/ArcGIS risk check, Japanese localisation, Cypress → TypeScript,
              React Router v7 + React Compiler
  2023–2024  Kreativmedia                 Angular 17 webshop with signals, API design with the backend
  2022       Cleo (consulting)            React → Next.js, automated onboarding, E2E in GitHub Actions
  2016–2021  Swisscom                     apprenticeship, then Hubble: cloud billing frontend
```

### ./stack.galaxy

The image at the top is generated, not drawn. [`scripts/graph.ts`](scripts/graph.ts) builds the same graph as the background of zeitiv.dev from [`data/cv.json`](data/cv.json): every place is a star, every tool orbits the newest place that used it, heavier tools orbit closer, and shared tools and ecosystem pairs link the stars. [`scripts/galaxy.ts`](scripts/galaxy.ts) lays it out and writes plain SVG with SMIL animation (Kepler-ish orbit speeds, seeded so it only changes when the CV does), because a README strips scripts. A [workflow](.github/workflows/galaxy.yml) re-syncs the CV and redraws it every night.

```sh
bun scripts/sync-cv.ts ../cv/src/content/cv/cv.json   # or CV_TOKEN=… to pull from zeitiv/cv
bun scripts/galaxy.ts                                 # → assets/galaxy.svg
```

<sub>[zeitiv.dev](https://zeitiv.dev) · [LinkedIn](https://www.linkedin.com/in/alexander-gr%C3%A4del/)</sub>
