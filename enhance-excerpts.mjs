import { readFileSync, writeFileSync } from "node:fs";

const REQUIRED = ["title", "slug", "excerpt", "category", "tags", "readingTime", "publishedAt", "url"];

function norm(s) {
  return String(s ?? "").trim();
}

function pick(arr, fallback = "") {
  return Array.isArray(arr) && arr.length ? String(arr[0]) : fallback;
}

function buildExcerpt(a) {
  const title = norm(a.title);
  const category = norm(a.category);
  const tags = Array.isArray(a.tags) ? a.tags.map(t => norm(t)).filter(Boolean) : [];

  const focus = tags.slice(0, 3).join(", ");

  // Keep this human, direct, and not salesy. 2–3 sentences.
  if (category.toLowerCase() === "tutorial") {
    return `A step-by-step tutorial that shows exactly how to build and ship ${title.replace(/:.*$/, "").toLowerCase()} with practical defaults. You’ll get a clear architecture, implementation steps, and the trade-offs that matter in production${focus ? ` (covering ${focus})` : ""}.`;
  }

  if (category.toLowerCase() === "dev tools") {
    return `A hands-on breakdown of ${title} with the details developers actually care about. We compare options, highlight pitfalls, and give you a simple decision path${focus ? ` based on ${focus}` : ""}.`;
  }

  if (category.toLowerCase() === "ai research") {
    return `A technical deep dive into ${title.replace(/—.*$/, "")}, focused on how it works and what changes in practice. Includes the core concepts, the moving parts, and the implications for modern LLM systems${focus ? ` (${focus})` : ""}.`;
  }

  if (category.toLowerCase() === "backend") {
    return `A production-minded guide to ${title.replace(/:.*$/, "")} with patterns you can apply immediately. Covers architecture choices, reliability concerns, and performance trade-offs${focus ? ` (${focus})` : ""}.`;
  }

  if (category.toLowerCase() === "open source") {
    return `A practical look at ${title.replace(/:.*$/, "")} from the perspective of shipping and maintaining real systems. We cover what’s solid, what’s rough, and how to pick the right tools and projects${focus ? ` (${focus})` : ""}.`;
  }

  if (category.toLowerCase() === "security") {
    return `A practical security guide for ${title.replace(/:.*$/, "")} with concrete controls and implementation advice. Covers the attack surface, the common failure modes, and a checklist you can apply in production${focus ? ` (${focus})` : ""}.`;
  }

  if (category.toLowerCase() === "cloud & infra") {
    return `A straightforward guide to ${title.replace(/:.*$/, "")} with focus on cost, reliability, and operations. You’ll see the main building blocks, the trade-offs, and what to automate first${focus ? ` (${focus})` : ""}.`;
  }

  if (category.toLowerCase() === "performance") {
    return `A practical performance-focused breakdown of ${title.replace(/:.*$/, "")}. Covers bottlenecks, measurement, and the fixes that move real metrics${focus ? ` (${focus})` : ""}.`;
  }

  if (category.toLowerCase() === "ai agents" || category.toLowerCase() === "ai") {
    return `A clear, practical explanation of ${title.replace(/:.*$/, "")} with a focus on what to build and how to avoid common mistakes. Covers the workflow, the trade-offs, and the patterns that hold up in production${focus ? ` (${focus})` : ""}.`;
  }

  return `A practical guide to ${title.replace(/:.*$/, "")} with clear takeaways and production-friendly advice${focus ? ` (${focus})` : ""}.`;
}

function main() {
  const raw = readFileSync("index.json", "utf8");
  const data = JSON.parse(raw);
  const articles = Array.isArray(data) ? data : (Array.isArray(data?.articles) ? data.articles : []);

  let updated = 0;
  for (const a of articles) {
    // Only touch items that look structurally correct.
    const missing = REQUIRED.filter(k => a?.[k] == null || a?.[k] === "" || (k === "tags" && !Array.isArray(a?.[k])));
    if (missing.length) continue;

    const next = buildExcerpt(a);
    if (next && next !== a.excerpt) {
      a.excerpt = next;
      updated += 1;
    }
  }

  const out = Array.isArray(data) ? articles : { ...data, articles };
  writeFileSync("index.json", JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Enhanced excerpts. updated=${updated} total=${articles.length}`);
}

main();

