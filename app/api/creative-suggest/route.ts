const actions = [
  "generateLocation", "expandLocation", "generateObject", "expandObject",
  "generateAction", "expandAction", "generatePayoff", "expandPayoff", "generateVideoTitle", "generateCompleteIdea",
] as const;

type Action = typeof actions[number];
type Exclusion = { name?: string; description?: string };
type RequestPayload = {
  action?: Action;
  idea?: string;
  context?: Record<string, unknown>;
  exclusions?: Exclusion[];
  collisionRetry?: boolean;
};

const requestCooldowns = new Map<string, number>();
const MAX_IDEA_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 16000;
const MAX_EXCLUSIONS = 60;
const COOLDOWN_MS = 750;
const REQUEST_TIMEOUT_MS = 20_000;

function safeError(status: number, detail = "") {
  const text = detail.toLowerCase();
  if (status === 401 || text.includes("invalid_api_key")) return "Invalid API key. Check OPENAI_API_KEY in .env.local.";
  if (status === 429) return "OpenAI quota or billing is not currently available.";
  if (status === 404 || text.includes("model")) return "The configured OpenAI model is not available.";
  return "The creative suggestion service could not complete the request.";
}

function conciseExclusions(value: unknown): Exclusion[] | null {
  if (!Array.isArray(value) || value.length > MAX_EXCLUSIONS) return null;
  const cleaned = value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const item = entry as Exclusion;
    const name = typeof item.name === "string" ? item.name.trim().slice(0, 120) : "";
    const description = typeof item.description === "string" ? item.description.trim().slice(0, 800) : "";
    return name || description ? { name, description } : null;
  });
  return cleaned.every(Boolean) ? cleaned as Exclusion[] : null;
}

function callerKey(request: Request, action: Action) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${forwarded}:${action}`;
}

function isCoolingDown(request: Request, action: Action, collisionRetry: boolean) {
  if (collisionRetry) return false;
  const now = Date.now();
  const key = callerKey(request, action);
  const previous = requestCooldowns.get(key) || 0;
  if (now - previous < COOLDOWN_MS) return true;
  requestCooldowns.set(key, now);
  if (requestCooldowns.size > 500) {
    for (const [entry, timestamp] of requestCooldowns) if (now - timestamp > 60_000) requestCooldowns.delete(entry);
  }
  return false;
}

function validSuggestion(value: unknown, titleOnly: boolean, completeIdea: boolean): value is { title: string } | { name: string; description: string } | Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (completeIdea) {
    const asset = (value: unknown) => Boolean(value && typeof value === "object" && typeof (value as Record<string, unknown>).name === "string" && typeof (value as Record<string, unknown>).description === "string");
    const fingerprint = item.creativeFingerprint as Record<string, unknown> | undefined;
    return typeof item.videoTitle === "string" && item.videoTitle.trim().length > 0 && item.videoTitle.length <= 100 &&
      asset(item.location) && asset(item.importantObject) && asset(item.actionOrTrap) && asset(item.endingOrPayoff) &&
      Boolean(fingerprint && ["settingCategory", "objectCategory", "actionMechanic", "escalationPattern", "payoffPattern"].every((key) => typeof fingerprint[key] === "string" && fingerprint[key].trim().length > 0));
  }
  if (titleOnly) return typeof item.title === "string" && item.title.trim().length > 0 && item.title.length <= 100;
  return typeof item.name === "string" && item.name.trim().length > 0 && item.name.length <= 100 &&
    typeof item.description === "string" && item.description.trim().length > 0 && item.description.length <= 4000;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return Response.json({ error: "AI Mode needs an OPENAI_API_KEY in .env.local. Demo Mode is still available." }, { status: 503 });
  }
  let body: RequestPayload;
  try {
    body = await request.json() as RequestPayload;
  } catch {
    return Response.json({ error: "The creative request was not valid JSON." }, { status: 400 });
  }
  const exclusions = conciseExclusions(body.exclusions || []);
  const contextLength = JSON.stringify(body.context || {}).length;
  if (!body.action || !actions.includes(body.action) || typeof body.idea !== "string" || body.idea.length > MAX_IDEA_LENGTH || !exclusions || contextLength > MAX_CONTEXT_LENGTH) {
    return Response.json({ error: "Use a valid suggestion type with concise creative details." }, { status: 400 });
  }
  if (isCoolingDown(request, body.action, body.collisionRetry === true)) {
    return Response.json({ error: "Please wait a moment before requesting another suggestion." }, { status: 429 });
  }

  const titleOnly = body.action === "generateVideoTitle";
  const completeIdea = body.action === "generateCompleteIdea";
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: completeIdea
      ? {
          videoTitle: { type: "string", maxLength: 100 },
          location: { type: "object", additionalProperties: false, properties: { name: { type: "string", maxLength: 100 }, description: { type: "string", maxLength: 4000 } }, required: ["name", "description"] },
          importantObject: { type: "object", additionalProperties: false, properties: { name: { type: "string", maxLength: 100 }, description: { type: "string", maxLength: 4000 } }, required: ["name", "description"] },
          actionOrTrap: { type: "object", additionalProperties: false, properties: { name: { type: "string", maxLength: 100 }, description: { type: "string", maxLength: 4000 } }, required: ["name", "description"] },
          endingOrPayoff: { type: "object", additionalProperties: false, properties: { name: { type: "string", maxLength: 100 }, description: { type: "string", maxLength: 4000 } }, required: ["name", "description"] },
          creativeFingerprint: { type: "object", additionalProperties: false, properties: { settingCategory: { type: "string", maxLength: 80 }, objectCategory: { type: "string", maxLength: 80 }, actionMechanic: { type: "string", maxLength: 80 }, escalationPattern: { type: "string", maxLength: 80 }, payoffPattern: { type: "string", maxLength: 80 } }, required: ["settingCategory", "objectCategory", "actionMechanic", "escalationPattern", "payoffPattern"] },
        }
      : titleOnly
      ? { title: { type: "string", maxLength: 100 } }
      : { name: { type: "string", maxLength: 100 }, description: { type: "string", maxLength: 4000 } },
    required: completeIdea ? ["videoTitle", "location", "importantObject", "actionOrTrap", "endingOrPayoff", "creativeFingerprint"] : titleOnly ? ["title"] : ["name", "description"],
  };
  const instructions = `You create original, family-friendly production assets for Slapstick Prompt Pack.
