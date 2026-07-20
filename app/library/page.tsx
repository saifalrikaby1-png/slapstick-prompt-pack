"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StoredPack } from "../production-types";
import { migrateStoredPack } from "../production-engine";

const PACKS_KEY = "slapstick-saved-packs";

function safePacks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PACKS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(migrateStoredPack).filter((pack): pack is StoredPack => Boolean(pack)) : [];
  } catch { return []; }
}

export default function PromptLibrary() {
  const [projects, setProjects] = useState<StoredPack[]>([]);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  useEffect(() => { const timer = window.setTimeout(() => setProjects(safePacks()), 0); return () => window.clearTimeout(timer); }, []);
  const visible = useMemo(() => projects.filter((project) => project.title.toLowerCase().includes(search.toLowerCase())).sort((a, b) => order === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)), [projects, search, order]);
  function persist(next: StoredPack[]) { setProjects(next); localStorage.setItem(PACKS_KEY, JSON.stringify(next)); }
  function open(project: StoredPack) { localStorage.setItem("slapstick-library-open-project", JSON.stringify(project)); window.location.assign("/"); }
  function rename(project: StoredPack) { const title = window.prompt("Project name", project.title)?.trim(); if (title) persist(projects.map((entry) => entry.id === project.id ? { ...entry, title } : entry)); }
  function duplicate(project: StoredPack) { const copy = { ...project, id: crypto.randomUUID(), title: `${project.title} Copy`, createdAt: new Date().toISOString() } as StoredPack; persist([copy, ...projects]); }
  function remove(project: StoredPack) { if (window.confirm(`Delete “${project.title}”?`)) persist(projects.filter((entry) => entry.id !== project.id)); }
  return <main className="library-page"><header className="topbar"><Link className="brand" href="/"><span className="brand-mark">S</span><span><strong>Slapstick</strong><small>PROMPT PACK</small></span></Link><Link className="library-link" href="/">Back to editor</Link></header><section className="hero"><div><span className="eyebrow">LOCAL PROMPT LIBRARY</span><h1>Your saved production packs.</h1><p>Projects are stored only in this browser until an authenticated database adapter is added.</p></div></section><section className="setup-panel"><div className="form-grid"><label className="field"><span>Search by project title</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" /></label><label className="field"><span>Sort</span><select value={order} onChange={(event) => setOrder(event.target.value as "newest" | "oldest")}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div><p className="library-note">Local/browser storage only. Signing in and a database-backed repository are required before launch for cross-device projects and ownership enforcement.</p>{visible.map((project) => <article className="output-card" key={project.id}><div className="card-heading"><span>{project.schemaVersion === 1 ? "LEGACY" : "PROJECT"}</span><h3>{project.title}</h3></div><p>Last modified: {new Date(project.createdAt).toLocaleString()} · {project.platform} · {project.videoModel}</p><div className="button-row"><button onClick={() => open(project)}>Open and Continue Editing</button><button onClick={() => rename(project)}>Rename</button><button onClick={() => duplicate(project)}>Duplicate</button><button onClick={() => remove(project)}>Delete</button></div></article>)}{!visible.length && <div className="empty-output"><h3>No saved projects yet.</h3><p>Use Save to Prompt Library in the editor after generating a pack.</p></div>}</section></main>;
}
