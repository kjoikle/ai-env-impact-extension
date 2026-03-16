import { supabase } from '../lib/supabase'
import type { QueryLoggedMessage } from '../types'

// TODO: replace with per-model lookup table (GPT-4o vs GPT-4 vs GPT-3.5 differ significantly)
const ENERGY_PER_TOKEN_KWH = 0.0000003 // ~0.3 mWh per 1000 tokens — placeholder


async function getDeviceId(): Promise<string> {
  const result = await chrome.storage.local.get('deviceId')
  if (result.deviceId) return result.deviceId as string
  const id = crypto.randomUUID()
  await chrome.storage.local.set({ deviceId: id })
  return id
}

chrome.runtime.onMessage.addListener((message: QueryLoggedMessage) => {
  console.log('[AI Tracker] background received message:', message)
  if (message.type === 'QUERY_LOGGED') {
    getDeviceId().then(async (deviceId) => {
      const { error } = await supabase.from('query_logs').insert({
        device_id: deviceId,
        prompt_length: message.payload.promptLength,
        estimated_tokens: message.payload.estimatedTokens,
        model: message.payload.model,
        conversation_id: message.payload.conversationId,
      })
      if (error) {
        console.error('[AI Tracker] Supabase insert failed:', error)
      } else {
        console.log('[AI Tracker] Supabase insert success')
      }
    })
  }
})
