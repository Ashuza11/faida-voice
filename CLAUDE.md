# CLAUDE.md — Faida

Read this file fully before your first action in any session. It overrides your defaults.

---

## 0. First session in this repo: orient before you build

A scaffolding already exists. **Do not re-scaffold, do not `create-next-app`, do not restructure directories.**

Your first task, before writing any feature code:

1. Read `package.json`, `drizzle.config.*`, `next.config.*`, `tsconfig.json`, and the `app/` and `lib/` trees.
2. Produce a short written map: what exists, what's a stub, what's dead.
3. Compare it against the invariants in §3–§6 below and **list every deviation**.
4. Propose the minimum set of changes to bring the scaffold in line. Wait for my approval before executing.

If the scaffold contradicts this file, this file wins — but you tell me first, you don't silently rewrite.

---

## 1. What we're building

**Faida** lets an informal vendor in Rwanda — a baker, a boutique owner, a market trader — record sales and debts **by speaking Kinyarwanda into a cheap Android phone**, works when the network doesn't, and turns weeks of those records into a financial history a SACCO or MFI can actually read.

This is a **four-week competition prototype**. It is not a product launch. Scope discipline matters more than completeness.

### The one claim the demo must prove

> A vendor who cannot type fast, on a low-end phone, in a noisy shop, records a sale and a debt by speaking Kinyarwanda — and weeks later that habit prints a financial record a lender can read.

Every task you do serves that sentence. When you're unsure whether to build something, ask: does this make that sentence more demonstrable? If not, it waits.

### Personas driving all seed data

- **Jane** — baker in Nyamirambo. Countable products (`umugati`, `amandazi`), high transaction volume, small ticket sizes, extends credit to regulars.
- **Claudine** — small restaurant/bar. Ingredients become meals, so stock tracking is partial and opt-out. Sells bottled drinks that *are* countable.

Seed data is always these two. Never `foo`, `bar`, `Test Product`, or Lorem Ipsum — in fixtures, tests, or seeds. The demo is judged on feeling real.

---

## 2. Fixed decisions — do not relitigate

| Concern | Decision |
| --- | --- |
| Framework | Next.js (App Router), TypeScript strict |
| Database | Neon Postgres |
| ORM/migrations | Drizzle + Drizzle Kit. Drizzle owns the schema; never hand-write DDL outside migrations |
| Client store | IndexedDB via Dexie |
| Shell | Installable PWA. No native, no app store |
| Validation | Zod at every trust boundary |
| Tests | Vitest (unit + integration), Playwright (E2E) |
| Language | Kinyarwanda only. No language picker |
| Styling | Tailwind. No component library, no icon package, no chart library |

If you think one of these is wrong, say so once, in one paragraph, and then follow it anyway unless I change it.

---

## 3. Architecture invariants — never violate

These are the rules that make the project safe and testable. Breaking one is a bug even if tests pass.

1. **NEVER generate, assemble, or execute SQL from user input, transcripts, or LLM output.** The "Kinyarwanda to database" feature is `audio → transcript → validated Intent object → repository method → parameterized query`. There is no text-to-SQL step. Ever.
2. **All database writes go through repository functions in `lib/db/repositories/`.** No Drizzle calls in route handlers, server actions, or components.
3. **The `events` table is append-only.** No `UPDATE`, no `DELETE` on it. Corrections are new compensating events. All balances, totals, and credit signals are *derived* from the event log.
4. **Money is an integer count of RWF.** Never a float, never a `number` that could hold decimals. Type it as `Money = number & { __brand: 'RWF' }` and centralise arithmetic in `lib/money.ts`.
5. **Every event carries a client-generated UUID (`client_event_id`) and a client timestamp.** The sync endpoint is idempotent on that UUID — posting the same event twice creates one row. Test this explicitly.
6. **Nothing is written to the ledger without explicit user confirmation.** Voice produces a confirmation card, never a silent write.
7. **The UI never blocks on the network.** Writes go to IndexedDB first and render optimistically. Sync status is a passive badge.
8. **No `localStorage` or `sessionStorage`.** Dexie only.
9. **No secrets in client code.** ASR API keys live server-side; the client uploads audio to our own route handler.

---

## 4. Domain model

```
vendors      (id, name, business_type, created_at)
products     (id, vendor_id, name_rw, unit_price, tracks_stock, stock_qty)
customers    (id, vendor_id, name, phone?)
events       (id uuid PK, vendor_id, kind, payload jsonb,
              occurred_at, recorded_at, source, client_event_id unique, synced_at)
```

`kind` is a closed enum: `SALE | DEBT | PAYMENT | STOCK_IN | SAVING | CORRECTION`.

Derived views (SQL or materialized): daily totals, per-customer outstanding balance, savings running total, credit signals.

**Credit signals score consistency, not revenue** — days recorded vs. days elapsed, recording streak, share of extended credit recovered within 7/30 days, savings regularity. Vendors under-report revenue for rational reasons; consistency survives that and is what a lender can verify. Never build a score that rewards a bigger number.

---

## 5. The intent layer

The single most important module. Lives in `lib/nlu/`.

