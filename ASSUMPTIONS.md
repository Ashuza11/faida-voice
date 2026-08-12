# Assumptions

Guesses about vendor behaviour or product scope made ahead of field research, so they can be corrected cheaply when real answers arrive.

## Scaffold cleanup (2026-08-12)

- **No login/signup flow.** The inherited scaffold had Firebase email/password auth and a public/dashboard route split for a logged-in vs. logged-out user. Faida's domain model (§4) has no `users`/`auth` table, and §9 rules out multi-user accounts — so this was removed rather than adapted. Assuming the app is single-vendor and device-bound with no auth screen at all. If a PIN/passcode lock turns out to be needed for a shared phone, that's new scope, not a revival of the deleted forms.
- **Root layout metadata description is English, not Kinyarwanda.** Per §10, invented Kinyarwanda copy needs native-speaker review before shipping; left as English placeholder rather than fabricate a phrase. Flagged inline in `app/layout.tsx`.
- **`formatMoney` uses `en-US` locale grouping** (comma thousands separator) for `toLocaleString`, purely for digit grouping — no locale-specific wording is involved, so this doesn't trigger the "don't fabricate Kinyarwanda" concern. Worth confirming with a native speaker whether RWF amounts are conventionally grouped the same way in-app copy.

## `lib/nlu/numbers.ts` — minimal verified word list (2026-08-12)

A research agent searched for Kinyarwanda numeral and money vocabulary before implementation. Rather than encode the full grammar it found (which included unverified/inferred rules), `parseKinyarwandaNumber` only covers the subset that is independently source-verified — everything else correctly falls through to `null` (→ `UNKNOWN`, per §5).

**Shipped (high confidence — cross-checked against real Rwandan franc banknote naming on Wikipedia, and matches CLAUDE.md §5's own worked examples):**
- Digits 0–10: `zeru, rimwe, kabiri, gatatu, kane, gatanu, gatandatu, karindwi, umunani, icyenda, icumi` — cross-confirmed by [ELIAS/Harvard](https://elias.fas.harvard.edu/unit-grammar/cardinal-and-ordinal-numbers), [Omniglot](https://www.omniglot.com/language/numbers/kinyarwanda.htm), [languagesandnumbers.com](https://www.languagesandnumbers.com/how-to-count-in-kinyarwanda/en/kin/).
- `ijana` = 100, `igihumbi` = 1000, `magana atanu` = 500, `ibihumbi bibiri` = 2000, `ibihumbi bitanu` = 5000 — all verified against real denomination names in [Wikipedia's Rwandan franc article](https://en.wikipedia.org/wiki/Rwandan_franc).
- Spelling note: one source spelled 8 as "umunani", another as "umunane" — went with "umunani" (majority of sources); flag if a native speaker says otherwise.

**Explicitly NOT shipped — needs native-speaker input before it can be built:**
- **Noun-class agreement.** Kinyarwanda numerals 1–7 change form depending on the noun class of what they modify (e.g. "two" appears as babiri/ibiri/ebyiri/bibiri in different contexts). The pattern behind `magana atanu`/`ibihumbi bibiri` (numeral root loses its "ga-" prefix and takes an "a-" or "bi-" prefix depending on scale) is only inferred from three currency examples, not confirmed by a grammar source. Building this out as a generative rule without confirmation risks silently mis-parsing amounts — unacceptable for money.
- **Tens 40–90** (e.g. "mirongo ine" for 40) — only single-sourced, not cross-verified.
- **Compound numbers** (1500, 12000, etc.) and how they're joined ("na"/"n'") — constructed from a pattern, not found written verbatim anywhere.
- **Informal spoken shortcuts.** No source describes how vendors actually abbreviate prices when speaking casually (dropping "amafaranga", saying bare digits, rounding, code-switching). This is the highest-risk gap for a money-critical parser, since it's exactly the input distribution real speech will produce, and it can only be closed with real vendor recordings/transcripts or native-speaker input — not further web research.

**Next step to unblock:** get a native Kinyarwanda speaker (or real transcribed vendor phrases) to (a) confirm/correct the noun-class prefix rules and tens 40–90, and (b) supply real example sale/debt/payment sentences for `fixtures/utterances.rw.json`, which is still empty for exactly this reason.

## `lib/db/repositories/events.ts` idempotency test is skipped, not verified (2026-08-12)

`tests/lib/db/repositories/events.test.ts` exercises the §3.5 requirement that posting the same `client_event_id` twice creates one row, not two. It's gated with `describe.skipIf(!process.env.DATABASE_URL)` and currently shows as **skipped** in every run — no `DATABASE_URL` is configured yet (see `.env.local.example`), so this behavior has not actually been run against a real Neon branch. Treat idempotency as implemented-but-unverified until a Neon connection string is added and this test is seen passing, not skipped. `lib/db/client.ts` was made lazy (a `Proxy` that only resolves `DATABASE_URL` on first use) specifically so importing it doesn't crash the whole test file before `skipIf` can act.

## Offline queue and sync endpoint (2026-08-12)

Built the client-side write path and its server counterpart, both independent of the Kinyarwanda gaps above:

- **`lib/db/local.ts`** — Dexie table for queuing events locally before sync (§3.7/§3.8). Tested with the `fake-indexeddb` devDependency, since jsdom has no real IndexedDB. `eventKinds`/`EventKind` were pulled out of `lib/db/schema.ts` into a dependency-free `lib/events.ts` so this client-side module doesn't pull `drizzle-orm/pg-core` into the browser bundle (§8's 200KB budget).
- **`app/api/sync/route.ts`** — POST endpoint, Zod-validates the body (`lib/sync/schema.ts`) then calls `insertEvent` — no Drizzle calls in the route itself (§3.2). Validation failure is a real 400, not a fallback to UNKNOWN — that fallback is specifically for ambiguous NLU output (`lib/nlu/intent.ts`), not malformed HTTP requests.
- The route's persistence/idempotency test is `skipIf`-gated the same way as the repository test above — same reason, same unblock (a real `DATABASE_URL`).
- **Not yet built:** anything that actually calls this endpoint from the client (a sync loop with retry/backoff per §6), and the confirmation-queue UI. Queuing and syncing exist as isolated, tested units, not yet wired together end to end.
