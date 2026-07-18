const actions = [
  "generateLocation", "expandLocation", "generateObject", "expandObject",
  "generateAction", "expandAction", "generatePayoff", "expandPayoff", "generateVideoTitle",
] as const;

type Action = typeof actions[number];
type RequestPayload = {
  action?: Action;
  idea?: string;
  context?: Record<string, unknown>;
  exclusions?: Array<{ name?: string; description?: string }>;
  collisionRetry?: boolean;
};

function safeError(status: number, detail = "") {
  const text = detail.toLowerCase();
  if (status === 401 || text.includes("invalid_api_key")) return "Invalid API key. Check OPENAI_API_KEY in .env.local.";
  if (status === 429) return "OpenAI quota or billing is not currently available.";
  if (status === 404 || text.includes("model")) return "The configured OpenAI model is not available.";
  return "The creative suggestion service could not complete the request.";
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
  if (!body.action || !actions.includes(body.action) || typeof body.idea !== "string" || body.idea.length > 4000) {
    return Response.json({ error: "A valid creative action and concise editable idea are required." }, { status: 400 });
  }
  const titleOnly = body.action === "generateVideoTitle";
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: titleOnly
      ? { title: { type: "string", maxLength: 100 } }
      : { name: { type: "string", maxLength: 100 }, description: { type: "string", maxLength: 4000 } },
    required: titleOnly ? ["title"] : ["name", "description"],
  };
  const instructions = `You create original, family-friendly production assets for Slapstick Prompt Pack.
Preserve useful customer ideas while expanding them into concise, continuity-safe production language.
Action: ${body.action}.
${body.action.includes("Location") ? "Cover visual identity, environmental features, palette, lighting, background elements, surfaces, landmarks, atmosphere, continuity locks, and elements that must not change." : ""}
${body.action.includes("Object") ? "Cover object type, shape, colors, materials, scale, moving parts, physical behavior, interaction, slapstick potential, continuity, negative rules, starting state, and ending state. Be semantically distinct from exclusions." : ""}
${body.action.includes("Action") ? "Use the supplied cast, roles, location, object, duration, motion level, and tones. Define setup, owner, trigger, direction, cause, consequence, reactions, safety, and resolved state without overloading the duration." : ""}
${body.action.includes("Payoff") ? "Follow the action and roles exactly. Define final positions, expressions, object position, hero result, enemy/companion result, final beat, and loop behavior. Add no new character, object, or location." : ""}
${titleOnly ? "Return one memorable original title. Avoid exclusions, generic wording, hashtags, quotation marks, trademarks, and franchise names." : ""}
${body.collisionRetry ? "A prior suggestion collided with the saved library. Make this replacement substantially different in concept, silhouette, material, behavior, and wording." : ""}
Return only strict JSON.`;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        instructions,
        input: JSON.stringify({ idea: body.idea.trim(), context: body.context || {}, exclusions: body.exclusions || [] }),
        text: { format: { type: "json_schema", name: titleOnly ? "creative_title" : "creative_asset", strict: true, schema } },
        max_output_tokens: titleOnly ? 300 : 1600,
      }),
    });
    const data = await response.json() as {
      error?: { message?: string };
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    if (!response.ok) {
      console.error("[Creative Suggest] OpenAI error", { status: response.status, message: data.error?.message || "No message" });
      return Response.json({ error: safeError(response.status, data.error?.message) }, { status: response.status });
    }
    const text = data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
    if (!text) return Response.json({ error: "AI returned an empty creative suggestion." }, { status: 502 });
    return Response.json(JSON.parse(text));
  } catch (error) {
    console.error("[Creative Suggest] Network/API failure", error);
    return Response.json({ error: "Network/API request failed. Try Demo Mode or retry later." }, { status: 502 });
  }
}