```ts
type Intent =
  | { kind: 'SALE';     items: LineItem[]; total?: Money; confidence: number }
  | { kind: 'DEBT';     customer: string; items: LineItem[]; amount: Money; dueDate?: Date }
  | { kind: 'PAYMENT';  customer: string; amount: Money }
  | { kind: 'STOCK_IN'; item: string; qty: number; unitCost?: Money }
  | { kind: 'SAVING';   amount: Money }
  | { kind: 'UNKNOWN';  raw: string };
```

Rules:

- Every intent is Zod-validated. **Validation failure produces `UNKNOWN`, which routes the user to the tap interface.** Never guess, never partially write.
- **Kinyarwanda numerals are parsed deterministically in code**, not by an LLM: `parseKinyarwandaNumber(s: string): number | null` in `lib/nlu/numbers.ts`. Pure, offline, exhaustively unit-tested. `ibihumbi bibiri` → 2000, `magana atanu` → 500, `ijana` → 100. Money is the thing we cannot get wrong.
- Product-name matching is fuzzy against **that vendor's own product list only**, with a confidence threshold. Below threshold → `UNKNOWN`.
- ASR is unreliable (expect ~20% word error rate in market noise). The confirmation card is not a nicety; it is what makes an unreliable model usable. Design every voice path assuming the transcript is partly wrong.
- When we call a hosted ASR, pass the vendor's product names and customer names as **keyterms** to bias recognition.

---

## 6. Offline and sync

- Tap grid is the **primary** input path and works fully offline. Voice is an accelerator.
- Offline voice: record the audio blob to IndexedDB, show "1 note waiting", transcribe on reconnect, surface a **confirmation queue** the vendor clears in a few taps.
- Sync is a queue of unsent events with retry and backoff. Never lose an event; never double-write one.
- The phone is the source of truth for *"did this sale happen"*. The server is the source of truth for reports and the credit profile.

---

## 7. TDD workflow — mandatory for domain logic

**The golden corpus is the heart of the project:** `fixtures/utterances.rw.json`. Each entry is a real Kinyarwanda phrase, an English gloss, and the expected `Intent`. It is simultaneously our spec, our regression suite, our accuracy metric, and our competition evidence.

The loop, in this order, no exceptions:

1. Add the failing fixture or test.
2. Run it. **Watch it fail.** Never claim a test passes without running it.
3. Write the minimum code to pass.
4. Run the full suite.
5. Refactor only with green tests.

**Test what deserves testing:**

- **Layer 1 (most tests)** — pure functions, zero I/O, milliseconds: number parser, intent parser, money math, credit signal calculations.
- **Layer 2** — integration against a Neon branch: migrations apply, sync endpoint idempotency, credit aggregation over a seeded 30-day history. Use the **unpooled** connection string for seeding; the pooled URL breaks prepared statements mid-seed.
- **Layer 3 (few, load-bearing)** — Playwright: (a) offline → online sync flow, (b) the full demo script end to end. If the demo script is a passing test, we cannot break the demo the night before.

**Do not TDD:** visual design, layout, or exploratory spikes against a third-party API. Spike the ASR integration messily first, learn the actual response shape, *then* write tests around what you found.

Report intent accuracy as a number after every change to `lib/nlu/`: `"142/150 fixtures passing (94.7%)"`.

---

## 8. UI rules

- **Thumb-zone first.** Primary actions in the bottom two-thirds; she's holding bread in her other hand.
- Minimum 48px tap targets. High contrast for outdoor sunlight.
- **Numbers are the design.** Large tabular figures. Type and spacing do the aesthetic work.
- The mic is one large press-and-hold circle with a live waveform. This is the screenshot in our submission — make it beautiful.
- Optimistic UI everywhere. No blocking spinners on user actions.
- **Performance budget: under 200KB of JS on first load.** Server components by default. Charts are hand-rolled SVG. Verify on a throttled Slow 3G profile, not on a laptop.

---

## 9. Do not build

No multi-user or staff accounts. No supplier/purchase orders. No SMS or USSD. No mobile money integration — **savings is a ledger only, no money moves.** No loan application flow. No language switcher. No admin panel. No dark mode. No email. No push notifications.

If I ask for one of these, remind me it's on this list and ask me to confirm before building it.

---

## 10. Working agreement

- **Plan before large changes.** Anything touching more than three files: write the plan, wait for approval.
- **Small commits, conventional messages**, one logical change each.
- **Never commit secrets.** Never run destructive DB commands against a non-branch database without asking.
- **Never fabricate.** If you don't know whether an API supports something, say so and check the docs. Don't invent a Kinyarwanda phrase for a fixture — flag it as needing a native speaker's review.
- **When you disagree with an instruction, say so plainly and briefly**, then follow it unless I change my mind. I'd rather hear "this will break the offline path" now than debug it later.
- **Assumptions go in `ASSUMPTIONS.md`.** We're building ahead of our field research; every guess about vendor behaviour gets written down so it can be corrected cheaply when the interview answers arrive.
- **Report status honestly.** "Tests pass but the offline path is untested" is a useful sentence. "Done!" when it's partly done is not.

---

## 11. Cut order under time pressure

Drop in this order, no debate: savings module → stock tracking → shareable PDF → onboarding polish.

**Never cut:** voice → confirmation → offline sync. That is the entire submission.
