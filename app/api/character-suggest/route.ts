const fields = [
  "appearanceLock",
  "personalityLock",
  "colorLock",
  "scaleSizeLock",
  "vocalStyleLock",
  "movementStyle",
  "continuityRules",
  "negativeRules",
] as const;

type FieldName = typeof fields[number];

type OpenAIErrorPayload = {
  error?: { message?: string; type?: string; code?: string | null; param?: string | null };
};

function safeOpenAIError(status: number, error?: OpenAIErrorPayload["error"]) {
  const code = error?.code?.toLowerCase() || "";
  const type = error?.type?.toLowerCase() || "";
  const message = error?.message?.toLowerCase() || "";
  if (status === 401 || code === "invalid_api_key" || type === "authentication_error") {
    return { errorType: "invalid_api_key", error: "Invalid API key. Check OPENAI_API_KEY in .env.local." };
  }
  if (status === 429 || code === "insufficient_quota" || message.includes("quota") || message.includes("billing")) {
    return { errorType: "insufficient_quota", error: "Insufficient quota or billing is not active for this OpenAI API account." };
  }
  if (status === 404 || code === "model_not_found" || message.includes("model") && message.includes("access")) {
    return { errorType: "model_not_available", error: "The configured OpenAI model is not available for this API account." };
  }
  return { errorType: "api_request_failed", error: "The OpenAI API request failed. Please try again." };
}

function cleanRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { errorType: "missing_api_key", error: "AI Mode needs an OPENAI_API_KEY in .env.local. Demo Mode is still available." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown> | null;
  try {
    body = cleanRecord(await request.json());
  } catch {
    body = null;
  }
  const character = cleanRecord(body?.character);
  const context = cleanRecord(body?.context);
  const action = body?.action;
  const requestedInternalField = body?.requestedField;
  const requestedField = requestedInternalField === "scaleLock" ? "scaleSizeLock" : requestedInternalField;

  if (
    !body || !character || !context ||
    !["suggestSingleField", "generateFullCharacterBible"].includes(String(action)) ||
    typeof character.shortName !== "string" || !character.shortName.trim() ||
    typeof character.fullIdentity !== "string" || !character.fullIdentity.trim() ||
    typeof character.role !== "string"
  ) {
    return Response.json({ error: "Add a short name, full identity, and role before requesting a suggestion." }, { status: 400 });
  }
  if (action === "suggestSingleField" && !fields.includes(requestedField as FieldName)) {
    return Response.json({ error: "Choose a valid character field to suggest." }, { status: 400 });
  }

  const outputKeys = action === "suggestSingleField" ? ["suggestion"] : [...fields];
  const schema = {
    type: "object",
    properties: Object.fromEntries(outputKeys.map((key) => [key, { type: "string" }])),
    required: outputKeys,
    additionalProperties: false,
  };
  const instructions = `You are the senior character design and continuity director for Slapstick Prompt Pack.
Write practical, detailed, professional character-bible prompt language for consistent family-friendly AI image and video generation.

Global requirements:
- Return only the strict JSON schema supplied.
- Preserve stable identity, colors, size, role, movement style, and vocal style.
- Prevent duplicated characters, accidental extra copies, random outfit changes, species changes, morphing faces, distorted anatomy, extra limbs, merged bodies, and sudden role changes.
- Make every description specific to the supplied identity, role, visual style, tone, platform, video model, and dialogue mode.
- Do not invent copyrighted or famous-character traits.
- Keep the result production-ready, clear, internally consistent, and useful across start frames, video prompts, end frames, and future episodes.

Field guidance:
- appearanceLock: species/type, shape, silhouette, face, eyes, body proportions, signature features, texture, and cartoon rendering style.
- personalityLock: behavior, emotion, motivation, relationships, role, and reaction style.
- colorLock: precise palette and marking guidance that prevents color drift.
- scaleSizeLock: relative size, proportions, signature-feature volume, and framing consistency.
- vocalStyleLock: obey dialogue mode. For No dialogue, begin exactly: "No spoken dialogue. Use only non-verbal expressive cartoon reactions such as gasps, squeaks, chuckles, or playful sounds if needed."
- movementStyle: species- and personality-specific movement, anticipation, weight, arcs, and recovery.
- continuityRules: lock the character across start frame, video action, end frame, and future episodes.
- negativeRules: a direct negative prompt block forbidding duplication, species/color/scale/face/role changes, extra limbs, distorted anatomy, morphing, random outfits, and merging.

For an enemy, keep the character distinct, mischievous and family-friendly; never change the enemy into the hero.
For a hero, maintain a charming, readable heroic identity and consistent winning role.`;
  const input = action === "suggestSingleField"
    ? `Suggest only ${String(requestedField)} for this character:\n${JSON.stringify({ character, context }, null, 2)}`
    : `Generate the complete eight-field character bible:\n${JSON.stringify({ character, context }, null, 2)}`;

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        instructions,
        input,
        text: {
          format: {
            type: "json_schema",
            name: action === "suggestSingleField" ? "character_field_suggestion" : "full_character_bible",
            strict: true,
            schema,
          },
        },
        max_output_tokens: action === "suggestSingleField" ? 1200 : 5000,
      }),
    });
    const data = await openAIResponse.json() as OpenAIErrorPayload & {
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    if (!openAIResponse.ok) {
      console.error("[Character Suggest API] OpenAI response error", {
        status: openAIResponse.status,
        type: data.error?.type || null,
        code: data.error?.code || null,
        param: data.error?.param || null,
        message: data.error?.message || "No error message returned",
      });
      return Response.json(safeOpenAIError(openAIResponse.status, data.error), { status: openAIResponse.status });
    }
    const outputText = data.output?.flatMap((item) => item.content || [])
      .find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("OpenAI returned no structured character suggestion.");
    const parsed = JSON.parse(outputText) as Record<string, unknown>;
    if (!outputKeys.every((key) => typeof parsed[key] === "string" && String(parsed[key]).trim())) {
      throw new Error("OpenAI returned an incomplete character suggestion.");
    }
    return Response.json(parsed);
  } catch (error) {
    console.error("[Character Suggest API] Request failure", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown request failure",
    });
    return Response.json(
      { errorType: "api_request_failed", error: "Network/API request failed while generating the character suggestion." },
      { status: 502 },
    );
  }
}
