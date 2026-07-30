"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";
import { CharacterProfile, ProductionPack, RequestedOutput } from "../../../production-types";
import { findProductionRecord, ProductionRecord, saveProductionRecord } from "../../../production-records";
import { analyzePromptPackage, maximizePromptQuality, promptQualityContext, PromptQualityAnalysis } from "../../../prompt-quality";

const RESULT_TAB_ORDER = ["character", "frames", "complete-production-prompt", "prompt-quality", "timeline", "negative-prompt"] as const;
type ResultTabId = (typeof RESULT_TAB_ORDER)[number];

const RESULT_TAB_LABELS: Record<ResultTabId, string> = {
  character: "Character",
  frames: "Start & End Frames",
  "complete-production-prompt": "Complete Production Prompt",
  "prompt-quality": "Prompt Quality",
  timeline: "Timeline",
  "negative-prompt": "Negative Prompt",
};

function cleanSections(sections: Array<[string, string | undefined]>) {
  return sections
    .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
    .map(([title, content]) => `${title}\n\n${content.trim()}`)
    .join("\n\n");
}

export function buildCompleteProductionPrompt(pack: Partial<ProductionPack>) {
  return cleanSections([
    ["VIDEO LOCK", pack.videoLock],
    ["VIDEO PROMPT", pack.videoTimeline],
    ["MUSIC DIRECTION", pack.musicPath],
    ["SOUND EFFECTS DIRECTION", pack.soundEffects],
    ["VIDEO RULES", pack.finalGenerationRule],
  ]);
}

export function buildBothFrames(pack: Partial<ProductionPack>) {
  return cleanSections([
    ["START FRAME", pack.startFramePrompt],
    ["END FRAME", pack.endFramePrompt],
  ]);
}

function characterDetails(character: CharacterProfile) {
  return cleanSections([
    ["NAME", character.shortName],
    ["ROLE", character.role],
    ["IDENTITY", character.fullIdentity || character.description],
    ["DESCRIPTION", character.description],
    ["APPEARANCE", character.appearanceLock],
    ["COLORS", character.colorLock],
    ["PROPORTIONS", character.scaleLock],
    ["PERSONALITY", character.personalityLock],
    ["MOVEMENT IDENTITY", character.movementStyle],
    ["SOUND IDENTITY", character.nonverbalSoundProfile || character.vocalStyleLock],
    ["CONTINUITY REQUIREMENTS", character.continuityRules],
  ]);
}

export function buildAllCharacterDetails(characters: CharacterProfile[]) {
  return characters.map((character, index) => [
    `CHARACTER ${index + 1} — ${character.shortName.toUpperCase()}`,
    character.role ? `Role:\n${character.role}` : "",
    characterDetails(character) ? `Identity:\n${characterDetails(character)}` : "",
  ].filter(Boolean).join("\n\n")).join("\n\n\n");
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="results-summary-item"><span>{label}</span><strong>{value}</strong></div>;
}

function PromptResultSection({ title, content, copyLabel, onCopy }: { title: string; content?: string; copyLabel: string; onCopy: () => void }) {
  if (!content?.trim()) return null;
  return <section className="complete-prompt-section"><header className="complete-prompt-section-header"><h3>{title}</h3><button type="button" className="production-secondary-button" onClick={onCopy}>{copyLabel}</button></header><div className="complete-prompt-section-content">{content}</div></section>;
}

function FrameResultPanel({ title, prompt, onCopy }: { title: string; prompt?: string; onCopy: () => void }) {
  if (!prompt?.trim()) return null;
  return <article className="results-frame-panel"><header className="results-frame-panel-header"><h3>{title}</h3><button type="button" className="production-secondary-button" onClick={onCopy}>Copy {title}</button></header><div className="results-frame-prompt">{prompt}</div></article>;
}

