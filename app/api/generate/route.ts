import {
  CharacterProfile,
  ProductionForm,
  ProductionPack,
  QualityFinding,
  productionPackKeys,
} from "../../production-types";
import { selectedModelAdapter } from "../../production-engine";

type RequestBody = {
  action?: "generate" | "fix";
  form?: ProductionForm;
  characters?: CharacterProfile[];
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
- characterBuildingPrompt: a reusable, detailed identity-building prompt for the selected character, or a short explanation if disabled.
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
- Keep hero, enemy, companion, and supporting roles unambiguous. The hero must clearly win. Enemies must receive their own harmless trap/backfire.
- Stable identity, face, species, colors, wardrobe, scale, anatomy, voices, movement style, and screen direction.
- No duplicated characters, extra unrequested characters, extra limbs, distorted limbs, morphing faces, merged bodies, random props, sudden background changes, or unexplained objects appearing/disappearing.
- No sudden cuts unless expressly requested. Prefer one continuous shot with smooth, logical, causally readable movement.
- No text, subtitles, logos, or watermarks unless expressly requested.
- Follow voice layers exactly. No Spoken Dialogue is exclusive and means no spoken dialogue, narrator, lip-sync, or speech text; otherwise include only selected speaker layers and keep ownership unambiguous.
- Keep music and SFX synchronized with visible action and duration.
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
  if (action === "fix" && !completePack(body.pack)) {
    return Response.json({ error: "A complete current production pack is required for repair." }, { status: 400 });
  }

  const input = action === "fix"
    ? {
        form: body.form,
        modelAdapter: selectedModelAdapter(body.form),
        characters: body.characters,
        currentPack: body.pack,
        qualityFindings: body.qualityFindings || [],
      }
    : { form: body.form, modelAdapter: selectedModelAdapter(body.form), characters: body.characters };

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
