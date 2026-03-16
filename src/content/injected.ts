// Runs in MAIN world — can access window.fetch but NOT chrome.runtime
const originalFetch = window.fetch;

const possibleEndpoints = [
  "/backend-api/f/conversation",
  "/backend-api/conversation",
  "/backend-anon/f/conversation",
  "/backend-anon/conversation",
];

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url;

  console.log("[AI Tracker] fetch intercepted:", url);

  if (
    possibleEndpoints.some((endpoint) => url.includes(endpoint)) &&
    init?.method === "POST"
  ) {
    console.log("[AI Tracker] URL matched endpoint:", url);
    try {
      const body = JSON.parse(init.body as string);
      const messages: {
        author?: { role: string };
        content?: { parts?: string[] };
      }[] = body?.messages ?? [];
      const userMessage = messages.find((m) => m.author?.role === "user");
      const promptText = userMessage?.content?.parts?.join("") ?? "";
      const estimatedTokens = Math.ceil(promptText.length / 4);

      console.log("[AI Tracker] parsed body:", body);
      console.log("[AI Tracker] messages:", messages);
      console.log("[AI Tracker] userMessage:", userMessage);
      console.log("[AI Tracker] promptText:", promptText);

      const payload = {
        type: "AI_TRACKER_QUERY",
        timestamp: new Date().toISOString(),
        promptLength: promptText.length,
        estimatedTokens,
        model: (body?.model as string) ?? "unknown",
        conversationId: (body?.conversation_id as string) ?? null,
        promptPreview: promptText.slice(0, 80),
      };

      console.log("[AI Tracker] posting to isolated world:", payload);
      window.postMessage(payload, "*");
    } catch (err) {
      console.error("[AI Tracker] failed to parse body:", err);
    }
  }

  return originalFetch(input, init);
};
