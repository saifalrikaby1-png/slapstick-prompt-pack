import {
  CharacterProfile,
  ProductionForm,
  ProductionPack,
  QualityReport,
  RequestedOutput,
  SavedProductionPack,
  StoredPack,
} from "./production-types";
import { migrateStoredPack } from "./production-engine";
import type { PromptPackageSectionId, PromptQualityAnalysis } from "./prompt-quality";
import { conceptInputFromForm, generateWorkingTitleFromResolvedConcept, resolveProductionConceptSync } from "./production-concept";

export const PRODUCTION_RECORDS_KEY = "slapstick-saved-packs";

export type ProductionStatus = "draft" | "generating" | "completed" | "failed";

export type ProductionRecord = SavedProductionPack & {
  status: ProductionStatus;
  updatedAt: string;
  generationMode: "ai" | "demo";
  error?: { message: string; code?: string };
  promptQuality?: PromptQualityAnalysis;
  promptQualityHistory?: Array<{ score: number; label: string; analyzedAt: string; analysisVersion: string; reason: "initial" | "automatic-repair" | "manual-maximize" }>;
  lastPromptQualityRepair?: { previousScore: number; newScore: number; changedSections: PromptPackageSectionId[]; improvements: string[]; repairedAt: string };
};

export type ProductionRecordInput = {
  id?: string;
  status: ProductionStatus;
  form: ProductionForm;
  characterProfiles: CharacterProfile[];
  pack?: ProductionPack;
  qualityReport?: QualityReport;
  outputSelectionMode: "custom" | "fullPack";
  customRequestedOutputs: RequestedOutput[];
  requestedOutputs: RequestedOutput[];
  generatedOutputs: RequestedOutput[];
  generationMode: "ai" | "demo";
  platform: string;
  videoModel: string;
  promptQuality?: PromptQualityAnalysis;
  promptQualityReason?: "initial" | "automatic-repair" | "manual-maximize";
  lastPromptQualityRepair?: ProductionRecord["lastPromptQualityRepair"];
};

function isProductionRecord(value: StoredPack | ProductionRecord): value is ProductionRecord {
  return value.schemaVersion === 2 && typeof (value as Partial<ProductionRecord>).status === "string";
}

export function readProductionRecords(): ProductionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PRODUCTION_RECORDS_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((raw) => ({ raw, migrated: migrateStoredPack(raw) }))
      .filter((entry): entry is { raw: unknown; migrated: SavedProductionPack } => Boolean(entry.migrated?.schemaVersion === 2))
      .map(({ raw, migrated: entry }): ProductionRecord => {
        if (raw && typeof raw === "object" && typeof (raw as Partial<ProductionRecord>).status === "string") {
          return { ...entry, ...(raw as ProductionRecord) };
        }
        if (isProductionRecord(entry)) return entry;
        return {
          ...entry,
          status: "completed",
          updatedAt: entry.createdAt,
          generationMode: "demo",
        };
      })
      .map((record): ProductionRecord => {
        if (record.resolvedProductionConcept || !record.characterProfiles.length) return record;
        const resolvedProductionConcept = { ...resolveProductionConceptSync(conceptInputFromForm(record.form, record.characterProfiles, record.generationMode)), source: "migrated" as const };
        return { ...record, resolvedProductionConcept, form: { ...record.form, resolvedProductionConcept } };
      });
  } catch {
    return [];
  }
}

export function findProductionRecord(id: string): ProductionRecord | null {
  return readProductionRecords().find((record) => record.id === id) || null;
}

export function upsertProductionRecord(input: ProductionRecordInput): ProductionRecord {
  const records = readProductionRecords();
  const existing = input.id ? records.find((record) => record.id === input.id) : undefined;
  const now = new Date().toISOString();
  const pack = input.pack || existing?.pack || {};
  const record: ProductionRecord = {
    id: input.id || crypto.randomUUID(),
    schemaVersion: 2,
    title: input.form.videoTitle.trim() || (input.form.resolvedProductionConcept ? generateWorkingTitleFromResolvedConcept(input.form.resolvedProductionConcept) : existing?.title) || "Untitled Production",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    status: input.status,
    platform: input.platform,
    videoModel: input.videoModel,
    duration: input.form.duration,
    form: { ...input.form },
    characterProfiles: input.characterProfiles,
    pack,
    qualityReport: input.qualityReport || existing?.qualityReport || { score: 0, findings: [] },
    outputSelectionMode: input.outputSelectionMode,
    customRequestedOutputs: [...input.customRequestedOutputs],
    requestedOutputs: [...input.requestedOutputs],
    generatedOutputs: [...input.generatedOutputs],
    packStatus: input.generatedOutputs.length === 7 ? "Complete Pack" : "Partial Pack",
    generationMode: input.generationMode,
    resolvedProductionConcept: input.form.resolvedProductionConcept || existing?.resolvedProductionConcept,
    promptQuality: input.promptQuality || existing?.promptQuality,
    promptQualityHistory: input.promptQuality
      ? [...(existing?.promptQualityHistory || []), {
          score: input.promptQuality.score,
          label: input.promptQuality.label,
          analyzedAt: input.promptQuality.analyzedAt,
          analysisVersion: input.promptQuality.analysisVersion,
          reason: input.promptQualityReason || "initial",
        }]
      : existing?.promptQualityHistory,
    lastPromptQualityRepair: input.lastPromptQualityRepair || existing?.lastPromptQualityRepair,
  };
  const next = [record, ...records.filter((entry) => entry.id !== record.id)];
  localStorage.setItem(PRODUCTION_RECORDS_KEY, JSON.stringify(next));
  return record;
}

export function markProductionFailed(id: string, message: string): ProductionRecord | null {
  const record = findProductionRecord(id);
  if (!record) return null;
  const next = { ...record, status: "failed" as const, updatedAt: new Date().toISOString(), error: { message } };
  localStorage.setItem(PRODUCTION_RECORDS_KEY, JSON.stringify([
    next,
    ...readProductionRecords().filter((entry) => entry.id !== id),
  ]));
  return next;
}

export function saveProductionRecord(record: ProductionRecord): ProductionRecord {
  const saved = { ...record, updatedAt: new Date().toISOString() };
  localStorage.setItem(PRODUCTION_RECORDS_KEY, JSON.stringify([
    saved,
    ...readProductionRecords().filter((entry) => entry.id !== record.id),
  ]));
  return saved;
}
