# Assumptions

Guesses about vendor behaviour or product scope made ahead of field research, so they can be corrected cheaply when real answers arrive.

## Scaffold cleanup (2026-08-12)

- **No login/signup flow.** The inherited scaffold had Firebase email/password auth and a public/dashboard route split for a logged-in vs. logged-out user. Faida's domain model (§4) has no `users`/`auth` table, and §9 rules out multi-user accounts — so this was removed rather than adapted. Assuming the app is single-vendor and device-bound with no auth screen at all. If a PIN/passcode lock turns out to be needed for a shared phone, that's new scope, not a revival of the deleted forms.
- **Root layout metadata description is English, not Kinyarwanda.** Per §10, invented Kinyarwanda copy needs native-speaker review before shipping; left as English placeholder rather than fabricate a phrase. Flagged inline in `app/layout.tsx`.
- **`lib/nlu/numbers.ts` is a stub that throws.** No Kinyarwanda numeral fixtures exist yet and none should be invented without native-speaker review (§10). Real implementation starts from `fixtures/utterances.rw.json` via TDD once fixtures are reviewed.
- **`formatMoney` uses `en-US` locale grouping** (comma thousands separator) for `toLocaleString`, purely for digit grouping — no locale-specific wording is involved, so this doesn't trigger the "don't fabricate Kinyarwanda" concern. Worth confirming with a native speaker whether RWF amounts are conventionally grouped the same way in-app copy.
