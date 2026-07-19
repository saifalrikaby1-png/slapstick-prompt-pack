"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CharacterProfile,
  CharacterRole,
  CreativeAsset,
  CreativeAssetKind,
  GeneratorMode,
  LegacySavedPack,
  ProductionForm,
  ProductionPack,
  ProjectPreset,
  QualityReport,
  SavedProductionPack,
  StoredPack,
  VoiceLayer,
  defaultProductionForm,
} from "./production-types";
import {
  audioVideoPrompt,
  buildAuthorizedSceneInventory,
  buildObjectStateLedger,
  characterDescription,
  completeVideoPrompt,
  generateDemoPack,
  inspectProductionPack,
  migrateCharacter,
  migrateForm,
  migrateStoredPack,
  selectedModel,
  selectedPlatform,
  selectedStyle,
  selectedTone,
  visualVideoPrompt,
} from "./production-engine";
import {
  CREATIVE_LIBRARY_STORAGE_KEY,
  creativeCollision,
  mergeCreativeAssets,
  migrateCreativeAsset,
  normalizeCreativeIdentity,
  parseCreativeLibrary,
} from "./creative-library";

const STORAGE = {
  characters: "slapstick-character-library",
  presets: "slapstick-project-presets",
  packs: "slapstick-saved-packs",
  form: "slapstick-current-setup",
  creative: CREATIVE_LIBRARY_STORAGE_KEY,
};

const roles: CharacterRole[] = ["Hero", "Companion", "Enemy"];

const emptyCharacter: CharacterProfile = {
  id: "",
  shortName: "",
  fullIdentity: "",
  role: "Companion",
  description: "",
  appearanceLock: "",
  personalityLock: "",
  colorLock: "",
  scaleLock: "",
  vocalStyleLock: "",
  movementStyle: "",
  continuityRules: "",
  negativeRules: "No duplication, species changes, color drift, extra limbs, morphing, substitutions, or role changes.",
};

const builtInCharacters: CharacterProfile[] = [
  {
    id: "builtin-biscuit",
    builtIn: true,
    shortName: "Biscuit",
    fullIdentity: "Biscuit the Orange Squirrel",
    role: "Hero",
    description: `Full identity: Biscuit the Orange Squirrel
Species or character type: small anthropomorphic orange squirrel hero
Role: clever, kind, quick-thinking hero who clearly wins the final payoff
Appearance: compact athletic body, large warm brown eyes, cream muzzle and belly, oversized expressive tail with a cream tip
Primary and secondary colors: vivid warm orange fur with soft cream markings and dark cocoa nose
Clothing and accessories: no clothing or accessories unless explicitly added for an episode
Scale and proportions: small and agile; shorter than Grumpy and much shorter than fully extended Sneaky; stable head-to-body ratio and tail volume
Personality: upbeat, curious, brave, observant, and playful without cruelty
Facial-expression style: large readable eyes, clear brows, confident smiles, surprised gasps, and decisive victory expressions
Movement style: quick hops, light scampering, tail-balanced jumps, precise turns, and clean landings
Signature actions: alert tail flick, spring-loaded dodge, midair turn, and confident prize-holding victory pose
Voice profile: bright family-friendly squirrel energy; non-verbal squeaks, tiny gasps, and playful chuckles when dialogue is disabled
Continuity rules: preserve species, face, orange-and-cream markings, proportions, tail shape, scale, hero role, and movement language
Negative identity rules: do not duplicate Biscuit; no extra squirrels, color changes, missing tail, random outfits, morphing face, extra limbs, distorted anatomy, or role reversal`,
    appearanceLock: "Small orange squirrel with cream muzzle, belly, and tail tip; large brown eyes; compact paws; oversized expressive tail.",
    personalityLock: "Clever, upbeat, curious, brave, observant, and clearly heroic.",
    colorLock: "Warm orange, soft cream markings, brown eyes, dark cocoa nose; no color drift.",
    scaleLock: "Small and agile; shorter than Grumpy and Sneaky; stable proportions and tail volume.",
    vocalStyleLock: "Bright family-friendly energy with consistent non-verbal squeaks and playful reactions.",
    movementStyle: "Quick hops, tail-balanced jumps, light scampering, precise turns, and clean landings.",
    continuityRules: "Biscuit remains the same orange squirrel hero and clearly completes the ending payoff.",
    negativeRules: "No duplicates, extra squirrels, color changes, missing tail, morphing, extra limbs, random outfits, or role reversal.",
  },
  {
    id: "builtin-grumpy",
    builtIn: true,
    shortName: "Grumpy",
    fullIdentity: "Grumpy the Purple Hedgehog",
    role: "Enemy",
    description: `Full identity: Grumpy the Purple Hedgehog
Species or character type: stocky anthropomorphic purple hedgehog
Role: family-friendly enemy and overconfident trap builder
Appearance: low sturdy silhouette, rounded lavender muzzle, thick brows, small dark eyes, short legs, compact paws, and blunt plum-purple quills
Primary and secondary colors: rich plum purple with soft lavender muzzle and belly and deep aubergine details
Clothing and accessories: none unless explicitly requested
Scale and proportions: wider and slightly taller than Biscuit; compact and weighty; stable quill volume
Personality: stubborn, theatrical, impatient, mischievous, and comically competitive
Facial-expression style: heavy brows, smug squints, frustrated grimaces, and exaggerated surprised reactions
Movement style: stompy waddles, stubborn charges, braced pushes, short hops, and controlled rolling tumbles
Signature actions: foot stomp, determined charge, defensive curl, and harmless wobbling recovery
Voice profile: low funny grumbles, effort huffs, and surprised squeaks
Continuity rules: preserve purple hedgehog identity, quills, stocky scale, enemy role, and weighty movement
Negative identity rules: do not duplicate Grumpy; no extra hedgehogs, species changes, palette drift, missing quills, role swapping, morphing, or extra limbs`,
    appearanceLock: "Stocky purple hedgehog with lavender muzzle, thick brows, dark eyes, short legs, and blunt plum quills.",
    personalityLock: "Stubborn, theatrical, impatient, mischievous, and family-friendly.",
    colorLock: "Rich plum purple, lavender muzzle and belly, aubergine brows and nose.",
    scaleLock: "Wider and slightly taller than Biscuit; compact, weighty, and stable.",
    vocalStyleLock: "Low funny grumbles, effort huffs, and surprised squeaks.",
    movementStyle: "Stompy waddles, stubborn charges, short hops, and controlled rolling tumbles.",
    continuityRules: "Grumpy remains the same purple hedgehog enemy and receives the harmless consequence.",
    negativeRules: "No duplicates, extra hedgehogs, palette drift, missing quills, role swaps, morphing, or extra limbs.",
  },
  {
    id: "builtin-sneaky",
    builtIn: true,
    shortName: "Sneaky",
    fullIdentity: "Sneaky the Green Chameleon",
    role: "Enemy",
    description: `Full identity: Sneaky the Green Chameleon
Species or character type: lean anthropomorphic green chameleon
Role: stealthy family-friendly enemy who works with Grumpy
Appearance: long curved silhouette, lime-green skin, mint belly, large amber eyes, curled tail, mitten-like feet, soft scales, and elastic pink tongue
Primary and secondary colors: bright leaf green, pale mint, forest-green accents, amber eyes, and soft pink tongue
Clothing and accessories: none unless explicitly requested
Scale and proportions: tallest when fully extended; stable tail diameter, limb length, eye size, and body thickness
Personality: patient, crafty, observant, smug, and comically overconfident
Facial-expression style: independent eye movement, sly half-smiles, startled wide eyes, and readable defeat reactions
Movement style: sneaky crawls, careful tiptoe steps, tongue snaps, camouflage pauses, and curled-tail balancing
Signature actions: slow peek, tongue flick, smug pause, tail-supported reach, and elastic recoil
Voice profile: sly chuckles, tiny tongue snaps, and startled chirps
Continuity rules: preserve green chameleon identity, amber eyes, curled tail, proportions, enemy role, and stealthy motion
Negative identity rules: do not duplicate Sneaky; no extra chameleons, uncontrolled color changes, missing tail, role swapping, morphing, or extra limbs`,
    appearanceLock: "Lean green chameleon with mint belly, amber eyes, curled tail, mitten-like feet, and pink tongue.",
    personalityLock: "Patient, crafty, observant, smug, and comically overconfident.",
    colorLock: "Leaf green, pale mint, forest accents, amber eyes, and soft pink tongue.",
    scaleLock: "Tallest when extended; stable limb length, eye size, tail diameter, and body thickness.",
    vocalStyleLock: "Sly chuckles, tongue snaps, and startled chirps.",
    movementStyle: "Sneaky crawls, careful tiptoes, tongue snaps, camouflage pauses, and tail balancing.",
    continuityRules: "Sneaky remains the same green chameleon enemy and receives the harmless consequence.",
    negativeRules: "No duplicates, extra chameleons, color drift, missing tail, role swaps, morphing, or extra limbs.",
  },
];

const biscuitForm: ProductionForm = {
  ...defaultProductionForm,
  videoTitle: "Biscuit and the Golden Log Reversal",
  locationName: "Golden Cookie Clearing",
  location: "a bright woodland cookie clearing with a smooth dirt path and warm morning light",
  objectName: "Glow-Crumb Cookie",
  importantObject: "one glowing golden cookie on a low tree-stump pedestal",
  actionName: "Rolling Log Reversal",
  trapAction: "Grumpy and Sneaky trigger a rolling log trap; Biscuit makes one clean dodge and the same log rolls back toward them",
  payoffName: "Cookie Victory Tangle",
  endingPayoff: "Biscuit safely holds the glowing cookie in a clear victory pose while Grumpy and Sneaky sit harmlessly tangled behind the stopped log",
  tones: ["Funny", "Fast", "Chaotic slapstick"],
  additionalDirection: "",
};

