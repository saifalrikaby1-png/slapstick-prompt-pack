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

export const PRODUCTION_RECORDS_KEY = "slapstick-saved-packs";

export type ProductionStatus = "draft" | "generating" | "completed" | "failed";

export type ProductionRecord = SavedProductionPack & {
  status: ProductionStatus;
  updatedAt: string;
  generationMode: "ai" | "demo";
  error?: { message: string; code?: string };
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
      .map(({ raw, migrated: entry }) => {
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
    title: input.form.videoTitle.trim() || existing?.title || "Untitled Production",
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
