// ─── Cost-sensitive parameters ────────────────────────────────────────────
// Change models or limits here — one place, affects everything.

export const CHAT_MODEL       = 'claude-sonnet-4-20250514'
export const SCAN_MODEL       = 'claude-opus-4-20250514'
export const CARD_MODEL       = 'claude-opus-4-20250514'
export const EXTRACTION_MODEL = 'claude-haiku-4-5-20251001'

export const FREE_CHAT_LIMIT = 5
export const PRO_CHAT_LIMIT  = 30
export const FREE_SCAN_LIMIT = 1
export const PRO_SCAN_LIMIT  = 5

// TEMP: raised for testing — reset to 20 before deploy
export const DAILY_CAP = 50
