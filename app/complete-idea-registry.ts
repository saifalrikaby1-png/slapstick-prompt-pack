export type CompleteFingerprint = { settingCategory: string; objectCategory: string; actionMechanic: string; initiatingCharacter: string; escalationPattern: string; movementPath: string; payoffPattern: string };
export type CompleteIdeaRegistryEntry = { normalizedTitle: string; normalizedLocation: string; normalizedObject: string; normalizedAction: string; normalizedPayoff: string; significantTitleTerms: string[]; creativeFingerprint: CompleteFingerprint; conceptHash: string; actionSignatureHash?: string; generationMode?: "ai" | "demo"; createdAt: string };

const ignored = new Set(["the", "a", "an", "video", "adventure", "funny", "crazy", "big", "amazing", "and", "with"]);
export function normalizeIdeaValue(value: string) { return value.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\b(ies)\b/g, "y").replace(/\s+/g, " ").trim(); }
export function significantTerms(value: string) { return [...new Set(normalizeIdeaValue(value).split(" ").filter((term) => term.length > 2 && !ignored.has(term)))]; }
export function conceptHash(entry: Omit<CompleteIdeaRegistryEntry, "conceptHash" | "createdAt">) { return [entry.normalizedTitle, entry.normalizedLocation, entry.normalizedObject, entry.normalizedAction, entry.normalizedPayoff, ...Object.values(entry.creativeFingerprint).map(normalizeIdeaValue)].join("|"); }
const actionAxis = (value: string) => normalizeIdeaValue(value).replace(/\b\d+\b/g, "").trim();
export function actionSignatureHash(entry: Pick<CompleteIdeaRegistryEntry, "creativeFingerprint" | "normalizedAction" | "normalizedPayoff">) { return [actionAxis(entry.creativeFingerprint.actionMechanic), actionAxis(entry.creativeFingerprint.movementPath), actionAxis(entry.creativeFingerprint.escalationPattern), actionAxis(entry.creativeFingerprint.payoffPattern), actionAxis(entry.normalizedAction), actionAxis(entry.normalizedPayoff)].join("|"); }
const overlap = (left: string[], right: string[]) => left.filter((term) => right.includes(term)).length;
export function isCompleteIdeaTooSimilar(candidate: CompleteIdeaRegistryEntry, existing: CompleteIdeaRegistryEntry) {
  const candidateAction = candidate.actionSignatureHash || actionSignatureHash(candidate);
  const existingAction = existing.actionSignatureHash || actionSignatureHash(existing);
  if (candidate.conceptHash === existing.conceptHash || candidate.normalizedTitle === existing.normalizedTitle || candidateAction === existingAction) return true;
  const core = ["normalizedLocation", "normalizedObject", "normalizedAction", "normalizedPayoff"] as const;
  const sameCore = core.filter((key) => candidate[key] === existing[key]).length;
  const axes = (Object.keys(candidate.creativeFingerprint) as Array<keyof CompleteFingerprint>).filter((key) => normalizeIdeaValue(candidate.creativeFingerprint[key]) === normalizeIdeaValue(existing.creativeFingerprint[key])).length;
  const titleSimilar = overlap(candidate.significantTitleTerms, existing.significantTitleTerms) >= Math.max(2, Math.min(candidate.significantTitleTerms.length, existing.significantTitleTerms.length) - 1);
  // A saved project may not have the richer seven-axis fingerprint that a
  // newly generated idea has. Four identical connected story fields are
  // already a repeat premise, regardless of that missing historical detail.
  return sameCore >= 4 || (sameCore >= 3 && axes >= 4) || (sameCore >= 2 && axes >= 5) || (titleSimilar && sameCore >= 2);
}
export function parseCompleteIdeaRegistry(raw: string | null) { try { const parsed = JSON.parse(raw || "[]"); return Array.isArray(parsed) ? parsed.filter((entry): entry is CompleteIdeaRegistryEntry => Boolean(entry && typeof entry.conceptHash === "string" && entry.creativeFingerprint)).map((entry) => ({ ...entry, actionSignatureHash: typeof entry.actionSignatureHash === "string" ? entry.actionSignatureHash : actionSignatureHash(entry) })).slice(-1000) : []; } catch { return []; } }