function PromptQualityPanel({ analysis, onMaximize, isMaximizing, lastRepair }: { analysis: PromptQualityAnalysis; onMaximize: () => void; isMaximizing: boolean; lastRepair?: ProductionRecord["lastPromptQualityRepair"] }) {
  return <section className="prompt-quality-panel"><header className="prompt-quality-header"><div><p className="results-output-eyebrow">PROMPT QUALITY CONTROL</p><h2>Prompt Quality Score</h2><p>Measures the strength, clarity, consistency, completeness, and model-readiness of the generated production prompt.</p><strong className="prompt-quality-motto">The Strongest Prompts Ever Built.</strong></div><div className="prompt-quality-score"><strong>{analysis.score}%</strong><span>{analysis.label}</span></div></header><div className="prompt-quality-status-row"><strong>{analysis.label}</strong><span>{analysis.passedChecks.length} checks passed</span></div><div className="prompt-quality-meter" role="progressbar" aria-label="Prompt Quality Score" aria-valuemin={0} aria-valuemax={98} aria-valuenow={analysis.score}><span style={{ width: `${Math.min(100, analysis.score / 98 * 100)}%` }} /></div><div className="prompt-quality-category-grid">{analysis.categories.map((category) => <details className="prompt-quality-category" key={category.id}><summary className="prompt-quality-category-header"><h3>{category.label}</h3><span className="prompt-quality-category-score">{category.earnedScore} / {category.maxScore}</span></summary>{category.checks.map((check) => <p key={check.id}><strong>{check.status.toUpperCase()}</strong> — {check.message}</p>)}</details>)}</div>{analysis.warnings.length > 0 && <section className="prompt-quality-issues"><h3>Improvements available</h3>{analysis.warnings.map((check) => <article className="prompt-quality-issue" key={check.id}><strong>Warning · {check.label}</strong><p>{check.message}</p><small>Affected: {check.affectedSections.join(", ")}</small></article>)}</section>}{analysis.failedChecks.length > 0 && <section className="prompt-quality-issues"><h3>Critical issues</h3>{analysis.failedChecks.map((check) => <article className="prompt-quality-issue" key={check.id}><strong>Failure · {check.label}</strong><p>{check.message}</p><small>Affected: {check.affectedSections.join(", ")}</small></article>)}</section>}<button type="button" className="production-emerald-gold-cta" onClick={onMaximize} disabled={isMaximizing || analysis.score >= 98}>{isMaximizing ? "Maximizing Prompt Quality…" : analysis.score >= 98 ? "Maximum Quality Reached" : "Maximize Prompt Quality"}</button>{lastRepair && <section className="prompt-quality-repair-summary" aria-live="polite"><h3>AI optimization completed</h3><p>Before: {lastRepair.previousScore}% · After: {lastRepair.newScore}%</p>{lastRepair.improvements.length ? <ul>{lastRepair.improvements.map((improvement) => <li key={improvement}>{improvement}</li>)}</ul> : <p>We reviewed every repairable prompt issue, but no safe improvement could be applied without changing your approved creative choices.</p>}</section>}</section>;
}