const builtInPreset: ProjectPreset = {
  id: "builtin-biscuit-trouble-crew",
  name: "Biscuit & the Trouble Crew",
  form: biscuitForm,
  builtIn: true,
};

const platforms = ["Social Media", "Custom"];
const videoModels = ["Seedance", "Kling", "Google Flow / Veo", "Runway", "Higgsfield", "PixVerse", "Hailuo / MiniMax", "Generic model", "Custom model"];
const durations = Array.from({ length: 12 }, (_, index) => String((index + 1) * 5));
const visualStyles = ["Cinematic 3D family animation", "Stylized 3D cartoon", "High-quality 3D animation", "2D cartoon", "Anime", "Clay animation", "Stop-motion", "Realistic cinematic", "Storybook illustration", "Custom"];
const tones = ["Calm", "Cute", "Playful", "Funny", "Energetic", "Fast", "Chaotic slapstick", "Suspenseful", "Emotional", "Magical", "Educational", "Custom"];
const ratios = ["9:16", "16:9", "1:1", "4:5", "5:4", "3:4", "4:3", "2:3", "3:2", "21:9", "2.39:1", "Custom"];
const voiceLayerOptions: VoiceLayer[] = ["Narrator", "Hero Voice", "Companion Voices", "Enemy Voices", "No Spoken Dialogue"];

