import { CreativeAsset, CreativeAssetKind } from "./production-types";

export const CREATIVE_LIBRARY_STORAGE_KEY = "slapstick-creative-library-v1";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

export function normalizeCreativeIdentity(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function migrateCreativeAsset(value: unknown): CreativeAsset | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const kind = clean(item.kind) as CreativeAssetKind;
  const name = clean(item.name);
  const description = clean(item.description);
  if (!["location", "object", "action", "payoff"].includes(kind) || !name || !description) return null;
  const now = new Date().toISOString();
  return {
    id: clean(item.id) || crypto.randomUUID(),
    kind,
    name: name.slice(0, 100),
    description: description.slice(0, 4000),
    createdAt: clean(item.createdAt) || now,
    updatedAt: clean(item.updatedAt) || now,
    isSignature: kind === "location" && item.isSignature === true,
    builtIn: item.builtIn === true,
  };
}

export function parseCreativeLibrary(raw: string | null) {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return mergeCreativeAssets([], parsed.map(migrateCreativeAsset).filter((item): item is CreativeAsset => Boolean(item)));
  } catch {
    return [];
  }
}

export function mergeCreativeAssets(current: CreativeAsset[], incoming: CreativeAsset[]) {
  const result = [...current];
  incoming.forEach((asset) => {
    const identity = `${asset.kind}:${normalizeCreativeIdentity(asset.name)}`;
    const index = result.findIndex((item) =>
      item.id === asset.id || `${item.kind}:${normalizeCreativeIdentity(item.name)}` === identity);
    if (index >= 0) {
      if (!result[index].builtIn) result[index] = { ...asset, id: result[index].id, builtIn: false };
    } else result.push({ ...asset });
  });
  const signatureLocations = result.filter((asset) => asset.kind === "location" && asset.isSignature);
  if (signatureLocations.length > 1) {
    const keep = signatureLocations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0].id;
    return result.map((asset) => asset.kind === "location" ? { ...asset, isSignature: asset.id === keep } : asset);
  }
  return result;
}

export function creativeCollision(candidate: Pick<CreativeAsset, "name" | "description">, saved: CreativeAsset[]) {
  const name = normalizeCreativeIdentity(candidate.name);
  const keywords = new Set(normalizeCreativeIdentity(candidate.description).split(" ").filter((word) => word.length > 5));
  return saved.some((asset) => {
    if (normalizeCreativeIdentity(asset.name) === name) return true;
    const other = new Set(normalizeCreativeIdentity(asset.description).split(" ").filter((word) => word.length > 5));
    const overlap = [...keywords].filter((word) => other.has(word)).length;
    return keywords.size >= 4 && overlap / keywords.size >= 0.6;
  });
}
