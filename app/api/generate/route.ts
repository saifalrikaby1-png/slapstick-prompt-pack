const sectionKeys = [
  "episodeTitle",
  "startFrameImagePrompt",
  "endFrameImagePrompt",
  "mainVideoPrompt",
  "selectedModelPrompt",
  "alternativeModelPrompt",
  "videoTimelineBySeconds",
  "soundEffectsPlan",
  "musicPlan",
  "musicPathBySeconds",
  "soundEffectsTimelineBySeconds",
  "characterVocalLock",
  "characterBibleUsed",
  "qualitySummary",
  "productionSafetyNotes",
  "facebookCaption",
  "instagramCaption",
  "tiktokCaption",
  "youtubeTitle",
  "youtubeDescription",
  "youtubeHashtags",
  "pinnedComment",
  "retentionChecklist",
] as const;

type FormPayload = {
  hero: string;
  enemies: string;
  object: string;
  trap: string;
  duration: string;
  ratio: string;
  platform: string;
  videoModel: string;
  style: string;
  tone: string;
  musicDirection: string;
  customMusic: string;
  dialogueMode: string;
  heroVocalStyle: string;
  enemyVocalStyle: string;
  narratorVocalStyle: string;
  vocalLockNotes: string;
  characterBible: string;
  qualityControlEnabled: boolean;
  qcPreventDuplication: boolean;
  qcPreserveIdentity: boolean;
  qcPreventObjectChanges: boolean;
  qcPreventSuddenCuts: boolean;
  qcEnforceRatio: boolean;
  qcEnforceDuration: boolean;
  qcStrongHook: boolean;
  qcStrongPayoff: boolean;
  qcVocalConsistency: boolean;
  qcFamilyFriendly: boolean;
  additionalQualityNotes: string;
  notes: string;
};

const repairSectionKeys: Record<string, readonly (typeof sectionKeys)[number][]> = {
  "start-frame": ["startFrameImagePrompt"],
  "end-frame": ["endFrameImagePrompt"],
  "main-video": ["mainVideoPrompt"],
  "selected-model": ["selectedModelPrompt"],
  "music-path": ["musicPathBySeconds"],
  "sfx-timeline": ["soundEffectsTimelineBySeconds"],
  captions: ["facebookCaption", "instagramCaption", "tiktokCaption"],
  "youtube-metadata": ["youtubeTitle", "youtubeDescription", "youtubeHashtags"],
};

const variantKeys = [
  "episodeTitle",
  "startFrameImagePrompt",
  "endFrameImagePrompt",
  "mainVideoPrompt",
  "selectedModelPrompt",
  "videoTimelineBySeconds",
  "musicPathBySeconds",
  "soundEffectsTimelineBySeconds",
  "captions",
  "hashtags",
  "pinnedComment",
  "retentionChecklist",
] as const;

type OpenAIErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: string | null;
    param?: string | null;
  };
};

function safeOpenAIError(status: number, error?: OpenAIErrorPayload["error"]) {
  const code = error?.code?.toLowerCase() || "";
  const type = error?.type?.toLowerCase() || "";
  const message = error?.message?.toLowerCase() || "";

  if (status === 401 || code === "invalid_api_key" || type === "authentication_error") {
    return {
      errorType: "invalid_api_key",
      error: "Invalid API key. Check OPENAI_API_KEY in .env.local.",
    };
  }

  if (
    status === 429 ||
    code === "insufficient_quota" ||
    type === "insufficient_quota" ||
    message.includes("quota") ||
    message.includes("billing")
  ) {
    return {
      errorType: "insufficient_quota",
      error: "Insufficient quota or billing is not active for this OpenAI API account.",
    };
  }

  if (
    status === 404 ||
    code === "model_not_found" ||
    code === "invalid_model" ||
    message.includes("model") && (message.includes("access") || message.includes("exist"))
  ) {
    return {
      errorType: "model_not_available",
      error: "The configured OpenAI model is not available for this API account.",
    };
  }

  return {
    errorType: "api_request_failed",
    error: "The OpenAI API request failed. Please try again.",
  };
}

