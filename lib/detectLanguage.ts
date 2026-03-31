/**
 * Detects the primary script language of a text string.
 * Uses Unicode block ranges for Telugu and Devanagari (Hindi).
 */
export function detectScriptLanguage(text: string): 'en' | 'hi' | 'te' {
  // Telugu Unicode block: U+0C00–U+0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'
  // Devanagari (Hindi) Unicode block: U+0900–U+097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi'
  return 'en'
}

/**
 * Maps app-level language strings (e.g. "TELUGU") to ISO codes.
 */
export function appLangToCode(language: string): 'en' | 'hi' | 'te' {
  const map: Record<string, 'en' | 'hi' | 'te'> = {
    ENGLISH: 'en',
    HINDI:   'hi',
    TELUGU:  'te',
    en: 'en',
    hi: 'hi',
    te: 'te',
  }
  return map[language.toUpperCase()] ?? 'en'
}
