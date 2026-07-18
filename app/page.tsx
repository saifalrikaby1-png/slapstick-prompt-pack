"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CharacterProfile,
  CharacterRole,
  GeneratorMode,
  LegacySavedPack,
  ProductionForm,
  ProductionPack,
  ProjectPreset,
  QualityReport,
  SavedProductionPack,
  StoredPack,
  defaultProductionForm,
} from "./production-types";
import {
  audioVideoPrompt,
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

const STORAGE = {
  characters: "slapstick-character-library",
  presets: "slapstick-project-presets",
  packs: "slapstick-saved-packs",
  form: "slapstick-current-setup",
};

const roles: CharacterRole[] = ["Hero", "Enemy", "Companion", "Supporting character"];

const emptyCharacter: CharacterProfile = {
  id: "",
  shortName: "",
  fullIdentity: "",
  role: "Supporting character",
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
  location: "a bright woodland cookie clearing with a smooth dirt path and warm morning light",
  importantObject: "one glowing golden cookie on a low tree-stump pedestal",
  trapAction: "Grumpy and Sneaky trigger a rolling log trap; Biscuit makes one clean dodge and the same log rolls back toward them",
  endingPayoff: "Biscuit safely holds the glowing cookie in a clear victory pose while Grumpy and Sneaky sit harmlessly tangled behind the stopped log",
  additionalDirection: "Keep the comedy fast, readable, family-friendly, and loopable.",
};

const builtInPreset: ProjectPreset = {
  id: "builtin-biscuit-trouble-crew",
  name: "Biscuit & the Trouble Crew",
  form: biscuitForm,
  builtIn: true,
};

const platforms = ["YouTube Shorts", "TikTok", "Instagram Reels", "Facebook Reels", "General video", "Custom"];
const videoModels = ["Seedance", "Kling", "Google Flow / Veo", "Runway", "Higgsfield", "PixVerse", "Hailuo", "Generic model", "Custom model"];
const durations = Array.from({ length: 12 }, (_, index) => String((index + 1) * 5));
const visualStyles = ["Cinematic 3D family animation", "Stylized 3D cartoon", "High-quality 3D animation", "2D cartoon", "Anime", "Clay animation", "Stop-motion", "Realistic cinematic", "Storybook illustration", "Custom"];
const tones = ["Calm", "Cute", "Playful", "Funny", "Energetic", "Fast", "Chaotic slapstick", "Suspenseful", "Emotional", "Magical", "Educational", "Custom"];
const ratios = ["9:16", "16:9", "1:1", "4:5", "5:4", "3:4", "4:3", "2:3", "3:2", "21:9", "2.39:1", "Custom"];
const narrationModes = ["Silent non-dialogue", "Character voices only", "Narrator only", "Narrator and character voices", "Music and sound effects only"];

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
  const [draft, setDraft] = useState<CharacterProfile>(builtInCharacters[0]);
  const [selectedSupportId, setSelectedSupportId] = useState("");
  const [presets, setPresets] = useState<ProjectPreset[]>([builtInPreset]);
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState(builtInPreset.id);
  const [savedPacks, setSavedPacks] = useState<StoredPack[]>([]);
  const [mode, setMode] = useState<GeneratorMode>("demo");
  const [pack, setPack] = useState<ProductionPack | null>(null);
  const [legacyPack, setLegacyPack] = useState<LegacySavedPack | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const libraryImportRef = useRef<HTMLInputElement>(null);
  const presetImportRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const hydrationTask = window.setTimeout(() => {
      const storedCharacters = safeArray(localStorage.getItem(STORAGE.characters))
        .map(migrateCharacter)
        .filter((entry): entry is CharacterProfile => Boolean(entry));
      setCharacters(mergeCharacterLibraries([], storedCharacters));
      const storedForm = safeObject(localStorage.getItem(STORAGE.form));
      if (storedForm) setForm(migrateForm(storedForm));
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

  const hero = characters.find((profile) => profile.id === form.heroId);
  const selectedCharacters = form.selectedCharacterIds
    .map((id) => characters.find((profile) => profile.id === id))
    .filter((entry): entry is CharacterProfile => Boolean(entry) && entry?.id !== hero?.id);
  const productionCharacters = [hero, ...selectedCharacters]
    .filter((entry): entry is CharacterProfile => Boolean(entry));
  const qualityReport = useMemo(
    () => pack ? inspectProductionPack(pack, form, characters) : null,
    [pack, form, characters],
  );
  const completePrompt = pack ? completeVideoPrompt(pack) : "";
  const visualPrompt = pack ? visualVideoPrompt(pack) : "";
  const audioPrompt = pack ? audioVideoPrompt(pack) : "";
  const isReady = Boolean(
    form.location.trim() &&
    form.importantObject.trim() &&
    form.trapAction.trim() &&
    form.endingPayoff.trim() &&
    hero,
  );

  function update<K extends keyof ProductionForm>(key: K, value: ProductionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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

  function addSelectedCharacter() {
    if (!selectedSupportId || selectedSupportId === form.heroId ||
      form.selectedCharacterIds.includes(selectedSupportId)) return;
    update("selectedCharacterIds", [...form.selectedCharacterIds, selectedSupportId]);
    setSelectedSupportId("");
  }

  function removeSelectedCharacter(id: string) {
    update("selectedCharacterIds", form.selectedCharacterIds.filter((entry) => entry !== id));
  }

  function editCharacter(profile: CharacterProfile) {
    setDraft({ ...profile, description: characterDescription(profile) });
  }

  function newCharacter(role: CharacterRole = "Supporting character") {
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
Voice profile: ${form.narrationMode === "Silent non-dialogue" ? "no spoken dialogue; use only consistent non-verbal reactions" : `consistent ${form.vocalTone.toLowerCase()} delivery in ${form.language}`}
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
              dialogueMode: form.narrationMode,
              characterNotes: form.additionalDirection,
            },
          }),
        });
        const data = await response.json() as Record<string, string>;
        if (!response.ok) throw new Error(data.error || "AI could not generate the character description.");
        const description = [
          `Full identity: ${draft.fullIdentity}`,
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
      setError("Complete the location, object, main action, ending, and hero before generating.");
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
              body: JSON.stringify({ action: "generate", form, characters: productionCharacters }),
            });
            const data = await response.json() as ProductionPack & { error?: string };
            if (!response.ok) throw new Error(data.error || "AI Mode could not generate the production pack.");
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
          form,
          characters: productionCharacters,
          pack,
          qualityFindings: qualityReport.findings,
        }),
      });
      const data = await response.json() as ProductionPack & { error?: string };
      if (!response.ok) throw new Error(data.error || "AI could not improve the pack.");
      setPack(data);
      setNotice("The complete pack was synchronized and Quality Control reran automatically.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI improvement failed.");
    } finally {
      setIsGenerating(false);
    }
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
    const title = `${hero?.shortName || "Hero"} — ${form.endingPayoff.slice(0, 54) || "Production Pack"}`;
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

  async function downloadWord() {
    if (!pack || !qualityReport) return;
    setIsDownloading(true);
    try {
      const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
      const { saveAs } = await import("file-saver");
      const sections = [
        ["Character-Building Prompt", pack.characterBuildingPrompt || "Disabled for this production."],
        ["Start-Frame Image Prompt", pack.startFramePrompt],
        ["End-Frame Image Prompt", pack.endFramePrompt],
        ["All-in-One Video Production Prompt", completePrompt],
        ["Quality-Control Report", qualityText(qualityReport)],
      ];
      const children = [
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: "Slapstick Prompt Pack", bold: true })] }),
        new Paragraph(`Platform: ${selectedPlatform(form)} · Model: ${selectedModel(form)} · Duration: ${form.duration} seconds`),
      ];
      sections.forEach(([title, value]) => {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: title }));
        value.split("\n").forEach((line) => children.push(new Paragraph(line)));
      });
      const document = new Document({ creator: "Slapstick Prompt Pack", sections: [{ children }] });
      saveAs(await Packer.toBlob(document), "Slapstick_Prompt_Pack_Production_Pack.docx");
    } finally {
      setIsDownloading(false);
    }
  }

  const hasNarrator = form.narrationMode === "Narrator only" ||
    form.narrationMode === "Narrator and character voices";
  const hasCharacterVoices = form.narrationMode === "Character voices only" ||
    form.narrationMode === "Narrator and character voices";
  const silentMode = form.narrationMode === "Silent non-dialogue" ||
    form.narrationMode === "Music and sound effects only";

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
              <label className="field"><span>Location</span><input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Bright woodland clearing" /></label>
              <label className="field"><span>Important object</span><input value={form.importantObject} onChange={(event) => update("importantObject", event.target.value)} placeholder="One glowing cookie" /></label>
              <label className="field wide"><span>Trap or main action</span><textarea value={form.trapAction} onChange={(event) => update("trapAction", event.target.value)} placeholder="Describe the physical setup, action direction, and consequence." /></label>
              <label className="field wide"><span>Ending or payoff</span><textarea value={form.endingPayoff} onChange={(event) => update("endingPayoff", event.target.value)} placeholder="Describe the exact readable ending pose and result." /></label>
              <label className="field wide"><span>Additional direction <i>optional</i></span><textarea value={form.additionalDirection} onChange={(event) => update("additionalDirection", event.target.value)} /></label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading"><span>02</span><div><h2>Characters</h2><p>Use the latest saved descriptions and prevent duplicate episode selection.</p></div></div>
            <div className="character-block">
              <div className="mini-heading"><h3>Hero Character</h3><p>Choose one saved hero, then review or improve the complete identity description.</p></div>
              <label className="field"><span>Saved-character selector</span>
                <select value={form.heroId} onChange={(event) => chooseHero(event.target.value)}>
                  {characters.map((profile) => <option value={profile.id} key={profile.id}>{profile.shortName} · {profile.role}</option>)}
                </select>
              </label>
              <div className="form-grid">
                <label className="field"><span>Hero name</span><input disabled={Boolean(draft.builtIn)} value={draft.shortName} onChange={(event) => setDraft((current) => ({ ...current, shortName: event.target.value }))} /></label>
                <label className="field"><span>Full identity</span><input disabled={Boolean(draft.builtIn)} value={draft.fullIdentity} onChange={(event) => setDraft((current) => ({ ...current, fullIdentity: event.target.value }))} /></label>
                <label className="field wide"><span>Hero description</span><textarea disabled={Boolean(draft.builtIn)} className="character-description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
              </div>
              <div className="button-row">
                <button type="button" onClick={generateCharacterDescription} disabled={isSuggesting || Boolean(draft.builtIn)}>{isSuggesting ? "Generating…" : "Generate Description with AI"}</button>
                <button className="primary-small" disabled={Boolean(draft.builtIn)} type="button" onClick={() => saveCharacter(true)}>{draft.id ? "Update Character" : "Save Hero to Library"}</button>
                <button type="button" onClick={() => newCharacter("Hero")}>New Hero</button>
              </div>
            </div>

            <div className="character-block">
              <div className="mini-heading"><h3>Enemies and Companions</h3><p>Select multiple characters, inspect their latest description, or remove them from this episode without deleting them.</p></div>
              <div className="add-character-row">
                <select aria-label="Saved supporting character" value={selectedSupportId} onChange={(event) => setSelectedSupportId(event.target.value)}>
                  <option value="">Choose a saved character…</option>
                  {characters.filter((profile) => profile.id !== form.heroId && !form.selectedCharacterIds.includes(profile.id))
                    .map((profile) => <option value={profile.id} key={profile.id}>{profile.shortName} · {profile.role}</option>)}
                </select>
                <button type="button" onClick={addSelectedCharacter}>Add to episode</button>
                <button type="button" onClick={() => newCharacter()}>+ New character</button>
              </div>
              <div className="character-chips">
                {selectedCharacters.map((profile) => (
                  <article className={draft.id === profile.id ? "selected" : ""} key={profile.id}>
                    <button className="character-card-main" type="button" onClick={() => editCharacter(profile)}>
                      <b>{profile.shortName}</b><small>{profile.role}</small>
                    </button>
                    <button className="remove-chip" type="button" aria-label={`Remove ${profile.shortName} from episode`} onClick={() => removeSelectedCharacter(profile.id)}>×</button>
                  </article>
                ))}
                {!selectedCharacters.length && <p className="empty-note">No enemies or companions selected.</p>}
              </div>
              <div className="form-grid editor-grid">
                <label className="field"><span>Character name</span><input disabled={Boolean(draft.builtIn)} value={draft.shortName} onChange={(event) => setDraft((current) => ({ ...current, shortName: event.target.value }))} /></label>
                <label className="field"><span>Role</span><select disabled={Boolean(draft.builtIn)} value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as CharacterRole }))}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
                <label className="field wide"><span>Full identity</span><input disabled={Boolean(draft.builtIn)} value={draft.fullIdentity} onChange={(event) => setDraft((current) => ({ ...current, fullIdentity: event.target.value }))} /></label>
                <label className="field wide"><span>Complete description</span><textarea disabled={Boolean(draft.builtIn)} className="character-description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
              </div>
              <div className="button-row">
                <button type="button" onClick={generateCharacterDescription} disabled={isSuggesting || Boolean(draft.builtIn)}>{isSuggesting ? "Generating…" : "Generate Description with AI"}</button>
                <button className="primary-small" disabled={Boolean(draft.builtIn)} type="button" onClick={() => saveCharacter(false)}>{draft.id ? "Update Character" : "Save to Character Library"}</button>
                <button type="button" disabled={!draft.id || Boolean(draft.builtIn)} onClick={deleteCharacter}>Delete Custom Character</button>
              </div>
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
              <label className="field"><span>Tone</span><select value={form.tone} onChange={(event) => update("tone", event.target.value)}>{tones.map((value) => <option key={value}>{value}</option>)}</select>{form.tone === "Custom" && <input value={form.customTone} onChange={(event) => update("customTone", event.target.value)} />}</label>
              <RatioControl label="Video ratio" value={form.videoRatio} width={form.videoCustomWidth} height={form.videoCustomHeight} onRatio={(value) => update("videoRatio", value)} onWidth={(value) => update("videoCustomWidth", value)} onHeight={(value) => update("videoCustomHeight", value)} />
              <RatioControl label="Start-frame ratio" value={form.startFrameRatio} width={form.startCustomWidth} height={form.startCustomHeight} onRatio={(value) => update("startFrameRatio", value)} onWidth={(value) => update("startCustomWidth", value)} onHeight={(value) => update("startCustomHeight", value)} />
              <RatioControl label="End-frame ratio" value={form.endFrameRatio} width={form.endCustomWidth} height={form.endCustomHeight} onRatio={(value) => update("endFrameRatio", value)} onWidth={(value) => update("endCustomWidth", value)} onHeight={(value) => update("endCustomHeight", value)} />
              <label className="toggle-field"><input type="checkbox" checked={form.includeCharacterBuildingPrompt} onChange={(event) => update("includeCharacterBuildingPrompt", event.target.checked)} /><span>Include Character-Building Prompt</span></label>
              {form.includeCharacterBuildingPrompt && <label className="field wide"><span>Character-building target</span><select value={form.characterBuildingCharacterId} onChange={(event) => update("characterBuildingCharacterId", event.target.value)}>{characters.map((profile) => <option value={profile.id} key={profile.id}>{profile.shortName}</option>)}</select></label>}
            </div>

            <details className="advanced-panel">
              <summary>Advanced Settings · narration, voices, music, and sound <span>+</span></summary>
              <div className="advanced-content">
                <div className="form-grid">
                  <label className="field wide"><span>Narration and voice mode</span><select value={form.narrationMode} onChange={(event) => update("narrationMode", event.target.value)}>{narrationModes.map((value) => <option key={value}>{value}</option>)}</select></label>
                  {hasNarrator && <><label className="field wide"><span>Narrator guidance</span><textarea value={form.narratorGuidance} onChange={(event) => update("narratorGuidance", event.target.value)} /></label><label className="field wide"><span>Narration text</span><textarea value={form.narrationText} onChange={(event) => update("narrationText", event.target.value)} /></label></>}
                  {hasCharacterVoices && <><label className="field wide"><span>Character dialogue</span><textarea value={form.characterDialogue} onChange={(event) => update("characterDialogue", event.target.value)} /></label><label className="field wide"><span>Character voice guidance</span><textarea value={form.characterVoiceGuidance} onChange={(event) => update("characterVoiceGuidance", event.target.value)} /></label></>}
                  {!silentMode && <><label className="field"><span>Language</span><input value={form.language} onChange={(event) => update("language", event.target.value)} /></label><label className="field"><span>Vocal tone</span><input value={form.vocalTone} onChange={(event) => update("vocalTone", event.target.value)} /></label><label className="toggle-field"><input type="checkbox" checked={form.lipSyncRequired} onChange={(event) => update("lipSyncRequired", event.target.checked)} /><span>Lip-sync required</span></label></>}
                  {silentMode && <div className="silent-lock wide">No-dialogue lock active: no spoken dialogue, narration, or lip-sync instructions will be generated.</div>}
                  <label className="field"><span>Music type</span><input disabled={form.noMusic} value={form.musicType} onChange={(event) => update("musicType", event.target.value)} /></label>
                  <label className="field"><span>Music mood</span><input disabled={form.noMusic} value={form.musicMood} onChange={(event) => update("musicMood", event.target.value)} /></label>
                  <label className="field"><span>Music intensity</span><select disabled={form.noMusic} value={form.musicIntensity} onChange={(event) => update("musicIntensity", event.target.value)}>{["Low", "Medium", "High"].map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label className="field"><span>Audio workflow</span><select value={form.audioMode} onChange={(event) => update("audioMode", event.target.value)}>{["Native-audio mode", "Editing-guide mode"].map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label className="toggle-field"><input type="checkbox" checked={form.noMusic} onChange={(event) => update("noMusic", event.target.checked)} /><span>No music</span></label>
                  <label className="field wide"><span>Sound-effects style</span><input value={form.soundEffectsStyle} onChange={(event) => update("soundEffectsStyle", event.target.value)} /></label>
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
            {pack && <div className="output-actions"><button type="button" onClick={saveCurrentPack}>Save Pack</button><button type="button" disabled={isDownloading} onClick={downloadWord}>{isDownloading ? "Preparing Word…" : "Download Word"}</button></div>}
          </div>

          {!pack && !legacyPack && <div className="empty-output"><span>✦</span><h3>Five clear outputs. One continuous production plan.</h3><p>Complete the episode idea and characters, then generate.</p></div>}

          {legacyPack && (
            <div className="legacy-output">
              <div className="legacy-note">This older 23-section pack is preserved in read-only mode. It has not been deleted or silently rewritten.</div>
              {legacyPack.items.map((item, index) => <article key={`${item.title}-${index}`}><h3>{item.title}</h3><pre>{item.value}</pre><CopyButton label="Copy" value={item.value} /></article>)}
            </div>
          )}

          {pack && qualityReport && (
            <>
              <article className="output-card">
                <div className="card-heading"><span>01 · CHARACTER</span><h3>Character-Building Prompt</h3><CopyButton label="Copy" value={pack.characterBuildingPrompt || "Character-building prompt disabled."} /></div>
                <pre>{pack.characterBuildingPrompt || "Disabled for this production."}</pre>
              </article>
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
