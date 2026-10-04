// Copies the parts of cv.json the galaxy needs (who used what, where, and the
// skills topics) from zeitiv/cv into data/cv.json. Nothing else leaves the
// private repo.
//
//   bun scripts/sync-cv.ts path/to/cv.json      from a local checkout
//   CV_TOKEN=... bun scripts/sync-cv.ts         from GitHub

const SOURCE = "https://api.github.com/repos/zeitiv/cv/contents/src/content/cv/cv.json";

async function load(): Promise<any> {
  const path = process.argv[2];
  if (path) return Bun.file(path).json();
  const token = process.env.CV_TOKEN;
  if (!token) throw new Error("Pass a path to cv.json or set CV_TOKEN");
  const res = await fetch(SOURCE, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw+json" },
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  return res.json();
}

const cv = await load();
const { experience, education, projects, skills } = cv.sections;
const tech = (list: { label: string }[] = []) => list.map(({ label }) => ({ label }));

const trimmed = {
  experience: experience.items
    .filter((j: any) => j.visible)
    .map((j: any) => ({
      company: j.company,
      position: j.position,
      date: j.date,
      technologies: tech(j.technologies),
      subItems: (j.subItems ?? [])
        .filter((s: any) => s.visible !== false)
        .map((s: any) => ({ company: s.company, position: s.position, date: s.date, technologies: tech(s.technologies) })),
    })),
  education: education.items
    .filter((e: any) => e.visible)
    .map((e: any) => ({ institution: e.institution, studyType: e.studyType, date: e.date, technologies: tech(e.technologies) })),
  projects: projects.items
    .filter((p: any) => p.visible)
    .map((p: any) => ({ name: p.name, url: p.url, technologies: tech(p.technologies) })),
  skills: skills.items.map((t: any) => ({
    topic: t.topic,
    skills: t.skills.filter((s: any) => s.visible).map((s: any) => s.name),
  })),
};

await Bun.write("data/cv.json", `${JSON.stringify(trimmed, null, 2)}\n`);
console.log("data/cv.json updated");

export {};
