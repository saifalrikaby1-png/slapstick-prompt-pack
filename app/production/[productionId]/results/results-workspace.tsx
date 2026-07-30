"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";
import { ProductionPack, RequestedOutput } from "../../../production-types";
import {
  findProductionRecord,
  ProductionRecord,
  saveProductionRecord,
} from "../../../production-records";

const OUTPUT_ORDER: RequestedOutput[] = [
  "videoTitle",
  "characterBuildingPrompt",
  "startFramePrompt",
  "endFramePrompt",
  "videoPrompt",
  "musicPath",
  "soundEffects",
];

const OUTPUT_LABELS: Record<RequestedOutput, string> = {
  videoTitle: "Video Title",
  characterBuildingPrompt: "Character",
  startFramePrompt: "Start Frame",
  endFramePrompt: "End Frame",
  videoPrompt: "Video Prompt",
  musicPath: "Music",
  soundEffects: "Sound Effects",
};

function outputContent(pack: Partial<ProductionPack>, type: RequestedOutput) {
  if (type === "videoPrompt") {
    return [pack.videoLock, pack.videoTimeline, pack.finalGenerationRule].filter(Boolean).join("\n\n");
  }
  return String(pack[type] || "");
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="results-summary-item"><span>{label}</span><strong>{value}</strong></div>;
}

export function ResultsWorkspace({ productionId }: { productionId: string }) {
  const [production, setProduction] = useState<ProductionRecord | null | undefined>(undefined);
  const [activeOutputType, setActiveOutputType] = useState<RequestedOutput | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = () => {
      const record = findProductionRecord(productionId);
      setProduction(record);
      setActiveOutputType((current) => current || record?.generatedOutputs?.[0] || null);
    };
    const timer = window.setTimeout(load, 0);
    window.addEventListener("storage", load);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", load);
    };
  }, [productionId]);

  const availableOutputs = useMemo(() => production
    ? OUTPUT_ORDER.filter((type) => (production.generatedOutputs || []).includes(type) && outputContent(production.pack, type))
    : [], [production]);
  const activeType = activeOutputType && availableOutputs.includes(activeOutputType)
    ? activeOutputType
    : availableOutputs[0];
  const activeContent = production && activeType ? outputContent(production.pack, activeType) : "";

  async function copyActiveOutput() {
    if (!activeContent) return;
    await navigator.clipboard.writeText(activeContent);
    setNotice("Active output copied.");
  }

  function savePack() {
    if (!production) return;
    setProduction(saveProductionRecord(production));
    setNotice("Production pack saved.");
  }

  async function downloadWord() {
    if (!production) return;
    const sections = availableOutputs.flatMap((type) => [
      new Paragraph({ heading: HeadingLevel.HEADING_2, text: OUTPUT_LABELS[type] }),
      ...outputContent(production.pack, type).split(/\n+/).map((text) => new Paragraph(text)),
    ]);
    const metadata = [
      `Video type: ${production.form.videoStyleId}`,
      `Characters: ${production.characterProfiles.length}`,
      `Duration: ${production.form.duration} seconds`,
      `Video model: ${production.videoModel}`,
      `Video ratio: ${production.form.videoRatio}`,
      `Generation mode: ${production.generationMode}`,
    ];
    const document = new Document({
      sections: [{
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, text: production.title }),
          new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Production Summary" }),
          ...metadata.map((text) => new Paragraph(text)),
          ...sections,
        ],
      }],
    });
    saveAs(await Packer.toBlob(document), `${production.title.replace(/[^a-z0-9]+/gi, "_") || "production_pack"}.docx`);
    setNotice("Production pack downloaded as an editable Word document.");
  }

  if (production === undefined) {
    return <main className="production-results-page"><section className="results-generating-state"><div className="results-generating-spinner" /><h1>Loading production pack…</h1></section></main>;
  }

  if (!production) {
    return <main className="production-results-page"><section className="results-failure-state"><h1>Production pack not found</h1><p>This production may have been removed or belongs to another browser.</p><div className="results-failure-actions"><Link href="/saved-packs" className="production-secondary-button">Return to Saved Packs</Link><Link href="/production/new" className="production-emerald-gold-cta">Create New Production</Link></div></section></main>;
  }

  if (production.status === "generating") {
    return <main className="production-results-page"><section className="results-generating-state"><div className="results-generating-spinner" /><h1>Generating your production pack…</h1><p>Building prompts, frames, timing, audio, and quality checks.</p><div className="results-generation-progress"><span /></div></section></main>;
  }

  if (production.status === "failed") {
    return <main className="production-results-page"><section className="results-failure-state"><h1>We could not complete this production pack.</h1><p>{production.error?.message || "The generation could not be completed. Your production settings are still saved."}</p><div className="results-failure-actions"><Link href={`/production/${production.id}/edit`} className="production-emerald-gold-cta">Try Again</Link><Link href={`/production/${production.id}/edit`} className="production-secondary-button">Return to Production</Link></div></section></main>;
  }

  return (
    <main className="production-results-page">
      <header className="results-page-header">
        <div><p className="results-eyebrow">GENERATED PRODUCTION PACK</p><h1>{production.title}</h1><p>Review, copy, edit, save, or export your completed production pack.</p></div>
        <div className="results-header-actions"><button type="button" className="production-secondary-button" onClick={savePack}>Save Pack</button><button type="button" className="production-secondary-button" onClick={downloadWord}>Download Word</button><Link href="/production/new" className="production-emerald-gold-cta">Create Another</Link></div>
      </header>
      {notice && <p className="results-notice" role="status">{notice}</p>}
      <div className="results-tabs" role="tablist" aria-label="Generated outputs">
        {availableOutputs.map((type) => <button key={type} type="button" role="tab" aria-selected={activeType === type} className={activeType === type ? "results-tab is-active" : "results-tab"} onClick={() => setActiveOutputType(type)}>{OUTPUT_LABELS[type]}</button>)}
      </div>
      <div className="results-workspace">
        <section className="results-output-viewer">
          <header className="results-output-header"><div><p>{activeType ? OUTPUT_LABELS[activeType] : "Output"}</p><h2>{activeType ? OUTPUT_LABELS[activeType] : "No generated output"}</h2></div><div className="results-output-actions"><button type="button" className="production-secondary-button" onClick={copyActiveOutput}>Copy</button><Link href={`/production/${production.id}/edit`} className="production-secondary-button">Edit</Link><Link href={`/production/${production.id}/edit`} className="production-secondary-button">Regenerate</Link></div></header>
          <div className="results-output-content">{activeContent || "No content was generated for this output."}</div>
        </section>
        <aside className="results-summary-sidebar"><h2>Production Summary</h2><SummaryItem label="Title" value={production.title} /><SummaryItem label="Characters" value={`${production.characterProfiles.length}`} /><SummaryItem label="Duration" value={`${production.form.duration} seconds`} /><SummaryItem label="Model" value={production.videoModel} /><SummaryItem label="Ratio" value={production.form.videoRatio} /><SummaryItem label="Outputs" value={`${availableOutputs.length} generated`} /><Link href={`/production/${production.id}/edit`} className="production-secondary-button">Edit Production</Link></aside>
      </div>
      <footer className="results-bottom-actions"><Link href={`/production/${production.id}/edit`} className="production-secondary-button">Regenerate Selected Output</Link><Link href="/production/new" className="production-emerald-gold-cta">Generate Another Pack</Link></footer>
    </main>
  );
}
