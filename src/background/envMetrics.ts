// Prompt size thresholds (based on input tokens only)
// SMALL:  < 500 input tokens  (~100 token prompts  → 300 output)
// MEDIUM: < 5000 input tokens (~1k token prompts   → 1k output)
// LARGE:  ≥ 5000 input tokens (~10k token prompts  → 1.5k output)
const SMALL_MAX_TOKENS = 500;
const MEDIUM_MAX_TOKENS = 5000;

// --- PLACEHOLDER VALUES — replace with measured data ---

// Small prompt (100 in → 300 out) — GPT-5 medium estimates
const SMALL_ENERGY_WH = 12.63;
const SMALL_WATER_ML = 58.31;
const SMALL_CARBON_GRAMS = 4.29;

// Medium prompt (1k in → 1k out) — GPT-5 medium estimates
const MEDIUM_ENERGY_WH = 14.23;
const MEDIUM_WATER_ML = 65.7;
const MEDIUM_CARBON_GRAMS = 4.84;

// Large prompt (10k in → 1.5k out) — GPT-5 medium estimates
const LARGE_ENERGY_WH = 16.02;
const LARGE_WATER_ML = 73.97;
const LARGE_CARBON_GRAMS = 5.45;

export interface EnvMetrics {
  energy_wh: number;
  water_ml: number;
  carbon_grams: number;
}

export function calculateEnvMetrics(inputTokens: number): EnvMetrics {
  if (inputTokens < SMALL_MAX_TOKENS) {
    return {
      energy_wh: SMALL_ENERGY_WH,
      water_ml: SMALL_WATER_ML,
      carbon_grams: SMALL_CARBON_GRAMS,
    };
  } else if (inputTokens < MEDIUM_MAX_TOKENS) {
    return {
      energy_wh: MEDIUM_ENERGY_WH,
      water_ml: MEDIUM_WATER_ML,
      carbon_grams: MEDIUM_CARBON_GRAMS,
    };
  } else {
    return {
      energy_wh: LARGE_ENERGY_WH,
      water_ml: LARGE_WATER_ML,
      carbon_grams: LARGE_CARBON_GRAMS,
    };
  }
}