Preserve useful customer ideas while expanding them into concise, continuity-safe production language. Return a meaningfully different result from every exclusion. Never use trademarked franchise names.
Action: ${body.action}.
${body.action.includes("Location") ? "Cover visual identity, environmental features, palette, lighting, background elements, surfaces, landmarks, atmosphere, continuity locks, and elements that must not change." : ""}
${body.action.includes("Object") ? "Cover object type, shape, colors, materials, scale, moving parts, physical behavior, interaction, slapstick potential, continuity, negative rules, starting state, and ending state. Be semantically distinct from exclusions." : ""}
${body.action.includes("Action") ? "Use only the supplied cast, roles, location, object, duration, motion level, and tones. Define one clear cause-and-effect chain: setup, owner, trigger, direction, consequence, reactions, safety, and resolved state. Do not introduce characters or objects outside the supplied inventory." : ""}
${body.action.includes("Payoff") ? "Follow the action and exact scene inventory. Preserve every active character and the important object. Define final positions, expressions, object position, hero result, enemy/companion result, final beat, and a stable end-frame state. Add no new entity, object, or location." : ""}
${completeIdea ? "Create one coherent complete video idea. Use only active characters in the supplied context, preserve the exact scene inventory, use one physically relevant object and one readable cause-and-effect chain, then a stable final state. The title must accurately describe the action. Vary setting, object, mechanism, escalation, and payoff from every exclusion." : ""}
${titleOnly ? "Return one memorable original title. Avoid exclusions, generic wording, hashtags, quotation marks, and franchise names." : ""}
${body.collisionRetry ? "A prior result was too similar. Use a substantially different concept, silhouette, material, behavior, and wording." : ""}
Return only strict JSON.`;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        instructions,
        input: JSON.stringify({ idea: body.idea.trim(), context: body.context || {}, exclusions }),
        text: { format: { type: "json_schema", name: titleOnly ? "creative_title" : "creative_asset", strict: true, schema } },
        max_output_tokens: titleOnly ? 300 : 1600,
      }),
    });
    const data = await response.json() as { error?: { message?: string }; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    if (!response.ok) {
      console.error("[Creative Suggest] OpenAI error", { status: response.status, message: data.error?.message || "No message" });
      return Response.json({ error: safeError(response.status, data.error?.message) }, { status: response.status });
    }
    const text = data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
    if (!text) return Response.json({ error: "AI returned an empty creative suggestion." }, { status: 502 });
    let suggestion: unknown;
    try {
      suggestion = JSON.parse(text);
    } catch {
      return Response.json({ error: "AI returned an invalid creative suggestion." }, { status: 502 });
    }
    if (!validSuggestion(suggestion, titleOnly, completeIdea)) return Response.json({ error: "AI returned an incomplete creative suggestion." }, { status: 502 });
    return Response.json(suggestion);
  } catch (error) {
    console.error("[Creative Suggest] Network/API failure", error);
    return Response.json({ error: "Network/API request failed. Try Demo Mode or retry later." }, { status: 502 });
  }
}
