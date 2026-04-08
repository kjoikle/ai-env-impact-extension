import { supabase } from "../lib/supabase";
import type { QueryLoggedMessage } from "../types";
import { calculateEnvMetrics } from "./envMetrics";

async function getDeviceId(): Promise<string> {
  const result = await chrome.storage.local.get("deviceId");
  if (result.deviceId) return result.deviceId as string;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ deviceId: id });
  return id;
}

chrome.runtime.onMessage.addListener((message: QueryLoggedMessage) => {
  console.log("[AI Tracker] background received message:", message);
  if (message.type === "QUERY_LOGGED") {
    getDeviceId().then(async (deviceId) => {
      const { energy_wh, water_ml, carbon_grams } = calculateEnvMetrics(
        message.payload.estimatedTokens,
      );
      const { error } = await supabase.from("query_logs").insert({
        device_id: deviceId,
        prompt_length: message.payload.promptLength,
        estimated_tokens: message.payload.estimatedTokens,
        model: message.payload.model,
        conversation_id: message.payload.conversationId,
        prompt_preview: message.payload.promptPreview,
        energy_wh,
        water_ml,
        carbon_grams,
      });
      if (error) {
        console.error("[AI Tracker] Supabase insert failed:", error);
      } else {
        console.log("[AI Tracker] Supabase insert success");
      }
    });
  }
});
