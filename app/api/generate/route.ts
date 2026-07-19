import {
  CharacterProfile,
  ProductionForm,
  ProductionPack,
  QualityFinding,
  productionPackKeys,
} from "../../production-types";
import { buildAuthorizedSceneInventory, buildObjectStateLedger, selectedModelAdapter } from "../../production-engine";

type RequestBody = {
  action?: "generate" | "fix";
  form?: ProductionForm;
  characters?: CharacterProfile[];
  activeCharacterIds?: string[];
  activeCharacters?: Array<{
    id: string;
    name: string;
    role: "Hero" | "Companion" | "Enemy";
    fullIdentity: string;
    description: string;
  }>;
  pack?: ProductionPack;
  qualityFindings?: QualityFinding[];
};

type OpenAIError = {
  error?: {
    type?: string;
    code?: string;
    message?: string;
    param?: string | null;
  };
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: Object.fromEntries(productionPackKeys.map((key) => [key, { type: "string" }])),
  required: productionPackKeys,
};

function safeError(status: number, error?: OpenAIError["error"]) {
  const code = `${error?.code || ""} ${error?.type || ""} ${error?.message || ""}`.toLowerCase();
  if (status === 401 || code.includes("invalid_api_key")) {
    return { errorType: "invalid_api_key", error: "Invalid API key. Check OPENAI_API_KEY in .env.local." };
  }
  if (status === 429 && (code.includes("quota") || code.includes("billing"))) {
    return { errorType: "insufficient_quota", error: "Insufficient quota or billing is not active for this API key." };
  }
  if (status === 404 || code.includes("model_not_found") || code.includes("model")) {
    return { errorType: "model_unavailable", error: "The configured OpenAI model is not available for this API key." };
  }
  return { errorType: "api_request_failed", error: "OpenAI API request failed. Check the server logs for details." };
}

function completePack(value: unknown): value is ProductionPack {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return productionPackKeys.every((key) => typeof candidate[key] === "string");
}

