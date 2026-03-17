import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const indexPath = path.join(ROOT, "index.json");

function escHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeRelPath(p) {
  const rel = String(p ?? "").trim().replaceAll("\\", "/").replace(/^\/+/, "");
  if (!rel) return null;
  // Keep generation inside repo only.
  if (rel.includes("..")) return null;
  return rel;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(iso);
  }
}

function buildHtml(a) {
  const title = escHtml(a.title);
  const description = escHtml(a.excerpt || a.title || "Article");
  const category = escHtml(a.category || "");
  const date = escHtml(formatDate(a.publishedAt));
  const readingTime = escHtml(a.readingTime || "");
  const tags = Array.isArray(a.tags) ? a.tags.map(t => `<span class="pill">${escHtml(t)}</span>`).join("") : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Tech-News</title>
  <meta name="description" content="${description}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root{
      --bg:#07070a;--surface:#0d0d12;--surface-2:#13131a;
      --text:#f3f4f6;--muted:rgba(243,244,246,0.72);
      --border:rgba(255,255,255,0.10);--indigo:#6366f1;
      --radius:14px;--shadow:0 18px 50px rgba(0,0,0,0.55);
      --ease:cubic-bezier(.2,.8,.2,1);
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:var(--bg);color:var(--text);line-height:1.65}
    a{color:inherit}
    .wrap{max-width:860px;margin:0 auto;padding:28px 18px 60px}
    .topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0 16px;border-bottom:1px solid var(--border)}
    .brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:-0.02em;text-decoration:none}
    .dot{width:9px;height:9px;border-radius:50%;background:var(--indigo);box-shadow:0 0 0 6px rgba(99,102,241,0.12)}
    .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;text-decoration:none;border:1px solid var(--border);background:var(--surface);transition:transform 220ms var(--ease),background-color 220ms var(--ease),border-color 220ms var(--ease)}
    .btn:hover{transform:translateY(-1px);background:var(--surface-2);border-color:rgba(255,255,255,0.16)}
    .card{margin-top:24px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden}
    .card-inner{padding:26px 22px}
    h1{font-size:clamp(1.6rem,3.2vw,2.35rem);line-height:1.15;letter-spacing:-0.03em;margin-bottom:12px}
    .meta{display:flex;flex-wrap:wrap;gap:10px 14px;color:var(--muted);font-size:0.9rem;margin-bottom:18px}
    .pill{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;border:1px solid rgba(99,102,241,0.25);background:rgba(99,102,241,0.12);color:#cfd2ff;font-size:0.78rem;font-weight:600}
    .excerpt{color:rgba(243,244,246,0.86);font-size:1.05rem;margin-top:10px}
    .note{margin-top:18px;color:var(--muted);font-size:0.95rem}
    .tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <a class="brand" href="/"><span class="dot"></span>Tech-News</a>
      <a class="btn" href="/">← Back to home</a>
    </div>

    <article class="card">
      <div class="card-inner">
        <h1>${title}</h1>
        <div class="meta">
          ${category ? `<span>${category}</span>` : ""}
          ${date ? `<span>${date}</span>` : ""}
          ${readingTime ? `<span>${readingTime}</span>` : ""}
        </div>
        ${description ? `<p class="excerpt">${description}</p>` : ""}
        ${tags ? `<div class="tags">${tags}</div>` : ""}
        <p class="note">This article page was generated from <code>index.json</code>. If you want full article bodies, add content fields (or commit full HTML articles) and I can render them here.</p>
      </div>
    </article>
  </div>
</body>
</html>
`;
}

const raw = readFileSync(indexPath, "utf8");
const data = JSON.parse(raw);
const articles = Array.isArray(data) ? data : (Array.isArray(data?.articles) ? data.articles : []);

let created = 0;
let skipped = 0;

for (const a of articles) {
  const relFromUrl = safeRelPath(a?.url);
  const rel = relFromUrl || safeRelPath(`articles/${a?.slug}.html`);
  if (!rel) continue;

  const abs = path.join(ROOT, rel);
  mkdirSync(path.dirname(abs), { recursive: true });

  if (existsSync(abs)) {
    skipped += 1;
    continue;
  }

  writeFileSync(abs, buildHtml(a), "utf8");
  created += 1;
}

console.log(`Generated article pages. created=${created} skipped=${skipped} total=${articles.length}`);