export function ResultsWorkspace({ productionId }: { productionId: string }) {
  const [production, setProduction] = useState<ProductionRecord | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<ResultTabId>("complete-production-prompt");
  const [expandedCharacterIds, setExpandedCharacterIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [isMaximizing, setIsMaximizing] = useState(false);

  useEffect(() => {
    const load = () => {
      const record = findProductionRecord(productionId);
      if (record && !record.promptQuality && record.status === "completed") {
        const analysis = analyzePromptPackage(record.pack as ProductionPack, promptQualityContext(record.form, record.characterProfiles, record.generationMode, record.generatedOutputs || []));
        record.promptQuality = analysis;
        record.promptQualityHistory = [...(record.promptQualityHistory || []), { score: analysis.score, label: analysis.label, analyzedAt: analysis.analyzedAt, analysisVersion: analysis.analysisVersion, reason: "initial" }];
        setProduction(saveProductionRecord(record));
        return;
      }
      setProduction(record);
    };
    const timer = window.setTimeout(load, 0);
    window.addEventListener("storage", load);
    return () => { window.clearTimeout(timer); window.removeEventListener("storage", load); };
  }, [productionId]);

  const availableTabs = useMemo<ResultTabId[]>(() => {
    if (!production) return [];
    const pack = production.pack;
    const tabs: ResultTabId[] = [];
    if (production.characterProfiles.length || pack.characterBuildingPrompt) tabs.push("character");
    if (pack.startFramePrompt || pack.endFramePrompt) tabs.push("frames");
    if (buildCompleteProductionPrompt(pack)) tabs.push("complete-production-prompt");
    if (pack.videoTimeline) tabs.push("timeline");
    tabs.push("prompt-quality");
    return RESULT_TAB_ORDER.filter((tab) => tabs.includes(tab));
  }, [production]);
  const selectedTab = availableTabs.includes(activeTab)
    ? activeTab
    : availableTabs.includes("complete-production-prompt")
      ? "complete-production-prompt"
      : availableTabs[0];

  async function copyText(value: string, message: string) {
    if (!value.trim()) return;
    await navigator.clipboard.writeText(value);
    setNotice(message);
  }

  function toggleCharacterDetails(id: string) {
    setExpandedCharacterIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function savePack() {
    if (!production) return;
    setProduction(saveProductionRecord(production));
    setNotice("Production pack saved.");
  }

  async function handleMaximizePromptQuality() {
    if (!production?.promptQuality || isMaximizing) return;
    setIsMaximizing(true);
    let repair = maximizePromptQuality(production.pack as ProductionPack, production.form, production.characterProfiles, production.generationMode, production.generatedOutputs || []);
    if (production.generationMode === "ai" && repair.newAnalysis.score < 98 && repair.newAnalysis.repairableIssueCount > 0) {
      const affected = new Set(repair.newAnalysis.warnings.concat(repair.newAnalysis.failedChecks).flatMap((check) => check.affectedSections));
      const requestedOutputs: RequestedOutput[] = [];
      if (affected.has("characters")) requestedOutputs.push("characterBuildingPrompt");
      if (affected.has("start-frame")) requestedOutputs.push("startFramePrompt");
      if (affected.has("end-frame")) requestedOutputs.push("endFramePrompt");
      if (["video-lock", "video-prompt", "video-rules", "timeline"].some((section) => affected.has(section as never))) requestedOutputs.push("videoPrompt");
      if (affected.has("music")) requestedOutputs.push("musicPath");
      if (affected.has("sound-effects")) requestedOutputs.push("soundEffects");
      const targets = [...new Set(requestedOutputs)].filter((output) => (production.generatedOutputs || []).includes(output));
      if (targets.length) {
        const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          action: "fix", form: production.form, creativeDirection: production.form.creativeDirection,
          activeCharacterIds: production.characterProfiles.map((character) => character.id),
          activeCharacters: production.characterProfiles.map(({ id, shortName, role, fullIdentity, description, nonverbalSoundProfile }) => ({ id, name: shortName, role, fullIdentity, description, nonverbalSoundProfile })),
          characters: production.characterProfiles, pack: repair.pack,
          qualityFindings: repair.newAnalysis.warnings.concat(repair.newAnalysis.failedChecks).map((check) => ({ label: check.label, status: check.status === "fail" ? "Failed" : "Warning", detail: check.message })),
          requestedOutputs: targets,
        }) }).catch(() => null);
        const data = response ? await response.json() as { pack?: Partial<ProductionPack> } : {};
        if (response?.ok && data.pack) {
          const candidatePack = { ...repair.pack, ...data.pack } as ProductionPack;
          const candidateAnalysis = analyzePromptPackage(candidatePack, promptQualityContext(production.form, production.characterProfiles, "ai", production.generatedOutputs || []));
          if (candidateAnalysis.score > repair.newAnalysis.score && candidateAnalysis.criticalIssueCount <= repair.newAnalysis.criticalIssueCount) repair = { ...repair, pack: candidatePack, newScore: candidateAnalysis.score, newAnalysis: candidateAnalysis, improvements: [...repair.improvements, "AI semantic repair refined only the affected prompt sections."] };
        }
      }
    }
    const updated = saveProductionRecord({
      ...production,
      pack: repair.pack,
      promptQuality: repair.newAnalysis,
      promptQualityHistory: [...(production.promptQualityHistory || []), { score: repair.newScore, label: repair.newAnalysis.label, analyzedAt: repair.newAnalysis.analyzedAt, analysisVersion: repair.newAnalysis.analysisVersion, reason: "manual-maximize" }],
      lastPromptQualityRepair: { previousScore: repair.previousScore, newScore: repair.newScore, changedSections: repair.changedSections, improvements: repair.improvements, repairedAt: new Date().toISOString() },
    });
    setProduction(updated);
    setNotice(repair.newScore > repair.previousScore ? `Prompt Quality improved from ${repair.previousScore}% to ${repair.newScore}%.` : "No safe prompt improvement was available.");
    setIsMaximizing(false);
  }

  async function downloadWord() {
    if (!production) return;
    const pack = production.pack;
    const children: Paragraph[] = [
      new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Production Summary" }),
      new Paragraph(`Production Title: ${production.title}`),
      new Paragraph(`Characters: ${production.characterProfiles.map((character) => character.shortName).join(", ") || "None"}`),
      new Paragraph(`Duration: ${production.form.duration} seconds`),
      new Paragraph(`Video model: ${production.videoModel}`),
      new Paragraph(`Video ratio: ${production.form.videoRatio}`),
    ];
    const addSection = (title: string, content?: string) => {
      if (!content?.trim()) return;
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: title }));
      content.trim().split(/\n+/).forEach((text) => children.push(new Paragraph(text)));
    };
    addSection("Character Details", buildAllCharacterDetails(production.characterProfiles) || pack.characterBuildingPrompt);
    addSection("Start Frame", pack.startFramePrompt);
    addSection("End Frame", pack.endFramePrompt);
    addSection("Complete Production Prompt", buildCompleteProductionPrompt(pack));
    if (availableTabs.includes("timeline")) addSection("Timeline", pack.videoTimeline);
    if (production.promptQuality) addSection("Prompt Quality Control", [
      `Prompt Quality Score: ${production.promptQuality.score}% — ${production.promptQuality.label}`,
      `Analysis date: ${production.promptQuality.analyzedAt}`,
      ...production.promptQuality.categories.map((category) => `${category.label}: ${category.earnedScore}/${category.maxScore}`),
      ...production.promptQuality.warnings.map((check) => `Warning: ${check.message}`),
      ...production.promptQuality.failedChecks.map((check) => `Failure: ${check.message}`),
      ...(production.lastPromptQualityRepair ? [`Last optimization: ${production.lastPromptQualityRepair.previousScore}% to ${production.lastPromptQualityRepair.newScore}%`, ...production.lastPromptQualityRepair.improvements] : []),
    ].join("\n"));
    const document = new Document({ sections: [{ children }] });
    saveAs(await Packer.toBlob(document), `${production.title.replace(/[^a-z0-9]+/gi, "_") || "production_pack"}.docx`);
    setNotice("Production pack downloaded as an editable Word document.");
  }

  if (production === undefined) return <main className="production-results-page"><section className="results-generating-state"><div className="results-generating-spinner" /><h1>Loading production pack…</h1></section></main>;
  if (!production) return <main className="production-results-page"><section className="results-failure-state"><h1>Production pack not found</h1><p>This production may have been removed or belongs to another browser.</p><div className="results-failure-actions"><Link href="/saved-packs" className="production-secondary-button">Return to Saved Packs</Link><Link href="/production/new" className="production-emerald-gold-cta">Create New Production</Link></div></section></main>;
  if (production.status === "generating") return <main className="production-results-page"><section className="results-generating-state"><div className="results-generating-spinner" /><h1>Generating your production pack…</h1><p>Building prompts, frames, timing, audio, and quality checks.</p><div className="results-generation-progress"><span /></div></section></main>;
  if (production.status === "failed") return <main className="production-results-page"><section className="results-failure-state"><h1>We could not complete this production pack.</h1><p>{production.error?.message || "The generation could not be completed. Your production settings are still saved."}</p><div className="results-failure-actions"><Link href={`/production/${production.id}/edit`} className="production-emerald-gold-cta">Try Again</Link><Link href={`/production/${production.id}/edit`} className="production-secondary-button">Return to Production</Link></div></section></main>;

  const pack = production.pack;
  const completePrompt = buildCompleteProductionPrompt(pack);
  const allCharacters = buildAllCharacterDetails(production.characterProfiles);
  const bothFrames = buildBothFrames(pack);

  return <main className="production-results-page">
    <header className="results-page-header"><div><p className="results-eyebrow">GENERATED PRODUCTION PACK</p><h1>{production.title}</h1><p>Review, copy, edit, save, or export your completed production pack.</p></div><div className="results-header-actions"><button type="button" className="production-secondary-button" onClick={savePack}>Save Pack</button><button type="button" className="production-secondary-button" onClick={downloadWord}>Download Word</button><Link href="/production/new" className="production-emerald-gold-cta">Create Another</Link></div></header>
    {notice && <p className="results-notice" role="status">{notice}</p>}
    <div className="results-tabs" role="tablist" aria-label="Generated outputs">{availableTabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={selectedTab === tab} className={`results-tab ${["character", "frames", "complete-production-prompt"].includes(tab) ? "is-primary-result" : "is-secondary-result"} ${selectedTab === tab ? "is-active" : ""}`} onClick={() => setActiveTab(tab)}>{RESULT_TAB_LABELS[tab]}</button>)}</div>
    <div className="results-workspace">
      <section className="results-output-viewer">
        {selectedTab === "character" && <section className="results-character-viewer"><header className="results-content-header"><div><p className="results-output-eyebrow">SELECTED CAST</p><h2>Characters</h2><p>Review the identities used in this production.</p></div><button type="button" className="production-secondary-button" onClick={() => copyText(allCharacters, "All character details copied.")}>Copy All Character Details</button></header><div className="results-character-list">{production.characterProfiles.map((character) => <article className="results-character-card" key={character.id}><div className="results-character-summary"><div><h3>{character.shortName}</h3><p className="results-character-role">{character.role}</p><p className="results-character-identity">{character.fullIdentity || character.description}</p></div><div className="results-character-actions"><button type="button" className="production-secondary-button" aria-expanded={expandedCharacterIds.includes(character.id)} onClick={() => toggleCharacterDetails(character.id)}>{expandedCharacterIds.includes(character.id) ? "Hide Details" : "Expand Details"}</button><button type="button" className="production-secondary-button" onClick={() => copyText(characterDetails(character), `${character.shortName} copied.`)}>Copy {character.shortName}</button></div></div>{expandedCharacterIds.includes(character.id) && <div className="results-character-details">{characterDetails(character)}</div>}</article>)}</div></section>}
        {selectedTab === "frames" && <section className="results-frames-viewer"><header className="results-content-header"><div><p className="results-output-eyebrow">REFERENCE FRAMES</p><h2>Start &amp; End Frames</h2><p>Review the opening and final compositions for the production.</p></div><button type="button" className="production-emerald-gold-cta" onClick={() => copyText(bothFrames, "Start and end frames copied.")}>Copy Both Frames</button></header><div className="results-frames-grid"><FrameResultPanel title="Start Frame" prompt={pack.startFramePrompt} onCopy={() => copyText(pack.startFramePrompt || "", "Start frame copied.")} /><FrameResultPanel title="End Frame" prompt={pack.endFramePrompt} onCopy={() => copyText(pack.endFramePrompt || "", "End frame copied.")} /></div></section>}
        {selectedTab === "complete-production-prompt" && <section className="complete-production-prompt-viewer"><header className="results-content-header"><div><p className="results-output-eyebrow">COMPLETE MODEL-READY PACKAGE</p><h2>Complete Production Prompt</h2><p>Copy the full continuity lock, video direction, audio guidance, and execution safeguards in one action.</p></div><button type="button" className="production-emerald-gold-cta" onClick={() => copyText(completePrompt, "Complete production prompt copied.")}>Copy Complete Production Prompt</button></header><div className="complete-production-prompt-sections"><PromptResultSection title="Video Lock" content={pack.videoLock} copyLabel="Copy Video Lock" onCopy={() => copyText(pack.videoLock || "", "Video Lock copied.")} /><PromptResultSection title="Video Prompt" content={pack.videoTimeline} copyLabel="Copy Video Prompt" onCopy={() => copyText(pack.videoTimeline || "", "Video Prompt copied.")} /><PromptResultSection title="Music Direction" content={pack.musicPath} copyLabel="Copy Music" onCopy={() => copyText(pack.musicPath || "", "Music copied.")} /><PromptResultSection title="Sound Effects Direction" content={pack.soundEffects} copyLabel="Copy Sound Effects" onCopy={() => copyText(pack.soundEffects || "", "Sound effects copied.")} /><PromptResultSection title="Video Rules" content={pack.finalGenerationRule} copyLabel="Copy Video Rules" onCopy={() => copyText(pack.finalGenerationRule || "", "Video Rules copied.")} /></div></section>}
        {selectedTab === "timeline" && <section className="results-single-viewer"><header className="results-content-header"><div><p className="results-output-eyebrow">TIMELINE</p><h2>Action Timeline</h2></div><button type="button" className="production-secondary-button" onClick={() => copyText(pack.videoTimeline || "", "Timeline copied.")}>Copy Timeline</button></header><div className="results-output-content">{pack.videoTimeline}</div></section>}
        {selectedTab === "prompt-quality" && production.promptQuality && <PromptQualityPanel analysis={production.promptQuality} onMaximize={handleMaximizePromptQuality} isMaximizing={isMaximizing} lastRepair={production.lastPromptQualityRepair} />}
      </section>
      <aside className="results-summary-sidebar"><h2>Production Summary</h2><SummaryItem label="Title" value={production.title} /><SummaryItem label="Characters" value={`${production.characterProfiles.length}`} /><SummaryItem label="Character names" value={production.characterProfiles.map((character) => character.shortName).join(", ") || "None"} /><SummaryItem label="Duration" value={`${production.form.duration} seconds`} /><SummaryItem label="Model" value={production.videoModel} /><SummaryItem label="Ratio" value={production.form.videoRatio} /><SummaryItem label="Outputs" value={`${(production.generatedOutputs || []).filter((output) => output !== "videoTitle").length} generated`} />{production.promptQuality && <button type="button" className="results-quality-summary-link" onClick={() => setActiveTab("prompt-quality")}><span>Prompt Quality</span><strong>{production.promptQuality.score}% — {production.promptQuality.label}</strong></button>}<Link href={`/production/${production.id}/edit`} className="production-secondary-button">Edit Production</Link></aside>
    </div>
    <footer className="results-bottom-actions"><Link href={`/production/${production.id}/edit`} className="production-secondary-button">Regenerate Selected Output</Link><Link href="/production/new" className="production-emerald-gold-cta">Generate Another Pack</Link></footer>
  </main>;
}