function generationInstructions(action: "generate" | "fix") {
  return `You are the production intelligence engine for Slapstick Prompt Pack.
Return clean JSON matching the supplied schema exactly. Do not add markdown or extra keys.

Create one synchronized, family-friendly cartoon-video production plan. The nine fields are:
- videoTitle: preserve the customer's non-empty manual title exactly; otherwise create one memorable, original, non-generic title without hashtags, quotation marks, trademarks, or franchise names.
- characterBuildingPrompt: one labeled subsection for every active character when enabled; return an empty string when disabled.
- startFramePrompt: a production-ready still-image prompt with the selected start-frame ratio, full cast identity locks, composition, first-second hook, lighting, geography, and negative constraints.
- endFramePrompt: a matching still-image prompt with the selected end-frame ratio, exact environment/identity continuity, hero's clear win, enemies receiving the harmless backfire, and a readable payoff.
- videoLock: metadata and immutable production rules covering platform, model, ratio, duration, style, tone, motion level, cast, roles, object, setting, narration/voice, continuity, safety, and negative constraints.
- videoTimeline: non-overlapping second ranges covering exactly the selected duration. Begin visible action at 0:00 and end with a resolved, replayable payoff.
- musicPath: ranges synchronized to the video timeline. Respect no-music mode; otherwise specify score, energy, rhythm, mix, and loop resolution.
- soundEffects: ranges synchronized to visible actions only. Include mix guidance and never invent off-screen action.
- finalGenerationRule: a concise final pass requiring the model to obey the locks and timelines as one continuous production.

Hard requirements:
- Preserve the exact selected video, start-frame, and end-frame ratios and custom dimensions where supplied.
- Materially follow the selected model adapter, including its prompt structure, camera, motion, pacing, reference-frame, audio, and negative policies. Do not merely mention the model name.
- Translate every selected tone into pacing, staging, expressions, camera behavior, motion, timing, music, or sound.
- Preserve the exact duration in every timing section; all ranges must align and cover it completely.
- Include the selected platform and selected AI video model prominently in videoLock.
- Use the supplied Character Library descriptions as authoritative. Introduce full character names once, then short names.
- Only activeCharacters may appear. Never introduce an unchecked saved character. Use exact active names in both frames, the lock, and timeline.
- Keep hero, enemy, companion, and supporting roles unambiguous. The hero must clearly win. Enemies must receive their own harmless trap/backfire.
- Stable identity, face, species, colors, wardrobe, scale, anatomy, voices, movement style, and screen direction.
- No duplicated characters, extra unrequested characters, extra limbs, distorted limbs, morphing faces, merged bodies, random props, sudden background changes, or unexplained objects appearing/disappearing.
- No sudden cuts unless expressly requested. Prefer one continuous shot with smooth, logical, causally readable movement.
- No text, subtitles, logos, or watermarks unless expressly requested.
- Follow voice layers exactly. No Spoken Dialogue is exclusive and means no spoken dialogue, narrator, lip-sync, or speech text; otherwise include only selected speaker layers and keep ownership unambiguous.
- Keep music and SFX synchronized with visible action and duration.
- Apply a PHYSICAL GROUNDING LOCK in videoLock: define a clear ground plane or support surface; all standing characters have visible contact; ordinary objects rest, are held, attached, or move only from a visible force; preserve believable weight, contact shadows, and gravity. Never use unexplained hovering, drifting, gliding, elevation changes, or floating props.
- Apply a SMOOTH MOTION LOCK in videoLock: every important action has anticipation, acceleration, main movement, impact/change, follow-through, deceleration, and a settled final pose. No snapping, teleportation, gliding feet, frozen midair motion, instant reversal, collision intersection, or object passing through a body or surface.
- When any jump, launch, bounce, fall, or thrown object is needed, explicitly state the visible trigger, direction, force, continuous gravity-driven arc, peak, descent, landing surface, impact absorption, follow-through, and settling. Do not add airborne motion otherwise.
- Make the start frame physically grounded and motion-ready: visible support contact and shadows, no completed action, no floating props, and a readable action lane. Make the end frame physically resolved: final support contact, no unresolved airborne character or object, complete landing and settling, matching ground plane and camera perspective.
- When Ultra Retention Mode is enabled, create an immediate first-frame visual hook, a meaningful active change within the first second and 0–3 seconds, one dominant readable event per beat, a physically caused major escalation around 50–65% of duration, and a completed final payoff occupying the last phase. Do not force frantic pacing for Calm or Emotional unless Fast, Energetic, or Chaotic slapstick is also selected.
- Translate every selected tone into concrete pace, motion, camera, expression, music, and sound behavior. Fast must use ultra-fast readable pacing; Chaotic slapstick must remain controlled causal chaos; Calm must avoid inappropriate frantic motion.
- When both Fast and Chaotic slapstick are selected, activate EXTREME FAST-CHAOTIC MOTION: at exactly 0:00 the hero is already in a visible physical action and the named object responds; no fade-in, static hold, title card, slow reveal, idle beat, or delayed trigger. Use compressed anticipation (at most 0.7 seconds), immediate powerful acceleration, short connected 0.4–1.2 second beats, instant readable reactions, a high-impact causal midpoint backfire around 45–60% of duration, and a short stable payoff. Avoid the words slowly, gradually, gently, calmly, long pause, slow reveal, lingering, waits, and remains still. Keep one continuous causal action chain and a wide action-ready camera; music and sound begin at 0:00 with the first physical event.
- Add a strict presence and visibility lock: every active character is physically established and visible in the opening frame, remains continuously present and readable through the end frame, and retains the exact count, role, identity, and screen direction. Do not spawn, despawn, vanish, reappear, merge, split, substitute, transform, or accidentally crop out any selected character. Only allow a customer-explicit entrance, exit, obstruction, or off-screen movement when its timed continuous path, edge/surface, direction, return state, and final position are shown.
- Add an object continuity lock: the important object has a visible supported starting position, moves only through a named visible force along a continuous path, remains identifiable, and has a visible final position. Never make it appear from nowhere, disappear, duplicate, or change design without a customer-requested complete visible transition.
- Add a natural-motion and action-ownership lock: every timeline range begins at 0:00 and names the exact character or object owner, action, direction, visible cause, result, and transition. Prohibit random gestures, twitching, dancing, spinning, jumping, sliding, snapping, unrelated reactions, random background activity, decorative effects that hide the cast, and random camera movement.
- Apply tone from frame zero: selected tones control the opening pose, first movement, camera, expression, music, and sound at exactly 0:00, with no neutral introduction. If Fast is selected, identify who is already moving, what object responds, direction, cause, expression, and wide camera state at exactly 0:00; no static hold, fade-in, title card, delayed motion, or slow reveal.
- Keep a continuous wide or medium-wide camera composition whenever practical so active characters remain visible. No camera-caused disappearance, unexplained crop-out, action-axis reversal, sudden reframing, or empty/background-only shot.
- Apply a CLOSED-WORLD CONTINUITY RULE: use only the supplied Authorized Scene Inventory—checked active characters, selected important object, named main-action components, fixed environment, and explicit customer-authorized exceptions. Never invent a new prop, creature, vehicle, decoration, particle source, foreground item, interactive background element, or effect source for hook, escalation, impact, audio, or payoff.
- Include AUTHORIZED CAST, AUTHORIZED OBJECTS, FIXED ENVIRONMENT, FORBIDDEN ADDITIONS, SCENE INVENTORY LOCK, EXACT COUNT LOCK, and NO-SPAWN / NO-DESPAWN LOCK inside videoLock. Every timeline range inherits the exact entity state from the prior range; no scene reset, duplicate, replacement, object in two positions, new entity, or removed entity.
- Respect object state ledgers: every authorized important object has a visible supported start position, one named force and continuous path, and a visible supported final position. No unauthorized object transformation, destruction, disappearing, or duplication.
- Default to one continuous wide/medium-wide shot. No sudden cut, jump cut, cutaway, angle replacement, camera teleport, freeze frame, midair freeze, or static hold. A customer-authorized cut must state its exact time and preserve traceability; a tension hold remains living with subtle movement rather than freezing.
- If Character Cartoon Sounds is enabled, place concise nonverbal vocalizations inside soundEffects only. Assign each sound to an exact active character name and visible reaction. No understandable words, quotation-mark dialogue, random voices, or character vocalizations in musicPath.
- Avoid contradictory, overloaded instructions. Prioritize polished, coherent, stable, zero-error continuity.
- Start frame, video action, and end frame must share environment, lighting, cast placement, object state, scale, color, and story geography.

${action === "fix"
    ? "Repair task: review the current complete pack and quality findings. Return a complete synchronized replacement pack. Improve weak sections while preserving every selected setting, character lock, story fact, platform, model adapter, ratio, duration, tone, voice layer, audio choice, narration choice, manually written title, and already-strong section."
    : "Generation task: build the complete synchronized pack from the supplied form and character records."}`;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return Response.json(
      {
        errorType: "missing_api_key",
        error: "AI Mode needs an OPENAI_API_KEY in .env.local. Demo Mode is still available.",
      },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return Response.json({ error: "The production request was not valid JSON." }, { status: 400 });
  }

  const action = body.action === "fix" ? "fix" : "generate";
  if (!body.form || !Array.isArray(body.characters)) {
    return Response.json({ error: "The production form and character records are required." }, { status: 400 });
  }
  const activeCharacters = body.activeCharacters;
  const activeIds = body.activeCharacterIds;
  if (!Array.isArray(activeCharacters) || !Array.isArray(activeIds) || activeCharacters.length < 1) {
    return Response.json({ error: "At least one active character is required." }, { status: 400 });
  }
  const uniqueIds = new Set(activeCharacters.map((character) => character.id));
  const validActiveCharacters = uniqueIds.size === activeCharacters.length &&
    activeIds.length === activeCharacters.length &&
    activeIds.every((id) => uniqueIds.has(id)) &&
    activeCharacters.filter((character) => character.role === "Hero").length === 1 &&
    activeCharacters.every((character) =>
      character.id.trim() && character.name.trim() && character.fullIdentity.trim() &&
      character.description.trim() && ["Hero", "Companion", "Enemy"].includes(character.role));
  if (!validActiveCharacters) {
    return Response.json({ error: "Active characters need unique IDs, valid roles, complete identity fields, and exactly one Hero." }, { status: 400 });
  }
  if (action === "fix" && !completePack(body.pack)) {
    return Response.json({ error: "A complete current production pack is required for repair." }, { status: 400 });
  }

  const inventoryCharacters = body.characters.filter((character) => activeIds.includes(character.id));
  const authorizedSceneInventory = buildAuthorizedSceneInventory(body.form, inventoryCharacters);
  const objectStateLedger = buildObjectStateLedger(authorizedSceneInventory);
  const input = action === "fix"
    ? {
        form: body.form,
        modelAdapter: selectedModelAdapter(body.form),
        characters: body.characters,
        activeCharacterIds: activeIds,
        activeCharacters,
        authorizedSceneInventory,
        objectStateLedger,
        currentPack: body.pack,
        qualityFindings: body.qualityFindings || [],
      }
    : { form: body.form, modelAdapter: selectedModelAdapter(body.form), characters: body.characters, activeCharacterIds: activeIds, activeCharacters, authorizedSceneInventory, objectStateLedger };

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        instructions: generationInstructions(action),
        input: JSON.stringify(input, null, 2),
        text: {
          format: {
            type: "json_schema",
            name: "slapstick_prompt_pack",
            strict: true,
            schema,
          },
        },
        max_output_tokens: 11000,
      }),
    });

    const data = await openAIResponse.json() as OpenAIError & {
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    if (!openAIResponse.ok) {
      console.error("[Slapstick Prompt Pack] OpenAI error", {
        status: openAIResponse.status,
        type: data.error?.type || null,
        code: data.error?.code || null,
        param: data.error?.param || null,
        message: data.error?.message || "No message returned",
      });
      return Response.json(safeError(openAIResponse.status, data.error), { status: openAIResponse.status });
    }

    const outputText = data.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text")
      ?.text;
    if (!outputText) {
      return Response.json({ error: "AI Mode returned an empty production pack. Please try again." }, { status: 502 });
    }

    const pack = JSON.parse(outputText) as unknown;
    if (!completePack(pack)) {
      return Response.json({ error: "AI Mode returned an incomplete production pack. Please try again." }, { status: 502 });
    }
    return Response.json(pack);
  } catch (caught) {
    console.error("[Slapstick Prompt Pack] Network/API request failed", caught);
    return Response.json(
      {
        errorType: "network_api_failure",
        error: "Network/API request failed. Check the server connection and try again.",
      },
      { status: 502 },
    );
  }
}
