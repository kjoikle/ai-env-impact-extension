export interface QueryLog {
  id: string
  created_at: string
  device_id: string
  prompt_length: number
  estimated_tokens: number
  model: string
  conversation_id: string | null
  prompt_preview: string | null
  energy_wh: number | null
  water_ml: number | null
  carbon_grams: number | null
}

export interface QueryLoggedMessage {
  type: 'QUERY_LOGGED'
  payload: {
    timestamp: string
    promptLength: number
    estimatedTokens: number
    model: string
    conversationId: string | null
    promptPreview: string
  }
}