function isFormPayload(value: unknown): value is FormPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const standardFields = [
    "hero", "enemies", "object", "trap", "duration", "ratio", "platform", "videoModel",
    "style", "tone", "musicDirection", "customMusic", "dialogueMode", "heroVocalStyle",
    "enemyVocalStyle", "narratorVocalStyle", "vocalLockNotes", "additionalQualityNotes", "notes",
  ];
  const qualityFlags = [
    "qualityControlEnabled", "qcPreventDuplication", "qcPreserveIdentity", "qcPreventObjectChanges",
    "qcPreventSuddenCuts", "qcEnforceRatio", "qcEnforceDuration", "qcStrongHook", "qcStrongPayoff",
    "qcVocalConsistency", "qcFamilyFriendly",
  ];
  return standardFields.every((key) => typeof candidate[key] === "string" && candidate[key].length <= 1000) &&
    qualityFlags.every((key) => typeof candidate[key] === "boolean") &&
    typeof candidate.characterBible === "string" && candidate.characterBible.length <= 12000;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        errorType: "missing_api_key",
        error: "AI Mode needs an OPENAI_API_KEY in .env.local. Demo Mode is still available.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The form data could not be read." }, { status: 400 });
  }

  const requestBody = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const action = requestBody.action === "fix" || requestBody.action === "regenerateSection" || requestBody.action === "generateVariants"
    ? requestBody.action
    : "generate";
  const form: unknown = action === "generate" ? body : requestBody.form;
  if (!isFormPayload(form) || !form.hero.trim() || !form.enemies.trim() || !form.object.trim() || !form.trap.trim()) {
    return Response.json({ error: "Please complete all four story ingredients." }, { status: 400 });
  }

  const currentPack = requestBody.pack && typeof requestBody.pack === "object"
    ? requestBody.pack as Record<string, unknown>
    : null;
  if (action !== "generate" && (!currentPack || !sectionKeys.every((key) => typeof currentPack[key] === "string"))) {
    return Response.json({ error: "The current production pack could not be read." }, { status: 400 });
  }
  const selectedRepairKeys = action === "regenerateSection" && typeof requestBody.selectedSection === "string"
    ? repairSectionKeys[requestBody.selectedSection]
    : undefined;
  if (action === "regenerateSection" && !selectedRepairKeys) {
    return Response.json({ error: "Choose a valid section to regenerate." }, { status: 400 });
  }
  const outputKeys = action === "regenerateSection" ? [...selectedRepairKeys!] : [...sectionKeys];
  const sectionSchema = {
    type: "object",
    properties: Object.fromEntries(outputKeys.map((key) => [key, { type: "string" }])),
    required: outputKeys,
    additionalProperties: false,
  };
  const variantSchema = {
    type: "object",
    properties: Object.fromEntries(variantKeys.map((key) => [key, { type: "string" }])),
    required: [...variantKeys],
    additionalProperties: false,
  };
  const schema = action === "generateVariants"
    ? {
        type: "object",
        properties: {
          safeVersion: variantSchema,
          viralVersion: variantSchema,
          cinematicVersion: variantSchema,
        },
        required: ["safeVersion", "viralVersion", "cinematicVersion"],
        additionalProperties: false,
      }
    : sectionSchema;

  const creativeBrief = {
    hero: form.hero,
    enemies: form.enemies,
    "object or food": form.object,
    "trap type": form.trap,
    duration: form.duration,
    "selected video ratio": form.ratio,
    "target platform": form.platform,
    "selected AI video model": form.videoModel,
    "visual style": form.style,
    tone: form.tone,
    "music direction": form.musicDirection === "Custom"
      ? form.customMusic || "Custom direction not supplied"
      : form.musicDirection,
    "dialogue mode": form.dialogueMode,
    "hero vocal style": form.heroVocalStyle,
    "enemy vocal style": form.enemyVocalStyle,
    "narrator vocal style": form.narratorVocalStyle,
    "vocal lock notes": form.vocalLockNotes,
    "character library / brand bible": form.characterBible || "No saved character profiles matched this setup",
    "prompt quality control": {
      enabled: form.qualityControlEnabled,
      "prevent character duplication": form.qcPreventDuplication,
      "preserve character identity": form.qcPreserveIdentity,
      "prevent sudden object changes": form.qcPreventObjectChanges,
      "prevent sudden cuts": form.qcPreventSuddenCuts,
      "enforce ratio consistency": form.qcEnforceRatio,
      "enforce duration consistency": form.qcEnforceDuration,
      "strong opening hook": form.qcStrongHook,
      "strong ending payoff": form.qcStrongPayoff,
      "dialogue and vocal consistency": form.qcVocalConsistency,
      "family-friendly output": form.qcFamilyFriendly,
      "additional quality notes": form.additionalQualityNotes || "None",
    },
    "extra notes": form.notes || "None",
  };

  const instructions = `You are the senior creative director for Slapstick Prompt Pack.
Create a polished, immediately usable production pack for a family-friendly cartoon short.

Non-negotiable rules:
- Return content for every field in the supplied JSON schema and nothing outside the schema.
- Keep everything funny, safe, and family-friendly.
- Read the supplied "prompt quality control" settings before writing. When enabled, inject every enabled safeguard naturally into the relevant image, video, model-specific, music, sound, vocal, timeline, and retention sections. Do not claim a disabled optional safeguard was applied.
- Keep instructions clear, non-contradictory, readable, and free of unnecessary overload.
- qualitySummary must list which Prompt Quality Control safeguards were enabled and applied, plus any additional quality notes.
- productionSafetyNotes must be a short dynamic creator checklist tailored to the selected platform, ratio, duration, model, music direction, dialogue mode, and vocal locks.
- Begin mainVideoPrompt with this exact five-line metadata structure, populated from the brief:
  Target platform: [target platform]
  Selected AI video model: [selected AI video model]
  Video ratio: [selected video ratio]
  Video duration: [duration]
  Visual style: [visual style]
- After the metadata and music/dialogue lines, mainVideoPrompt must include a clearly labeled TIMING BLOCK with exact second ranges covering the full supplied duration.
- The mainVideoPrompt must clearly name both the target platform and selected AI video model.
- selectedModelPrompt must be optimized specifically for the selected AI video model and name that model clearly.
- alternativeModelPrompt must choose and name a sensible different model, then optimize specifically for it.
- Introduce the full character names once at the beginning of each standalone visual/video prompt, then use short first names.
- Make visible action begin in the first second; no static setup.
- The start-frame image prompt, end-frame image prompt, main video prompt, OpenArt prompt, and Higgsfield prompt must all explicitly state and follow the selected video ratio from the creative brief.
- Keep the start frame, end frame, and main video visually consistent: same environment, lighting direction, character scale, colors, props, screen direction, and story geography.
- For 9:16 vertical, use a vertical 9:16 composition, center characters and action for Reels/Shorts/TikTok, and preserve safe top and bottom framing.
- For 16:9 horizontal, use a horizontal 16:9 cinematic composition with wider left-to-right staging and clear spatial relationships.
- For 1:1 square, use a square 1:1 composition and keep the important characters and action centered.
- For 4:5 portrait, use a portrait 4:5 composition with centered characters and safe framing near the top and bottom.
- The hero must clearly and decisively win at the end.
- The enemies must clearly receive their own harmless trap/backfire.
- Use a single continuous shot for short slapstick videos unless the selected model or target platform clearly requires shot-based output.
- AI video prompts must include: "no text, no subtitles, no logo, no watermark."
- Follow the supplied dialogue mode exactly:
  No dialogue = no spoken dialogue and no narrator; use action, expressions, sound effects, and music only.
  Character dialogue = only characters speak; lock each character to the supplied vocal style.
  Narrator only = only the narrator speaks; characters have no spoken dialogue.
  Narrator + character dialogue = narrator and characters may speak, with clearly separated, consistent voices.
- When voices are allowed, include the relevant hero, enemy, and narrator vocal styles plus the vocal lock notes naturally in every video prompt.
- selectedModelPrompt and alternativeModelPrompt must include: "stable character identity, consistent colors, no extra characters, no duplicated characters, no morphing faces."
- Treat continuity and error prevention as the highest priority. Keep character identity, colors, scale, wardrobe, appearance, environment, lighting direction, screen direction, and story geography stable.
- Avoid duplicated or extra characters, morphing faces, distorted limbs, merged bodies, broken anatomy, random props, sudden background changes, sudden unusual events, and unexplained environment changes.
- Never make an object appear or disappear unless its movement, arrival, or removal is clearly shown on screen.
- Keep motion smooth, logical, and causally readable. Do not use sudden cuts unless the extra notes explicitly request shot-based editing.
- Keep start-frame, video action, and end-frame story continuity exact and production-safe.
- Include natural quality guidance such as: "high quality output, polished, coherent, stable, zero-error continuity."
- Make start-frame and end-frame prompts cinematic, detailed, visually specific, and composition-aware.
- Start-frame and end-frame prompts must name the target platform, selected AI video model, and selected ratio.
- mainVideoPrompt, selectedModelPrompt, and alternativeModelPrompt must state the selected music direction.
- soundEffectsPlan must coordinate its timing and mix with the selected music direction and only use sounds with clear visible sources.
- musicPlan must provide a production-ready score structure, timing, instrumentation/mood guidance, mix relationship to sound effects and voices, and a loop-friendly ending.
- If music direction is No Music, mainVideoPrompt, soundEffectsPlan, and musicPlan must clearly state there is no background music.
- videoTimelineBySeconds must cover the exact duration with aligned, non-overlapping ranges and describe the visible action in each range.
- musicPathBySeconds must use the same timing ranges as the video timeline and describe mood, intensity, rhythm, ending sting, and loop point. If No Music is selected, state no background music in every range.
- soundEffectsTimelineBySeconds must use the same timing ranges as the video timeline and place only visible, motivated effects such as whoosh, boing, pop, crash, bounce, squeak, sparkle, soft impact, or comedy hit.
- characterVocalLock must summarize dialogue mode, each supplied vocal style, the vocal lock notes, and exactly who is allowed to speak.
- characterBibleUsed must summarize the matched hero and enemy identities, appearance locks, role locks, vocal locks, continuity rules, and negative rules from the supplied Character Library / Brand Bible.
- When a Character Library / Brand Bible is supplied, copy its appearance locks into both image prompts; apply appearance, personality, movement, color, scale, and role locks in every video prompt; include vocal locks whenever dialogue or vocal reactions are enabled; and merge all negative rules into continuity constraints.
- Character-library rules override generic visual assumptions but never override family safety. Keep hero and enemy roles unambiguous: the hero wins in hero-format slapstick, and enemies receive their own harmless backfire in trap/backfire stories.
- Duration handling: treat "1 minute" as 60 seconds and unclear duration as 15 seconds. For 10–15 seconds use a tight second-by-second slapstick timeline; for 20–30 seconds allow a slightly longer hook, build-up, and payoff; for 45–60 seconds use three clear ranged beats: hook, build-up, payoff.
- The video timeline, music path, sound-effects timeline, Main Video Prompt, start frame, and end frame must describe one synchronized production plan with matching actions and no timing contradictions.
- Apply platform behavior:
  Facebook Reels = fast hook, clear slapstick, replayable ending, comment/follow CTA.
  Instagram Reels = clean visuals, expressive characters, bright shareable moment.
  TikTok = instant chaos, fast comedy, strong first second.
  YouTube Shorts = clear story, title potential, high-retention loop.
  YouTube 16:9 Video = wider cinematic staging, slightly more story structure.
  Facebook 16:9 Video = wider framing, clear family-friendly comedy.
  Generic Social Video = universal prompt.
- Apply model behavior:
  OpenArt - Seedance = direct, clear, motion-focused, image-to-video friendly.
  OpenArt - Kling = stronger physical motion, camera movement, action continuity.
  OpenArt - Veo = cinematic, natural, descriptive, coherent motion.
  Higgsfield = cinematic camera motion, action beats, subject consistency, slapstick timing.
  Runway = concise, cinematic, shot-focused.
  Google Flow / Veo = descriptive, cinematic, family-friendly, clear scene continuity.
  PixVerse = simple, direct, visually clear.
  Generic AI Video Model = universal and platform-neutral.
- Make captions short, platform-native, naturally mention the character names, and include a follow call-to-action.
- Make the YouTube hashtags strong and include #BiscuitTheSquirrel and #BiscuitAndTheTroubleCrew.
- Make the retention checklist practical, line-separated, and specific to the supplied duration.
- Strengthen the start-frame prompt with a visible first-frame hook, ratio-safe readable composition, clear focal point, and controlled background.
- Strengthen the end-frame prompt with a clean payoff, resolved readable character positions, matching ratio, and exact visual continuity from the start.
- Keep Main Video Prompt action causally clear and prevent sudden cuts, unexplained objects, or contradictory actions when those quality safeguards are enabled.
- Model-specific prompts must reinforce stable identity, negative constraints, motion clarity, continuity, and controlled camera behavior appropriate to the selected model.
- Sound effects must map only to visible action beats; music must fit the selected mood and resolve inside the exact duration.
- Do not include markdown code fences.`;

  const qualityReport = requestBody.qualityReport && typeof requestBody.qualityReport === "object"
    ? requestBody.qualityReport
    : null;
  const actionInstructions = action === "generateVariants"
    ? `${instructions}

Three-variant task:
- Return exactly safeVersion, viralVersion, and cinematicVersion in the supplied schema.
- Each version must contain all requested variant fields and remain a complete, internally synchronized production direction.
- Safe Version: lowest generation-error risk, simple motion, minimal scene complexity, locked camera axis, strongest continuity.
- Viral Version: strongest first second, funnier family-friendly slapstick, clearer replayable ending, platform-native captions and engagement.
- Cinematic Version: richer visuals, controlled cinematic camera language, polished lighting, depth, atmosphere, and animated-film feeling.
- All three must preserve the supplied cast, Character Bible, roles, object, trap outcome, platform, model, ratio, exact duration, music direction, dialogue mode, and vocal locks.
- All three must include no duplicated characters, no extra unrequested characters, no sudden cuts, no sudden objects appearing or disappearing, no sudden background changes, no morphing faces, no distorted limbs, no random props, stable identity/colors/scale, smooth motion, and exact start-video-end continuity.
- Captions must combine short Facebook, Instagram, and TikTok copy with follow calls-to-action. Hashtags must be strong and searchable.`
    : action === "fix"
    ? `${instructions}

Repair task:
- Review the supplied current production pack and local quality report.
- Return the complete pack in the full schema.
- Improve only weak or inconsistent sections; preserve already strong content wherever possible.
- Preserve every selected setting, character-library lock, ratio, platform, model, duration, music direction, dialogue mode, and vocal lock exactly.
- Resolve all reported warnings without introducing new characters, props, cuts, branding, dialogue, or continuity changes.`
    : action === "regenerateSection"
      ? `${instructions}

Targeted regeneration task:
- Return only the fields present in the supplied JSON schema.
- Regenerate only the requested section group.
- Use the current production pack as continuity context and do not contradict any unchanged section.
- Preserve every selected setting, character-library lock, ratio, platform, model, duration, music direction, dialogue mode, vocal lock, timeline, and story outcome exactly.
- Keep names, action geography, start/end continuity, and timing synchronized with the unchanged pack.`
      : instructions;
  const input = action === "generate"
    ? `Build the production pack from this creative brief:\n${JSON.stringify(creativeBrief, null, 2)}`
    : `Creative brief:\n${JSON.stringify(creativeBrief, null, 2)}\n\nCurrent production pack:\n${JSON.stringify(currentPack, null, 2)}\n\nLocal quality report:\n${JSON.stringify(qualityReport, null, 2)}${action === "regenerateSection" ? `\n\nRequested section group: ${String(requestBody.selectedSection)}` : ""}`;

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        instructions: actionInstructions,
        input,
        text: {
          format: {
            type: "json_schema",
            name: action === "generateVariants"
              ? "slapstick_prompt_pack_variants"
              : action === "regenerateSection"
                ? "slapstick_prompt_pack_section_update"
                : "slapstick_prompt_pack",
            strict: true,
            schema,
          },
        },
        max_output_tokens: 11000,
      }),
    });

    const data = await openAIResponse.json() as OpenAIErrorPayload & {
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };

    if (!openAIResponse.ok) {
      console.error("[Slapstick API] OpenAI response error", {
        status: openAIResponse.status,
        type: data.error?.type || null,
        code: data.error?.code || null,
        param: data.error?.param || null,
        message: data.error?.message || "No error message returned",
      });
      return Response.json(safeOpenAIError(openAIResponse.status, data.error), { status: openAIResponse.status });
    }

    const outputText = data.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text")
      ?.text;

    if (!outputText) {
      return Response.json({ error: "AI Mode returned an empty production pack. Please try again." }, { status: 502 });
    }

    const pack = JSON.parse(outputText) as Record<string, unknown>;
    const variantsComplete = action !== "generateVariants" || ["safeVersion", "viralVersion", "cinematicVersion"].every((variantName) => {
      const variant = pack[variantName];
      return Boolean(variant && typeof variant === "object" && variantKeys.every((key) => typeof (variant as Record<string, unknown>)[key] === "string"));
    });
    if (!variantsComplete || action !== "generateVariants" && !outputKeys.every((key) => typeof pack[key] === "string")) {
      return Response.json({ error: "AI Mode returned an incomplete production pack. Please try again." }, { status: 502 });
    }

    if (action === "generateVariants") return Response.json({ variants: pack });
    if (action === "fix") return Response.json({ pack });
    if (action === "regenerateSection") return Response.json({ updates: pack });
    return Response.json(pack);
  } catch (caught) {
    console.error("[Slapstick API] Network/API request failed", caught);
    return Response.json(
      {
        errorType: "network_api_failure",
        error: "Network/API request failed. Check the server connection and try again.",
      },
      { status: 502 },
    );
  }
}
