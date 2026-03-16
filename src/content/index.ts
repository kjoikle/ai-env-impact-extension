import type { QueryLoggedMessage } from "../types";

// Runs in isolated world — can access chrome.runtime but NOT the page's window.fetch
// Receives data from the MAIN world injected script via postMessage
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.type !== "AI_TRACKER_QUERY") return;

  console.log("[AI Tracker] isolated world received message:", event.data);

  const { type: _type, ...rest } = event.data;
  const message: QueryLoggedMessage = {
    type: "QUERY_LOGGED",
    payload: rest,
  };

  console.log("[AI Tracker] sending message to background:", message);
  chrome.runtime.sendMessage(message);
});
