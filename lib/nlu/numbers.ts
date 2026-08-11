/**
 * Parses a Kinyarwanda numeral phrase into its integer value.
 *
 * Scope: this is an exact-phrase lookup, not a generative grammar. It only
 * covers words/phrases that are independently source-verified (cross-checked
 * against the Rwandan franc banknote denominations on Wikipedia, which match
 * the exact examples in CLAUDE.md §5: "ijana" -> 100, "magana atanu" -> 500,
 * "ibihumbi bibiri" -> 2000). See ASSUMPTIONS.md for the full source list.
 *
 * Deliberately NOT implemented: noun-class agreement prefixes for 1-7 (the
 * numeral changes form depending on what it modifies), tens 40-90, and
 * compound joining ("na"/"n'") beyond the phrases below. Those patterns were
 * only inferred, not confirmed by a native speaker, so per CLAUDE.md §10
 * they are not encoded here. Unmatched input returns null, which is the
 * correct behaviour per §5: it routes the user to the tap interface instead
 * of guessing.
 */
const VERIFIED_NUMBER_WORDS: Record<string, number> = {
  zeru: 0,
  rimwe: 1,
  kabiri: 2,
  gatatu: 3,
  kane: 4,
  gatanu: 5,
  gatandatu: 6,
  karindwi: 7,
  umunani: 8,
  icyenda: 9,
  icumi: 10,
  ijana: 100,
  igihumbi: 1000,
  "magana atanu": 500,
  "ibihumbi bibiri": 2000,
  "ibihumbi bitanu": 5000,
}

export function parseKinyarwandaNumber(input: string): number | null {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, " ")
  return normalized in VERIFIED_NUMBER_WORDS ? VERIFIED_NUMBER_WORDS[normalized] : null
}
