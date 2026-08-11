/**
 * Parses a Kinyarwanda numeral phrase into its integer value.
 *
 * NOT YET IMPLEMENTED. Per CLAUDE.md §5/§10: this must be built TDD against
 * fixtures/utterances.rw.json, and every Kinyarwanda phrase used as a test
 * fixture needs native-speaker review before being trusted — none exist yet.
 *
 * Expected once built: pure, deterministic, no I/O.
 *   parseKinyarwandaNumber("ibihumbi bibiri") -> 2000
 *   parseKinyarwandaNumber("magana atanu")    -> 500
 *   parseKinyarwandaNumber("ijana")           -> 100
 */
export function parseKinyarwandaNumber(_input: string): number | null {
  throw new Error("parseKinyarwandaNumber is not implemented yet")
}