function safeArray(value: string | null) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeObject(value: string | null) {
  try {
    const parsed = JSON.parse(value || "null");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function mergeCharacterLibraries(
  current: CharacterProfile[],
  incoming: CharacterProfile[],
) {
  const result = builtInCharacters.map((builtIn) => ({ ...builtIn }));
  [...current, ...incoming].forEach((profile) => {
    if (builtInCharacters.some((builtIn) => builtIn.id === profile.id)) return;
    const index = result.findIndex((entry) =>
      entry.id === profile.id ||
      entry.fullIdentity.toLowerCase() === profile.fullIdentity.toLowerCase());
    const safe = { ...profile, builtIn: false };
    if (index >= 0) result[index] = { ...safe, id: result[index].id };
    else result.push(safe);
  });
  return result;
}

function qualityText(report: QualityReport) {
  return `QUALITY-CONTROL REPORT
Score: ${report.score}/100

${report.findings.map((finding) =>
    `${finding.status.toUpperCase()} — ${finding.label}\n${finding.detail}`).join("\n\n")}`;
}

export function safeWordFilename(title: string, date = new Date()) {
  const safeTitle = title.replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "production-pack";
  return `slapstick-prompt-pack-${safeTitle}-${date.toISOString().slice(0, 10)}.docx`.toLowerCase();
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }
  return <button className="copy-button" type="button" onClick={copy}>{copied ? "Copied ✓" : label}</button>;
}

function RatioControl({
  label,
  value,
  width,
  height,
  onRatio,
  onWidth,
  onHeight,
}: {
  label: string;
  value: string;
  width: string;
  height: string;
  onRatio: (value: string) => void;
  onWidth: (value: string) => void;
  onHeight: (value: string) => void;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onRatio(event.target.value)}>
        {ratios.map((ratio) => <option key={ratio}>{ratio}</option>)}
      </select>
      {value === "Custom" && (
        <div className="inline-fields">
          <input aria-label={`${label} width`} inputMode="numeric" value={width} onChange={(event) => onWidth(event.target.value)} placeholder="Width" />
          <input aria-label={`${label} height`} inputMode="numeric" value={height} onChange={(event) => onHeight(event.target.value)} placeholder="Height" />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [form, setForm] = useState<ProductionForm>(defaultProductionForm);
  const [characters, setCharacters] = useState<CharacterProfile[]>(builtInCharacters);
  const [creativeAssets, setCreativeAssets] = useState<CreativeAsset[]>([]);
  const [draft, setDraft] = useState<CharacterProfile>(builtInCharacters[0]);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [presets, setPresets] = useState<ProjectPreset[]>([builtInPreset]);
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState(builtInPreset.id);
  const [savedPacks, setSavedPacks] = useState<StoredPack[]>([]);
  const [mode, setMode] = useState<GeneratorMode>("demo");
  const [pack, setPack] = useState<ProductionPack | null>(null);
  const [legacyPack, setLegacyPack] = useState<LegacySavedPack | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestingField, setSuggestingField] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const libraryImportRef = useRef<HTMLInputElement>(null);
  const presetImportRef = useRef<HTMLInputElement>(null);
  const creativeImportRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const hydrationTask = window.setTimeout(() => {
      const storedCharacters = safeArray(localStorage.getItem(STORAGE.characters))
        .map(migrateCharacter)
        .filter((entry): entry is CharacterProfile => Boolean(entry));
      const mergedCharacters = mergeCharacterLibraries([], storedCharacters);
      setCharacters(mergedCharacters);
      const storedForm = safeObject(localStorage.getItem(STORAGE.form));
      if (storedForm) {
        const migrated = migrateForm(storedForm);
        migrated.activeCharacterIds = [...new Set(migrated.activeCharacterIds)]
          .filter((id) => mergedCharacters.some((profile) => profile.id === id));
        setForm(migrated);
      }
      const storedPresets = safeArray(localStorage.getItem(STORAGE.presets))
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const item = entry as Record<string, unknown>;
          if (typeof item.id !== "string" || typeof item.name !== "string") return null;
          return { id: item.id, name: item.name, form: migrateForm(item.form) } satisfies ProjectPreset;
        })
        .filter((entry): entry is ProjectPreset => Boolean(entry));
      setPresets([builtInPreset, ...storedPresets.filter((entry) => entry.id !== builtInPreset.id)]);
      setSavedPacks(safeArray(localStorage.getItem(STORAGE.packs))
        .map(migrateStoredPack)
        .filter((entry): entry is StoredPack => Boolean(entry)));
      const storedCreative = parseCreativeLibrary(localStorage.getItem(STORAGE.creative));
      setCreativeAssets(storedCreative);
      const signature = storedCreative.find((asset) => asset.kind === "location" && asset.isSignature);
      if (signature && !storedForm) {
        setForm((current) => ({
          ...current,
          locationAssetId: signature.id,
          locationName: signature.name,
          location: signature.description,
        }));
      }
      hydratedRef.current = true;
    }, 0);
    return () => window.clearTimeout(hydrationTask);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.characters, JSON.stringify(characters));
  }, [characters]);
  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.presets, JSON.stringify(presets.filter((preset) => !preset.builtIn)));
  }, [presets]);
  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.packs, JSON.stringify(savedPacks));
  }, [savedPacks]);
  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.form, JSON.stringify(form));
  }, [form]);
  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem(STORAGE.creative, JSON.stringify(creativeAssets));
  }, [creativeAssets]);

  const activeIds = [...new Set(form.activeCharacterIds)].filter((id) => characters.some((profile) => profile.id === id));
  const productionCharacters = activeIds
    .map((id) => characters.find((profile) => profile.id === id))
    .filter((entry): entry is CharacterProfile => Boolean(entry));
  const hero = productionCharacters.find((profile) => profile.role === "Hero");
  const viewedCharacter = characters[characterIndex] || characters[0];
  const qualityReport = useMemo(
    () => pack ? inspectProductionPack(pack, form, characters, savedPacks.map((saved) => saved.title), creativeAssets) : null,
    [pack, form, characters, savedPacks, creativeAssets],
  );
  const completePrompt = pack ? completeVideoPrompt(pack) : "";
  const visualPrompt = pack ? visualVideoPrompt(pack) : "";
  const audioPrompt = pack ? audioVideoPrompt(pack) : "";
  const isReady = Boolean(
    form.location.trim() &&
    form.importantObject.trim() &&
    form.trapAction.trim() &&
    form.endingPayoff.trim() &&
    form.tones.length > 0 &&
    (form.platform !== "Custom" || form.customPlatform.trim()) &&
    productionCharacters.length > 0 &&
    productionCharacters.filter((profile) => profile.role === "Hero").length === 1,
  );

  function update<K extends keyof ProductionForm>(key: K, value: ProductionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function sanitizeActiveText(value: string) {
    const inactive = characters.filter((profile) => !activeIds.includes(profile.id));
    let result = value;
    inactive.forEach((profile) => {
      const replacement = productionCharacters.find((active) => active.role === profile.role)?.shortName || hero?.shortName || "";
      [profile.fullIdentity, profile.shortName].forEach((name) => {
        result = result.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), replacement);
      });
      if (replacement) result = result.replace(new RegExp(`\\b${replacement}\\s+(?:and|&)\\s+${replacement}\\b`, "gi"), replacement);
    });
    return result.replace(/\s{2,}/g, " ").trim();
  }

  function formForGeneration() {
    const sanitized = {
      ...form,
      activeCharacterIds: activeIds,
      heroId: hero?.id || form.heroId,
      selectedCharacterIds: productionCharacters.filter((profile) => profile.role !== "Hero").map((profile) => profile.id),
      location: sanitizeActiveText(form.location),
      importantObject: sanitizeActiveText(form.importantObject),
      trapAction: sanitizeActiveText(form.trapAction),
      endingPayoff: sanitizeActiveText(form.endingPayoff),
      additionalDirection: sanitizeActiveText(form.additionalDirection),
      characterCartoonSoundGuidance: sanitizeActiveText(form.characterCartoonSoundGuidance),
    };
    if (sanitized.additionalDirection.trim()) return sanitized;
    const { additionalDirection: _blankDirection, ...withoutBlankDirection } = sanitized;
    void _blankDirection;
    return withoutBlankDirection;
  }

  const creativeFields: Record<CreativeAssetKind, {
    id: keyof ProductionForm;
    name: keyof ProductionForm;
    description: keyof ProductionForm;
  }> = {
    location: { id: "locationAssetId", name: "locationName", description: "location" },
    object: { id: "objectAssetId", name: "objectName", description: "importantObject" },
    action: { id: "actionAssetId", name: "actionName", description: "trapAction" },
    payoff: { id: "payoffAssetId", name: "payoffName", description: "endingPayoff" },
  };

  function selectCreativeAsset(kind: CreativeAssetKind, id: string) {
    const keys = creativeFields[kind];
    const asset = creativeAssets.find((item) => item.id === id && item.kind === kind);
    setForm((current) => ({
      ...current,
      [keys.id]: asset?.id || "",
      [keys.name]: asset?.name || "",
      [keys.description]: asset?.description || "",
    }));
    setNotice(asset ? `Using latest saved ${kind}: ${asset.name}.` : `${kind} cleared from this production.`);
  }

  function saveCreativeAsset(kind: CreativeAssetKind) {
    const keys = creativeFields[kind];
    const name = String(form[keys.name]).trim();
    const description = String(form[keys.description]).trim();
    if (!name || !description) {
      setError(`Add a ${kind} name and description before saving.`);
      return;
    }
    const currentId = String(form[keys.id]);
    const collision = creativeAssets.find((asset) =>
      asset.kind === kind && asset.id !== currentId &&
      normalizeCreativeIdentity(asset.name) === normalizeCreativeIdentity(name));
    if (collision) {
      setError(`A saved ${kind} already uses this name. Select it or choose a distinct name.`);
      return;
    }
    const now = new Date().toISOString();
    const existing = creativeAssets.find((asset) => asset.id === currentId && asset.kind === kind);
    const asset: CreativeAsset = {
      id: existing?.id || crypto.randomUUID(),
      kind,
      name,
      description,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      isSignature: kind === "location" ? Boolean(existing?.isSignature) : false,
    };
    setCreativeAssets((current) => mergeCreativeAssets(current, [asset]));
    setForm((current) => ({ ...current, [keys.id]: asset.id }));
    setNotice(`${name} ${existing ? "updated" : "saved"} in the Creative Library.`);
    setError("");
  }

  function deleteCreativeAsset(kind: CreativeAssetKind) {
    const keys = creativeFields[kind];
    const id = String(form[keys.id]);
    const asset = creativeAssets.find((item) => item.id === id);
    if (!asset || asset.builtIn) {
      setError(`Select a custom saved ${kind} to delete.`);
      return;
    }
    setCreativeAssets((current) => current.filter((item) => item.id !== id));
    setForm((current) => ({ ...current, [keys.id]: "" }));
    setNotice(`${asset.name} deleted from the Creative Library; current editable text was preserved.`);
  }

  function setSignatureLocation() {
    if (!form.locationAssetId) {
      setError("Save or select a location before setting it as the signature location.");
      return;
    }
    setCreativeAssets((current) => current.map((asset) =>
      asset.kind === "location" ? { ...asset, isSignature: asset.id === form.locationAssetId } : asset));
    setNotice(`${form.locationName} is now the one active Signature Location.`);
  }

  function toggleTone(tone: string) {
    const selected = form.tones.includes(tone);
    if (selected && form.tones.length === 1) {
      setError("Select at least one tone.");
      return;
    }
    update("tones", selected ? form.tones.filter((item) => item !== tone) : [...form.tones, tone]);
    setError("");
  }

  function toggleVoiceLayer(layer: VoiceLayer) {
    if (layer === "No Spoken Dialogue") {
      update("voiceLayers", form.voiceLayers.includes(layer) ? ["Hero Voice"] : ["No Spoken Dialogue"]);
      return;
    }
    const withoutSilent = form.voiceLayers.filter((item) => item !== "No Spoken Dialogue");
    update("voiceLayers", withoutSilent.includes(layer)
      ? withoutSilent.filter((item) => item !== layer)
      : [...withoutSilent, layer]);
  }

  function viewCharacter(index: number) {
    if (!characters.length) return;
    const next = (index + characters.length) % characters.length;
    setCharacterIndex(next);
    editCharacter(characters[next]);
  }

  function toggleActiveCharacter(id: string) {
    const selected = activeIds.includes(id);
    const next = selected ? activeIds.filter((entry) => entry !== id) : [...activeIds, id];
    const nextCharacters = next.map((entry) => characters.find((profile) => profile.id === entry))
      .filter((profile): profile is CharacterProfile => Boolean(profile));
    if (!selected && characters.find((profile) => profile.id === id)?.role === "Hero" &&
      nextCharacters.filter((profile) => profile.role === "Hero").length > 1) {
      setError("Only one Hero may be selected for a production.");
      return;
    }
    update("activeCharacterIds", next);
    const nextHero = nextCharacters.find((profile) => profile.role === "Hero");
    setForm((current) => ({
      ...current,
      activeCharacterIds: next,
      heroId: nextHero?.id || current.heroId,
      selectedCharacterIds: nextCharacters.filter((profile) => profile.role !== "Hero").map((profile) => profile.id),
    }));
    setError("");
  }

  async function suggestCreative(kind: CreativeAssetKind | "title", expand = false, collisionRetry = false) {
    setSuggestingField(kind);
    setError("");
    const keys = kind === "title" ? null : creativeFields[kind];
    const idea = kind === "title"
      ? form.videoTitle
      : `${String(form[keys!.name])}\n${String(form[keys!.description])}`.trim();
    try {
      let result: { name?: string; description?: string; title?: string; error?: string };
      if (mode === "demo") {
        const demoCandidates = {
          location: [
            { name: "Sunwheel Acorn Plaza", description: "A circular amber-stone woodland plaza beneath a giant spiral oak, with teal moss borders, warm honey light, three recurring acorn lanterns, radial ground grooves, and one distant ribbon waterfall. Preserve the spiral trunk, lantern count, palette, landmark positions, ground pattern, lighting direction, and open central action lane in every production." },
            { name: "Copperleaf Picnic Terrace", description: "A tidy copper-leaf woodland terrace with a cream stone rail, two blue pennants, soft afternoon light, and one wide central action lane. Preserve its landmark positions, palette, prop count, lighting direction, and uncluttered background." },
          ],
          object: [
            { name: "Moon-Spring Tart", description: "A palm-sized crescent pastry made of golden layered crust and blue sugar-glass filling, with one visible spring hinge. It compresses, rebounds, and rolls predictably; characters interact by pressing the crust edge. Preserve its crescent silhouette, gold-and-blue palette, size, hinge, material, starting compression, final state, and single-object count." },
            { name: "Copperberry Popper", description: "A fist-sized copper berry dispenser with one teal push button and three visible berry slots. It tilts, clicks, and releases one soft berry at a time. Preserve its rounded silhouette, copper-and-teal palette, scale, button position, material, starting state, final state, and single-object count." },
          ],
          action: [
            { name: "Spring Tart Ricochet", description: `One setup, one action, one consequence, and one reaction: the Enemies press the Moon-Spring Tart toward the Hero; its visible hinge compresses, releases left-to-right, and rebounds along the same path. The Hero makes one readable dodge, the Enemies receive the harmless soft landing, Companions react from fixed positions, and the object settles visibly within ${form.duration} seconds.` },
            { name: "Berry Button Backfire", description: `One setup, one action, one consequence, and one reaction: an Enemy presses the visible button, the object tips along a readable path, and its harmless payload lands on the Enemies. The Hero makes one clear dodge, Companions stay fixed, and every object settles visibly within ${form.duration} seconds.` },
          ],
          payoff: [
            { name: "Crescent Catch Victory", description: "The Hero ends foreground-center holding the settled tart with a relieved smile; each Enemy finishes behind it in a distinct harmless seated reaction; Companions remain in their established side positions. The object is fully visible, the location is unchanged, the final beat is playful, and the held pose can loop naturally to the opening." },
            { name: "Berry Crown Victory", description: "The Hero ends foreground-center clean and smiling while each Enemy sits harmlessly behind with one berry balanced overhead. Companions keep their established positions, all objects remain visible, the location stays unchanged, and the final held pose creates a readable loop." },
          ],
          title: [
            { title: "The Moon-Spring Double Bounce" },
            { title: "The Copperberry Button Backfire" },
            { title: "Biscuit and the One-Click Trouble Trap" },
          ],
        };
        if (kind === "title") {
          const candidates = demoCandidates.title;
          const usedTitles = new Set(savedPacks.map((saved) => saved.title.toLowerCase().trim()));
          result = candidates.find((candidate) => !usedTitles.has(candidate.title.toLowerCase())) || candidates[0];
        } else {
          const candidates = demoCandidates[kind];
          const saved = creativeAssets.filter((asset) => asset.kind === kind);
          result = form.allowPreviouslySavedObjects && kind === "object"
            ? candidates[0]
            : candidates.find((candidate) => !creativeCollision(candidate, saved)) || candidates[0];
        }
      } else {
        const action = kind === "title"
          ? "generateVideoTitle"
          : `${expand ? "expand" : "generate"}${kind[0].toUpperCase()}${kind.slice(1)}`;
        const exclusions = kind === "title"
          ? savedPacks.map((saved) => ({ name: saved.title, description: "" }))
          : kind === "object" && form.allowPreviouslySavedObjects
            ? []
            : creativeAssets.filter((asset) => asset.kind === kind)
              .map(({ name, description }) => ({ name, description }));
        const response = await fetch("/api/creative-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            idea,
            exclusions,
            collisionRetry,
            context: { form, characters: productionCharacters.map(({ id, shortName, fullIdentity, role }) => ({ id, shortName, fullIdentity, role })) },
          }),
        });
        result = await response.json() as typeof result & { error?: string };
        if (!response.ok) throw new Error(result.error || "Creative suggestion failed.");
      }
      if (kind === "title") update("videoTitle", result.title || "");
      else if (result.name && result.description) {
        const sameKind = creativeAssets.filter((asset) => asset.kind === kind);
        if (kind === "object" && !form.allowPreviouslySavedObjects &&
          creativeCollision({ name: result.name, description: result.description }, sameKind)) {
          if (!collisionRetry && mode === "ai") return await suggestCreative(kind, expand, true);
          setError("Duplicate Warning: the suggestion resembles a saved object. It remains editable but was not saved.");
        }
        setForm((current) => ({
          ...current,
          [creativeFields[kind].id]: "",
          [creativeFields[kind].name]: result.name,
          [creativeFields[kind].description]: result.description,
        }));
      }
      setNotice(`AI suggestion inserted for editing. It has not been saved.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Creative suggestion failed.");
    } finally {
      setSuggestingField("");
    }
  }

  function loadDemo() {
    setForm({ ...biscuitForm });
    setPack(null);
    setLegacyPack(null);
    setError("");
    setNotice("Biscuit Demo loaded with the latest saved character descriptions.");
  }

  function chooseHero(id: string) {
    update("heroId", id);
    const profile = characters.find((entry) => entry.id === id);
    if (profile) setDraft(profile);
    update("selectedCharacterIds", form.selectedCharacterIds.filter((entry) => entry !== id));
  }

  function editCharacter(profile: CharacterProfile) {
    setDraft({ ...profile, description: characterDescription(profile) });
  }

  function newCharacter(role: CharacterRole = "Companion") {
    setDraft({ ...emptyCharacter, role });
  }

  function saveCharacter(loadAsHero = false) {
    if (draft.builtIn) {
      setError("Built-in characters are protected. Create a custom character to save edits.");
      return;
    }
    const shortName = draft.shortName.trim();
    const fullIdentity = draft.fullIdentity.trim();
    const description = draft.description.trim();
    if (!shortName || !fullIdentity || !description) {
      setError("Character name, full identity, and description are required.");
      return;
    }
    const profile = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      builtIn: Boolean(draft.builtIn),
      shortName,
      fullIdentity,
      description,
    };
    setCharacters((current) => {
      const index = current.findIndex((entry) => entry.id === profile.id);
      return index >= 0
        ? current.map((entry) => entry.id === profile.id ? profile : entry)
        : [...current, profile];
    });
    setDraft(profile);
    if (loadAsHero) chooseHero(profile.id);
    setNotice(`${profile.shortName} saved to the Character Library.`);
    setError("");
  }

  function deleteCharacter() {
    if (!draft.id || draft.builtIn) {
      setError("Built-in characters are protected and cannot be deleted.");
      return;
    }
    setCharacters((current) => current.filter((profile) => profile.id !== draft.id));
    update("selectedCharacterIds", form.selectedCharacterIds.filter((id) => id !== draft.id));
    update("activeCharacterIds", activeIds.filter((id) => id !== draft.id));
    if (form.heroId === draft.id) update("heroId", "builtin-biscuit");
    setDraft(emptyCharacter);
    setNotice("Custom character deleted.");
  }

  async function generateCharacterDescription() {
    if (!draft.shortName.trim() || !draft.fullIdentity.trim()) {
      setError("Add a character name and full identity first.");
      return;
    }
    setIsSuggesting(true);
    setError("");
    try {
      if (mode === "demo") {
        const subject = draft.fullIdentity;
        const roleDirection = draft.role === "Hero"
          ? "clever, appealing, courageous, and consistently heroic"
          : draft.role === "Enemy"
            ? "mischievous, visually distinct, family-friendly, and consistently opposed to the hero"
            : "supportive, clearly readable, and consistent with the assigned story role";
        setDraft((current) => ({
          ...current,
          description: `Full identity: ${subject}
Customer foundation to preserve: ${current.description.trim() || "No prior description supplied."}
Species or character type: clearly define the species or character type implied by ${subject}
Role: ${current.role}
Appearance: memorable silhouette, stable facial structure, readable eyes, polished anatomy, and production-ready ${selectedStyle(form)} design
Primary and secondary colors: define two stable colors with exact marking placement and no color drift
Clothing and accessories: define any signature clothing or state clearly that none are used
Scale and proportions: lock height, head-to-body ratio, limb length, and size relative to the other selected characters
Personality: ${roleDirection}
Facial-expression style: expressive but anatomically stable reactions appropriate to a ${selectedTone(form).toLowerCase()} production
Movement style: species-specific motion with visible anticipation, logical weight transfer, smooth arcs, and clean recovery
Signature actions: define two recognizable poses or actions unique to ${current.shortName}
Voice profile: ${form.voiceLayers.includes("No Spoken Dialogue") ? "no spoken dialogue; use only consistent non-verbal reactions" : `consistent ${form.vocalTone.toLowerCase()} delivery in ${form.language}`}
Continuity rules: preserve identity, species, face, colors, clothing, scale, proportions, role, movement, and voice across every frame and future episode
Negative identity rules: do not duplicate ${current.shortName}; no extra copies, random outfits, species changes, color changes, role changes, morphing, extra limbs, merged bodies, or distorted anatomy`,
        }));
      } else {
        const response = await fetch("/api/character-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generateFullCharacterBible",
            character: draft,
            context: {
              visualStyle: selectedStyle(form),
              tone: selectedTone(form),
              platform: selectedPlatform(form),
              model: selectedModel(form),
              dialogueMode: form.voiceLayers.join(", "),
              characterNotes: form.additionalDirection,
            },
          }),
        });
        const data = await response.json() as Record<string, string>;
        if (!response.ok) throw new Error(data.error || "AI could not generate the character description.");
        const description = [
          `Full identity: ${draft.fullIdentity}`,
          `Customer foundation to preserve: ${draft.description.trim() || "No prior description supplied."}`,
          `Species or character type: infer and lock from the full identity`,
          `Role: ${draft.role}`,
          `Appearance: ${data.appearanceLock}`,
          `Primary and secondary colors: ${data.colorLock}`,
          "Clothing and accessories: preserve the exact established wardrobe and accessories; state none when absent",
          `Scale and proportions: ${data.scaleSizeLock}`,
          `Personality: ${data.personalityLock}`,
          "Facial-expression style: expressive, readable, anatomically stable, and role-consistent",
          `Movement style: ${data.movementStyle}`,
          "Signature actions: use two repeatable, character-specific actions derived from the movement style",
          `Voice profile: ${data.vocalStyleLock}`,
          `Continuity rules: ${data.continuityRules}`,
          `Negative identity rules: ${data.negativeRules}`,
        ].join("\n");
        setDraft((current) => ({
          ...current,
          description,
          appearanceLock: data.appearanceLock || current.appearanceLock,
          personalityLock: data.personalityLock || current.personalityLock,
          colorLock: data.colorLock || current.colorLock,
          scaleLock: data.scaleSizeLock || current.scaleLock,
          vocalStyleLock: data.vocalStyleLock || current.vocalStyleLock,
          movementStyle: data.movementStyle || current.movementStyle,
          continuityRules: data.continuityRules || current.continuityRules,
          negativeRules: data.negativeRules || current.negativeRules,
        }));
      }
      setNotice("Professional character description generated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Character description generation failed.");
    } finally {
      setIsSuggesting(false);
    }
  }

  async function generate() {
    if (!isReady) {
      setError("Complete the creative setup and select at least one character with exactly one Hero.");
      return;
    }
    setError("");
    setNotice("");
    setIsGenerating(true);
    try {
      const nextPack = mode === "demo"
        ? generateDemoPack(form, characters)
        : await (async () => {
            const response = await fetch("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "generate",
                form: formForGeneration(),
                activeCharacterIds: activeIds,
                activeCharacters: productionCharacters.map(({ id, shortName, role, fullIdentity, description }) => ({
                  id, name: shortName, role, fullIdentity, description,
                })),
                characters: productionCharacters,
              }),
            });
            const data = await response.json() as ProductionPack & { error?: string };
            if (!response.ok) throw new Error(data.error || "AI Mode could not generate the production pack.");
            if (form.videoTitle.trim()) data.videoTitle = form.videoTitle.trim();
            return data;
          })();
      setPack(nextPack);
      setLegacyPack(null);
      window.setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Production-pack generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function fixWithAi() {
    if (!pack || !qualityReport || mode !== "ai") return;
    setIsGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fix",
          form: formForGeneration(),
          activeCharacterIds: activeIds,
          activeCharacters: productionCharacters.map(({ id, shortName, role, fullIdentity, description }) => ({
            id, name: shortName, role, fullIdentity, description,
          })),
          characters: productionCharacters,
          pack,
          qualityFindings: qualityReport.findings,
        }),
      });
      const data = await response.json() as ProductionPack & { error?: string };
      if (!response.ok) throw new Error(data.error || "AI could not improve the pack.");
      if (form.videoTitle.trim()) data.videoTitle = form.videoTitle.trim();
      setPack(data);
      setNotice("The complete pack was synchronized and Quality Control reran automatically.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI improvement failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function generateSoundProfiles() {
    const profiles = productionCharacters.map((profile) => {
      const savedVoice = characterDescription(profile).split("\n")
        .find((line) => /voice profile|nonverbal sound profile/i.test(line));
      return `${profile.shortName}: ${savedVoice?.split(":").slice(1).join(":").trim() || "species-appropriate gasps, effort sounds, reaction noises, and a brief happy or surprised vocalization"}. No understandable words.`;
    }).join("\n");
    update("characterCartoonSoundGuidance", profiles);
    setNotice("Editable nonverbal sound profiles created for the checked characters only. Nothing was saved automatically.");
  }

  function savePreset() {
    if (!presetName.trim()) {
      setError("Enter a preset name.");
      return;
    }
    const preset = { id: crypto.randomUUID(), name: presetName.trim(), form: { ...form } };
    setPresets((current) => [...current, preset]);
    setSelectedPresetId(preset.id);
    setPresetName("");
    setNotice("Project preset saved.");
  }

  function loadPreset() {
    const preset = presets.find((entry) => entry.id === selectedPresetId);
    if (!preset) return;
    const latest = migrateForm(preset.form);
    latest.heroId = characters.some((entry) => entry.id === latest.heroId)
      ? latest.heroId
      : "builtin-biscuit";
    latest.selectedCharacterIds = latest.selectedCharacterIds
      .filter((id) => characters.some((entry) => entry.id === id) && id !== latest.heroId);
    latest.activeCharacterIds = [...new Set(latest.activeCharacterIds)]
      .filter((id) => characters.some((entry) => entry.id === id));
    if (!latest.activeCharacterIds.includes(latest.heroId) &&
      characters.some((entry) => entry.id === latest.heroId)) latest.activeCharacterIds.unshift(latest.heroId);
    (["location", "object", "action", "payoff"] as CreativeAssetKind[]).forEach((kind) => {
      const keys = creativeFields[kind];
      const asset = creativeAssets.find((item) => item.id === String(latest[keys.id]));
      if (asset) {
        Object.assign(latest, { [keys.name]: asset.name, [keys.description]: asset.description });
      }
    });
    setForm(latest);
    setPack(null);
    setLegacyPack(null);
    setNotice("Preset loaded using the latest saved Character Library profiles.");
  }

  function deletePreset() {
    const preset = presets.find((entry) => entry.id === selectedPresetId);
    if (!preset || preset.builtIn) return;
    setPresets((current) => current.filter((entry) => entry.id !== selectedPresetId));
    setSelectedPresetId(builtInPreset.id);
  }

  function saveCurrentPack() {
    if (!pack || !qualityReport) return;
    const title = pack.videoTitle || form.videoTitle || `${hero?.shortName || "Hero"} Production Pack`;
    const saved: SavedProductionPack = {
      id: crypto.randomUUID(),
      schemaVersion: 2,
      title,
      createdAt: new Date().toISOString(),
      platform: selectedPlatform(form),
      videoModel: selectedModel(form),
      duration: form.duration,
      form: { ...form },
      characterProfiles: productionCharacters,
      pack,
      qualityReport,
    };
    setSavedPacks((current) => [saved, ...current]);
    setNotice("Production pack saved locally.");
  }

  function loadSavedPack(saved: StoredPack) {
    if (saved.schemaVersion === 1) {
      setLegacyPack(saved);
      setPack(null);
      setNotice("Legacy pack opened in safe read-only mode.");
      window.setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      return;
    }
    setForm(migrateForm(saved.form));
    setCharacters((current) => mergeCharacterLibraries(current, saved.characterProfiles));
    setPack(saved.pack);
    setLegacyPack(null);
    setNotice("Saved pack loaded.");
    window.setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  function downloadJson(data: unknown, filename: string) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>, kind: "characters" | "presets") {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const raw = Array.isArray(parsed)
        ? parsed
        : kind === "characters"
          ? parsed?.characters
          : parsed?.projectPresets;
      if (!Array.isArray(raw)) throw new Error("The file does not contain a valid list.");
      if (kind === "characters") {
        const imported = raw.map(migrateCharacter)
          .filter((entry): entry is CharacterProfile => Boolean(entry));
        if (!imported.length) throw new Error("No valid character profiles were found.");
        setCharacters((current) => mergeCharacterLibraries(current, imported));
        setNotice(`${imported.length} valid character profile${imported.length === 1 ? "" : "s"} imported and merged.`);
      } else {
        const imported = raw.map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const item = entry as Record<string, unknown>;
          if (typeof item.name !== "string") return null;
          return {
            id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
            name: item.name,
            form: migrateForm(item.form),
          } satisfies ProjectPreset;
        }).filter((entry): entry is ProjectPreset => Boolean(entry));
        if (!imported.length) throw new Error("No valid project presets were found.");
        setPresets((current) => {
          const map = new Map(current.map((preset) => [preset.id, preset]));
          imported.forEach((preset) => map.set(preset.id, preset));
          return [builtInPreset, ...[...map.values()].filter((preset) => !preset.builtIn && preset.id !== builtInPreset.id)];
        });
        setNotice(`${imported.length} project preset${imported.length === 1 ? "" : "s"} imported.`);
      }
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The JSON import failed safely.");
    } finally {
      event.target.value = "";
    }
  }

  async function importCreativeLibrary(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const raw = Array.isArray(parsed) ? parsed : parsed?.creativeAssets;
      if (!Array.isArray(raw)) throw new Error("The file does not contain a Creative Library list.");
      const imported = raw.map(migrateCreativeAsset).filter((asset): asset is CreativeAsset => Boolean(asset));
      if (!imported.length) throw new Error("No valid creative assets were found.");
      setCreativeAssets((current) => mergeCreativeAssets(current, imported));
      setNotice(`${imported.length} creative asset${imported.length === 1 ? "" : "s"} imported and merged.`);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Creative Library import failed safely.");
    } finally {
      event.target.value = "";
    }
  }

  async function downloadWord() {
    if (!pack || !qualityReport) return;
    setIsDownloading(true);
    try {
      const exportForm = formForGeneration() as ProductionForm;
      const authorizedSceneInventory = buildAuthorizedSceneInventory(exportForm, productionCharacters);
      const objectStateLedger = buildObjectStateLedger(authorizedSceneInventory);
      const { Document, Footer, HeadingLevel, Packer, PageBreak, PageNumber, Paragraph, TextRun } = await import("docx");
      const { saveAs } = await import("file-saver");
      const heading = (text: string, level: "Heading1" | "Heading2" = HeadingLevel.HEADING_1) => new Paragraph({ heading: level, text });
      const paragraphLines = (value: string) => value.split("\n").filter((line) => line.trim())
        .map((line) => new Paragraph({ text: line, spacing: { after: 100 } }));
      const setting = (label: string, value: string) => new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value)],
      });
      const children = [
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: "Slapstick Prompt Pack", bold: true })] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, text: pack.videoTitle }),
        new Paragraph(`Generated: ${new Date().toLocaleString()}`),
        setting("Generator mode", mode === "demo" ? "Demo" : "AI"),
        setting("Selected model", selectedModel(form)),
        setting("Duration", `${form.duration} seconds`),
        setting("Video ratio", form.videoRatio),
        setting("Start-frame ratio", form.startFrameRatio),
        setting("End-frame ratio", form.endFrameRatio),
        setting("Visual style", selectedStyle(form)),
        setting("Selected tones", selectedTone(form)),
        setting("Ultra Retention Mode", form.ultraRetentionMode ? "Enabled — immediate hook, micro-beats, middle escalation, settled payoff" : "Disabled — standard active pacing and completed payoff"),
        setting("Grounding and motion safeguards", "Visible support contact, gravity, contact shadows, object support, continuous cause-and-effect, anticipation, acceleration, follow-through, and settling are required."),
        setting("Strict cast presence policy", "Every checked character is visible at the opening and final frames and remains continuously traceable; no spawning, vanishing, substitution, merging, duplication, or accidental camera crop-out."),
        setting("Object continuity policy", "The important object has one supported start position, a visible physical path, and one supported final position; no appearing, disappearing, duplication, or design drift."),
        setting("Tone from zero policy", `Selected tones control pose, motion, camera, expression, music, and sound at exactly 0:00.${form.tones.includes("Fast") ? " Fast mode requires immediate named movement at 0:00 with no static opening." : ""}`),
        setting("Natural motion and camera continuity", "Every beat has named action ownership and visible cause. Use one continuous cast-preserving camera path; no random motion, pose snapping, action-axis reversal, or camera-caused disappearance."),
        setting("Publishing target", selectedPlatform(form)),
        new Paragraph({ children: [new PageBreak()] }),
        heading("Authorized Scene Inventory"),
        setting("Exact selected characters", authorizedSceneInventory.characters.map((item) => `${item.name} (${item.role})`).join(", ")),
        setting("Exact character count", String(authorizedSceneInventory.characters.length)),
        setting("Exact authorized objects", objectStateLedger.map((item) => item.name).join(", ")),
        setting("Exact important-object count", String(objectStateLedger.length)),
        setting("Fixed environmental elements", authorizedSceneInventory.fixedEnvironmentElements.join(", ")),
        setting("Authorized exceptions", [...authorizedSceneInventory.authorizedEntrances, ...authorizedSceneInventory.authorizedExits, ...authorizedSceneInventory.authorizedTransformations].join("; ") || "None"),
        setting("Cuts allowed", authorizedSceneInventory.allowCuts ? "Yes" : "No"),
        setting("Freeze allowed", "No, except a customer-requested effect; living tension holds only"),
        setting("Magical floating allowed", authorizedSceneInventory.allowMagicalFloating ? "Yes, only with visible source and continuous traceability" : "No"),
        heading("Selected Characters"),
      ];
      productionCharacters.forEach((profile) => {
        children.push(heading(profile.fullIdentity, HeadingLevel.HEADING_2));
        children.push(setting("Name", profile.shortName), setting("Role", profile.role), setting("Full identity", profile.fullIdentity));
        children.push(...paragraphLines(sanitizeActiveText(characterDescription(profile))));
      });
      children.push(new Paragraph({ children: [new PageBreak()] }), heading("Creative Setup"));
      children.push(setting("Location", `${exportForm.locationName || "Location"} — ${exportForm.location}`));
      children.push(setting("Important object", `${exportForm.objectName || "Object"} — ${exportForm.importantObject}`));
      children.push(setting("Trap or main action", `${exportForm.actionName || "Action"} — ${exportForm.trapAction}`));
      children.push(setting("Ending or payoff", `${exportForm.payoffName || "Payoff"} — ${exportForm.endingPayoff}`));
      if (exportForm.additionalDirection?.trim()) children.push(setting("Additional Direction", exportForm.additionalDirection.trim()));
      children.push(heading("Audio Setup"));
      children.push(setting("Narration and spoken layers", form.voiceLayers.join(", ")));
      children.push(setting("Character Cartoon Sounds", form.characterCartoonSounds ? "Enabled" : "Disabled"));
      if (exportForm.characterCartoonSoundGuidance.trim()) children.push(setting("Character Cartoon Sound Guidance", exportForm.characterCartoonSoundGuidance.trim()));
      children.push(setting("Music", form.noMusic ? "No music" : `${form.musicType}; ${form.musicMood}; ${form.musicIntensity}`));
      children.push(setting("Sound effects", form.soundEffectsStyle), setting("Audio workflow", form.audioMode));
      children.push(new Paragraph({ children: [new PageBreak()] }), heading("Generated Outputs"));
      if (pack.characterBuildingPrompt) children.push(heading("1. Character-Building Prompt", HeadingLevel.HEADING_2), ...paragraphLines(pack.characterBuildingPrompt));
      children.push(heading("2. Start-Frame Image Prompt", HeadingLevel.HEADING_2), ...paragraphLines(pack.startFramePrompt));
      children.push(heading("3. End-Frame Image Prompt", HeadingLevel.HEADING_2), ...paragraphLines(pack.endFramePrompt));
      children.push(heading("4. All-in-One Video Production Prompt", HeadingLevel.HEADING_2), ...paragraphLines(completePrompt));
      children.push(new Paragraph({ children: [new PageBreak()] }), heading("Quality-Control Report"));
      children.push(new Paragraph({ children: [new TextRun({ text: `Overall score: ${qualityReport.score}/100`, bold: true })] }));
      qualityReport.findings.forEach((finding) => children.push(new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: `${finding.status} — ${finding.label}: `, bold: true }), new TextRun(finding.detail)],
      })));
      const document = new Document({
        creator: "Slapstick Prompt Pack",
        title: pack.videoTitle,
        sections: [{
          footers: { default: new Footer({ children: [new Paragraph({ alignment: "center", children: [new TextRun(`${pack.videoTitle} · Page `), new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
          children,
        }],
      });
      saveAs(await Packer.toBlob(document), safeWordFilename(pack.videoTitle));
      setNotice("Full production pack downloaded as an editable Word document.");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The Word document could not be created.");
    } finally {
      setIsDownloading(false);
    }
  }

  const hasNarrator = form.voiceLayers.includes("Narrator");
  const hasCharacterVoices = form.voiceLayers.some((layer) => layer.includes("Voice"));
  const silentMode = form.voiceLayers.includes("No Spoken Dialogue");
  const toneConflict = form.tones.includes("Calm") &&
    (form.tones.includes("Fast") || form.tones.includes("Chaotic slapstick"));

  function creativeEditor(kind: CreativeAssetKind, label: string) {
    const keys = creativeFields[kind];
    const selectedId = String(form[keys.id]);
    const selected = creativeAssets.find((asset) => asset.id === selectedId);
    const saved = creativeAssets.filter((asset) => asset.kind === kind);
    return (
      <article className="creative-editor wide">
        <div className="mini-heading">
          <h3>{label}</h3>
          <p>{selected ? `Using Latest Library Version · ${selected.updatedAt.slice(0, 10)}` : "Editable manual or AI-suggested input"}</p>
        </div>
        <label className="field wide"><span>Saved {label}</span>
          <select value={selectedId} onChange={(event) => selectCreativeAsset(kind, event.target.value)}>
            <option value="">Manual / unsaved</option>
            {saved.map((asset) => <option value={asset.id} key={asset.id}>{asset.name}{asset.isSignature ? " · Signature Location" : ""}</option>)}
          </select>
        </label>
        <div className="form-grid">
          <label className="field"><span>{label} name</span><input value={String(form[keys.name])} onChange={(event) => setForm((current) => ({ ...current, [keys.name]: event.target.value }))} /></label>
          <label className="field wide"><span>{label} description</span><textarea value={String(form[keys.description])} onChange={(event) => setForm((current) => ({ ...current, [keys.description]: event.target.value }))} /></label>
        </div>
        {kind === "object" && <label className="toggle-field"><input type="checkbox" checked={form.allowPreviouslySavedObjects} onChange={(event) => update("allowPreviouslySavedObjects", event.target.checked)} /><span>Allow Previously Saved Objects</span></label>}
        <div className="button-row">
          <button type="button" disabled={Boolean(suggestingField)} onClick={() => suggestCreative(kind, false)}>{suggestingField === kind ? "Creating…" : `Generate ${label} with AI`}</button>
          <button type="button" disabled={Boolean(suggestingField)} onClick={() => suggestCreative(kind, true)}>{`Continue and Improve ${label}`}</button>
          <button className="primary-small" type="button" onClick={() => saveCreativeAsset(kind)}>{selected ? `Update ${label}` : `Save ${label}`}</button>
          {kind === "location" && <button type="button" onClick={setSignatureLocation} disabled={!selectedId}>Set as Signature Location</button>}
          <button type="button" onClick={() => selectCreativeAsset(kind, "")}>Remove from current video</button>
          <button type="button" onClick={() => deleteCreativeAsset(kind)} disabled={!selected || Boolean(selected.builtIn)}>Delete custom {label.toLowerCase()}</button>
        </div>
      </article>
    );
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Slapstick Prompt Pack home">
          <span className="brand-mark">S</span>
          <span><strong>Slapstick</strong><small>PROMPT PACK</small></span>
        </a>
        <div className={`engine-badge ${mode === "ai" ? "ai" : ""}`}>
          <span />
          {mode === "demo" ? "Demo Mode · local" : "AI Mode · server secured"}
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <span className="eyebrow">SIMPLIFIED PRODUCTION WORKFLOW</span>
          <h1>From episode idea to one synchronized production prompt.</h1>
          <p>Build the cast, lock the reference frames, choreograph the complete action, and quality-check everything before generation.</p>
        </div>
        <button className="demo-button" type="button" onClick={loadDemo}>Load Biscuit Demo</button>
      </section>

      <div className="workspace">
        <section className="setup-panel">
          <div className="mode-switch" aria-label="Generator mode">
            <button className={mode === "demo" ? "active" : ""} type="button" onClick={() => setMode("demo")}>Demo Mode<small>No API</small></button>
            <button className={mode === "ai" ? "active" : ""} type="button" onClick={() => setMode("ai")}>AI Mode<small>OpenAI powered</small></button>
          </div>

          <section className="form-section">
            <div className="section-heading"><span>01</span><div><h2>Episode Idea</h2><p>Define the physical story before adding production settings.</p></div></div>
            <div className="form-grid">
              <article className="creative-editor title-editor wide">
                <div className="mini-heading"><h3>Video Name</h3><p>Manual titles are preserved exactly unless you request a replacement.</p></div>
                <label className="field wide"><span>Video Title</span><input value={form.videoTitle} onChange={(event) => update("videoTitle", event.target.value)} placeholder="Create a memorable original title" /></label>
                <div className="button-row"><button type="button" disabled={Boolean(suggestingField)} onClick={() => suggestCreative("title")}>{suggestingField === "title" ? "Creating…" : "Generate Ultra-Unique Title with AI"}</button></div>
              </article>
              {creativeEditor("location", "Location")}
              {creativeEditor("object", "Important Object")}
              {creativeEditor("action", "Action or Trap")}
              {creativeEditor("payoff", "Ending or Payoff")}
              <label className="field wide"><span>Additional direction <i>optional</i></span><textarea value={form.additionalDirection} onChange={(event) => update("additionalDirection", event.target.value)} placeholder="Example: Keep the camera in a wide side view and make the final pose loop smoothly into the opening frame." /></label>
              <details className="advanced-panel wide">
                <summary>Creative Library import and export <span>+</span></summary>
                <div className="advanced-content">
                  <p>Saved creative assets stay editable and reusable. Imports are validated and merged.</p>
                  <div className="button-row">
                    <button type="button" onClick={() => downloadJson({ version: 1, creativeAssets }, "slapstick_prompt_pack_creative_library.json")}>Export Creative Library</button>
                    <button type="button" onClick={() => creativeImportRef.current?.click()}>Import and Merge Creative Library</button>
                    <input hidden ref={creativeImportRef} type="file" accept=".json,application/json" onChange={importCreativeLibrary} />
                  </div>
                </div>
              </details>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading"><span>02</span><div><h2>Characters</h2><p>Browse the library and explicitly choose who appears in this production.</p></div></div>
            <div className="character-block">
              <div className="character-browser-nav">
                <button type="button" aria-label="Previous character" onClick={() => viewCharacter(characterIndex - 1)}>←</button>
                <div><strong>{viewedCharacter?.fullIdentity || "No saved characters"}</strong><small>Character {characters.length ? characterIndex + 1 : 0} of {characters.length}</small></div>
                <button type="button" aria-label="Next character" onClick={() => viewCharacter(characterIndex + 1)}>→</button>
              </div>
              {viewedCharacter && <label className="toggle-field browser-include"><input type="checkbox" checked={activeIds.includes(viewedCharacter.id)} onChange={() => toggleActiveCharacter(viewedCharacter.id)} /><span>Include in This Video</span></label>}
              <p className="selection-count">{characters.length} characters available · {productionCharacters.length} selected for this video</p>
              <div className="form-grid editor-grid">
                <label className="field"><span>Character name</span><input disabled={Boolean(draft.builtIn)} value={draft.shortName} onChange={(event) => setDraft((current) => ({ ...current, shortName: event.target.value }))} /></label>
                <label className="field"><span>Role</span><select disabled={Boolean(draft.builtIn)} value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as CharacterRole }))}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
                <label className="field wide"><span>Full identity</span><input disabled={Boolean(draft.builtIn)} value={draft.fullIdentity} onChange={(event) => setDraft((current) => ({ ...current, fullIdentity: event.target.value }))} /></label>
                <label className="field wide"><span>Complete description</span><textarea disabled={Boolean(draft.builtIn)} className="character-description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
              </div>
              <div className="button-row">
                <button type="button" onClick={generateCharacterDescription} disabled={isSuggesting || Boolean(draft.builtIn)}>{isSuggesting ? "Improving…" : "Continue and Improve with AI"}</button>
                <button className="primary-small" disabled={Boolean(draft.builtIn)} type="button" onClick={() => saveCharacter(false)}>{draft.id ? "Update Character" : "Save to Character Library"}</button>
                <button type="button" onClick={() => newCharacter()}>Add New Character</button>
                <button type="button" disabled={!draft.id || Boolean(draft.builtIn)} onClick={deleteCharacter}>Delete Custom Character</button>
              </div>
              <div className="selected-cast"><strong>Selected for This Video</strong><div className="character-chips">
                {productionCharacters.map((profile) => <article key={profile.id}><button className="character-card-main" type="button" onClick={() => { setCharacterIndex(characters.findIndex((item) => item.id === profile.id)); editCharacter(profile); }}><b>{profile.shortName}</b><small>{profile.role}</small></button><button className="remove-chip" type="button" aria-label={`Remove ${profile.shortName} from video`} onClick={() => toggleActiveCharacter(profile.id)}>×</button></article>)}
                {!productionCharacters.length && <p className="empty-note">No characters selected.</p>}
              </div></div>
            </div>

            <details className="advanced-panel">
              <summary>Character Library import and export <span>+</span></summary>
              <div className="advanced-content">
                <p>Built-in profiles are protected. Imports are validated and merged; they never replace the whole library.</p>
                <div className="button-row">
                  <button type="button" onClick={() => downloadJson({ characters }, "slapstick_prompt_pack_character_library.json")}>Export Character Library</button>
                  <button type="button" onClick={() => libraryImportRef.current?.click()}>Import and Merge Library</button>
                  <input hidden ref={libraryImportRef} type="file" accept=".json,application/json" onChange={(event) => importJson(event, "characters")} />
                </div>
              </div>
            </details>
          </section>

          <section className="form-section">
            <div className="section-heading"><span>03</span><div><h2>Production Setup</h2><p>Compact format, model, motion, ratio, voice, music, and sound controls.</p></div></div>
            <div className="form-grid">
              <label className="field"><span>Publishing platform</span><select value={form.platform} onChange={(event) => update("platform", event.target.value)}>{platforms.map((value) => <option key={value}>{value}</option>)}</select>{form.platform === "Custom" && <input value={form.customPlatform} onChange={(event) => update("customPlatform", event.target.value)} placeholder="Custom platform" />}</label>
              <label className="field"><span>AI video model</span><select value={form.videoModel} onChange={(event) => update("videoModel", event.target.value)}>{videoModels.map((value) => <option key={value}>{value}</option>)}</select>{form.videoModel === "Custom model" && <input value={form.customVideoModel} onChange={(event) => update("customVideoModel", event.target.value)} placeholder="Custom model" />}</label>
              <label className="field"><span>Duration</span><select value={form.duration} onChange={(event) => update("duration", event.target.value)}>{durations.map((value) => <option key={value} value={value}>{value} seconds</option>)}</select></label>
              <label className="field"><span>Motion level</span><select value={form.motionLevel} onChange={(event) => update("motionLevel", event.target.value as ProductionForm["motionLevel"])}>{["Safe", "Balanced", "Ambitious"].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="field"><span>Visual style</span><select value={form.visualStyle} onChange={(event) => update("visualStyle", event.target.value)}>{visualStyles.map((value) => <option key={value}>{value}</option>)}</select>{form.visualStyle === "Custom" && <input value={form.customVisualStyle} onChange={(event) => update("customVisualStyle", event.target.value)} />}</label>
              <fieldset className="choice-field wide"><legend>Video tones · select one or more</legend><div className="choice-grid">{tones.map((tone) => <label key={tone}><input type="checkbox" checked={form.tones.includes(tone)} onChange={() => toggleTone(tone)} /><span>{tone}</span></label>)}</div>{form.tones.includes("Custom") && <input value={form.customTone} onChange={(event) => update("customTone", event.target.value)} placeholder="Custom tone" />}{toneConflict && <p className="conflict-note">Tone warning: Calm combined with Fast or Chaotic slapstick needs deliberate pacing. Your selections are preserved.</p>}</fieldset>
              <label className="toggle-field wide"><input type="checkbox" checked={form.ultraRetentionMode} onChange={(event) => update("ultraRetentionMode", event.target.checked)} /><span>Ultra Retention Mode <i>Uses an immediate opening hook, continuous visual micro-beats, a major mid-video escalation, and a strong completed payoff.</i></span></label>
              <RatioControl label="Video ratio" value={form.videoRatio} width={form.videoCustomWidth} height={form.videoCustomHeight} onRatio={(value) => update("videoRatio", value)} onWidth={(value) => update("videoCustomWidth", value)} onHeight={(value) => update("videoCustomHeight", value)} />
              <RatioControl label="Start-frame ratio" value={form.startFrameRatio} width={form.startCustomWidth} height={form.startCustomHeight} onRatio={(value) => update("startFrameRatio", value)} onWidth={(value) => update("startCustomWidth", value)} onHeight={(value) => update("startCustomHeight", value)} />
              <RatioControl label="End-frame ratio" value={form.endFrameRatio} width={form.endCustomWidth} height={form.endCustomHeight} onRatio={(value) => update("endFrameRatio", value)} onWidth={(value) => update("endCustomWidth", value)} onHeight={(value) => update("endCustomHeight", value)} />
              <label className="toggle-field"><input type="checkbox" checked={form.includeCharacterBuildingPrompt} onChange={(event) => update("includeCharacterBuildingPrompt", event.target.checked)} /><span>Include Character-Building Prompt</span></label>
            </div>

            <details className="advanced-panel">
              <summary>Advanced Settings · narration, voices, music, and sound <span>+</span></summary>
              <div className="advanced-content">
                <div className="form-grid">
                  <fieldset className="choice-field wide"><legend>Narration and voice layers</legend><div className="choice-grid">{voiceLayerOptions.map((layer) => <label key={layer}><input type="checkbox" checked={form.voiceLayers.includes(layer)} onChange={() => toggleVoiceLayer(layer)} /><span>{layer}</span></label>)}</div></fieldset>
                  <label className="toggle-field wide"><input type="checkbox" checked={form.characterCartoonSounds} onChange={(event) => update("characterCartoonSounds", event.target.checked)} /><span>Character Cartoon Sounds</span></label>
                  <p className="helper-text wide">Creates nonverbal character vocal sounds such as gasps, squeaks, grunts, giggles, yelps, huffs, chirps, effort sounds, and reaction noises. It does not create spoken words or dialogue.</p>
                  {form.characterCartoonSounds && <div className="wide"><label className="field"><span>Character Cartoon Sound Guidance <i>optional</i></span><textarea value={form.characterCartoonSoundGuidance} onChange={(event) => update("characterCartoonSoundGuidance", event.target.value)} placeholder="Example: Give Biscuit quick cheerful squeaks and effort sounds, while Grumpy uses low irritated grunts and surprised yelps. No spoken words." /></label><div className="button-row"><button type="button" onClick={generateSoundProfiles} disabled={!productionCharacters.length}>Generate Sound Profiles with AI</button></div></div>}
                  {hasNarrator && <><label className="field wide"><span>Narrator guidance</span><textarea value={form.narratorGuidance} onChange={(event) => update("narratorGuidance", event.target.value)} /></label><label className="field wide"><span>Narration text</span><textarea value={form.narrationText} onChange={(event) => update("narrationText", event.target.value)} /></label></>}
                  {hasCharacterVoices && <><label className="field wide"><span>Character dialogue</span><textarea value={form.characterDialogue} onChange={(event) => update("characterDialogue", event.target.value)} /></label><label className="field wide"><span>Character voice guidance</span><textarea value={form.characterVoiceGuidance} onChange={(event) => update("characterVoiceGuidance", event.target.value)} /></label></>}
                  {!silentMode && <><label className="field"><span>Language</span><input value={form.language} onChange={(event) => update("language", event.target.value)} /></label><label className="field"><span>Vocal tone</span><input value={form.vocalTone} onChange={(event) => update("vocalTone", event.target.value)} /></label><label className="toggle-field"><input type="checkbox" checked={form.lipSyncRequired} onChange={(event) => update("lipSyncRequired", event.target.checked)} /><span>Lip-sync required</span></label></>}
                  {silentMode && <div className="silent-lock wide">No Spoken Dialogue blocks understandable words, narration, and lip-sync. Nonverbal cartoon sounds, breaths, gasps, giggles, grunts, yelps, music, and environmental sound effects remain allowed.</div>}
                  <label className="field"><span>Music type</span><input disabled={form.noMusic} value={form.musicType} onChange={(event) => update("musicType", event.target.value)} /></label>
                  <label className="field"><span>Music mood</span><input disabled={form.noMusic} value={form.musicMood} onChange={(event) => update("musicMood", event.target.value)} /></label>
                  <label className="field"><span>Music intensity</span><select disabled={form.noMusic} value={form.musicIntensity} onChange={(event) => update("musicIntensity", event.target.value)}>{["Low", "Medium", "High"].map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label className="field"><span>Audio workflow</span><select value={form.audioMode} onChange={(event) => update("audioMode", event.target.value)}>{["Native-audio mode", "Editing-guide mode"].map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label className="toggle-field"><input type="checkbox" checked={form.noMusic} onChange={(event) => update("noMusic", event.target.checked)} /><span>No music</span></label>
                  <label className="field wide"><span>Sound-effects style</span><input value={form.soundEffectsStyle} onChange={(event) => update("soundEffectsStyle", event.target.value)} /></label>
                  {form.videoModel === "Custom model" && <label className="field wide"><span>Custom-model guidance</span><textarea value={form.customModelGuidance} onChange={(event) => update("customModelGuidance", event.target.value)} placeholder="Describe known prompt structure, camera, motion, reference-frame, and audio preferences." /></label>}
                </div>
              </div>
            </details>

            <details className="advanced-panel">
              <summary>Project Presets and Saved Packs <span>+</span></summary>
              <div className="advanced-content">
                <div className="preset-row">
                  <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Preset name" />
                  <button type="button" onClick={savePreset}>Save Current Setup</button>
                </div>
                <div className="preset-row">
                  <select value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.target.value)}>{presets.map((preset) => <option value={preset.id} key={preset.id}>{preset.name}{preset.builtIn ? " · Built in" : ""}</option>)}</select>
                  <button type="button" onClick={loadPreset}>Load Preset</button>
                  <button type="button" onClick={deletePreset} disabled={presets.find((preset) => preset.id === selectedPresetId)?.builtIn}>Delete</button>
                </div>
                <div className="button-row">
                  <button type="button" onClick={() => downloadJson({ projectPresets: presets.filter((preset) => !preset.builtIn) }, "slapstick_prompt_pack_project_presets.json")}>Export Presets</button>
                  <button type="button" onClick={() => presetImportRef.current?.click()}>Import Presets</button>
                  <input hidden ref={presetImportRef} type="file" accept=".json,application/json" onChange={(event) => importJson(event, "presets")} />
                </div>
                <div className="saved-pack-list">
                  {savedPacks.map((saved) => (
                    <article key={saved.id}>
                      <div><b>{saved.title}</b><small>{saved.schemaVersion === 1 ? "Legacy · read only" : `${saved.platform} · ${saved.duration}s`}</small></div>
                      <div className="button-row">
                        <button type="button" onClick={() => loadSavedPack(saved)}>Load</button>
                        <button type="button" onClick={() => setSavedPacks((current) => current.filter((entry) => entry.id !== saved.id))}>Delete</button>
                      </div>
                    </article>
                  ))}
                  {!savedPacks.length && <p className="empty-note">No saved packs yet.</p>}
                </div>
              </div>
            </details>
          </section>

          {error && <div className="message error" role="alert">{error}</div>}
          {notice && <div className="message success" role="status">{notice}</div>}

          <section className="generate-section">
            <div><span>04</span><h2>Generate Production Pack</h2><p>Creates the five simplified production outputs with one synchronized internal video schema.</p></div>
            <button className="generate-button" type="button" disabled={!isReady || isGenerating} onClick={generate}>{isGenerating ? "Synchronizing production…" : `Generate with ${mode === "demo" ? "Demo Mode" : "AI Mode"} →`}</button>
          </section>
        </section>

        <section className="output-panel" ref={outputRef}>
          <div className="output-heading">
            <div><span className="eyebrow">05 · GENERATED PRODUCTION PACK</span><h2>{pack ? "Ready for production" : legacyPack ? "Legacy pack" : "Your synchronized pack will appear here."}</h2></div>
            <div className="output-actions"><button type="button" onClick={saveCurrentPack} disabled={!pack}>Save Pack</button><button type="button" disabled={!pack || isDownloading} onClick={downloadWord}>{isDownloading ? "Preparing Full Pack…" : "Download Full Pack as Word"}</button></div>
          </div>

          {!pack && !legacyPack && <div className="empty-output"><span>✦</span><h3>Six clear outputs. One continuous production plan.</h3><p>Complete the episode idea and characters, then generate.</p></div>}

          {legacyPack && (
            <div className="legacy-output">
              <div className="legacy-note">This older 23-section pack is preserved in read-only mode. It has not been deleted or silently rewritten.</div>
              {legacyPack.items.map((item, index) => <article key={`${item.title}-${index}`}><h3>{item.title}</h3><pre>{item.value}</pre><CopyButton label="Copy" value={item.value} /></article>)}
            </div>
          )}

          {pack && qualityReport && (
            <>
              <div className="video-title-output"><span>VIDEO TITLE</span><h2>{pack.videoTitle}</h2><CopyButton label="Copy Title" value={pack.videoTitle} /></div>
              {pack.characterBuildingPrompt && <article className="output-card">
                <div className="card-heading"><span>01 · CHARACTER</span><h3>Character-Building Prompt</h3><CopyButton label="Copy" value={pack.characterBuildingPrompt || "Character-building prompt disabled."} /></div>
                <pre>{pack.characterBuildingPrompt}</pre>
              </article>}
              <article className="output-card">
                <div className="card-heading"><span>02 · REFERENCE FRAME</span><h3>Start-Frame Image Prompt</h3><CopyButton label="Copy" value={pack.startFramePrompt} /></div>
                <pre>{pack.startFramePrompt}</pre>
              </article>
              <article className="output-card">
                <div className="card-heading"><span>03 · REFERENCE FRAME</span><h3>End-Frame Image Prompt</h3><CopyButton label="Copy" value={pack.endFramePrompt} /></div>
                <pre>{pack.endFramePrompt}</pre>
              </article>
              <article className="output-card featured">
                <div className="card-heading"><span>04 · COMPLETE VIDEO</span><h3>All-in-One Video Production Prompt</h3></div>
                <div className="copy-group">
                  <CopyButton label="Copy Complete Production Prompt" value={completePrompt} />
                  <CopyButton label="Copy Visual Portion Only" value={visualPrompt} />
                  <CopyButton label="Copy Audio Portion Only" value={audioPrompt} />
                </div>
                <div className="prompt-block"><h4>VIDEO LOCK</h4><pre>{pack.videoLock}</pre></div>
                <div className="prompt-block"><h4>SECOND-BY-SECOND VIDEO ACTION</h4><pre>{pack.videoTimeline}</pre></div>
                <div className="prompt-block"><h4>MUSIC PATH</h4><pre>{pack.musicPath || "No music."}</pre></div>
                <div className="prompt-block"><h4>SOUND EFFECTS</h4><pre>{pack.soundEffects}</pre></div>
                <div className="prompt-block"><h4>FINAL GENERATION RULE</h4><pre>{pack.finalGenerationRule}</pre></div>
              </article>
              <article className="output-card quality-card">
                <div className="quality-score"><strong>{qualityReport.score}</strong><span>/ 100</span></div>
                <div className="card-heading"><span>05 · ERROR PREVENTION</span><h3>Quality-Control Report</h3><CopyButton label="Copy Report" value={qualityText(qualityReport)} /></div>
                <div className="findings">
                  {qualityReport.findings.map((finding) => <div className={finding.status.toLowerCase()} key={finding.label}><b>{finding.status}</b><span><strong>{finding.label}</strong><small>{finding.detail}</small></span></div>)}
                </div>
                {mode === "ai" && <button className="fix-button" type="button" onClick={fixWithAi} disabled={isGenerating}>{isGenerating ? "Improving…" : "Fix and Improve with AI"}</button>}
              </article>
            </>
          )}
        </section>
      </div>

      <footer>SLAPSTICK PROMPT PACK <span>•</span> REFERENCE-LOCKED PRODUCTION</footer>
    </main>
  );
}
