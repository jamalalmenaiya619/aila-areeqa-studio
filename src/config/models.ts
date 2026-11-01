// The one place the AI model is named. Change it here only.
// "The current Claude Sonnet model" (prompts/PHASE-1.md), used for answer coaching.
export const COACH_MODEL = "claude-sonnet-5-5";
export const COACH_MAX_TOKENS = 4000; // the reply itself is asked to stay under 140 words; room for thinking
export const COACH_EFFORT = "medium" as const;
export const COACH_LIMIT_PER_HOUR = 30;
