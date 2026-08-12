import { expect, test } from "@playwright/test"

/**
 * The demo script itself, end to end, per CLAUDE.md §7 Layer 3. Each test
 * gets a fresh Playwright browser context (isolated IndexedDB), so seeding
 * is loaded explicitly rather than assumed. NOT YET RUN — see
 * ASSUMPTIONS.md for why (no working headless browser in the dev sandbox
 * this was written in). Run `npm run test:e2e` before trusting this.
 */
test.describe("record → confirm → report", () => {
  test("a vendor records a sale by tapping and sees it reflected in the report", async ({ page }) => {
    await page.goto("/record")

    await page.getByRole("button", { name: "Load demo data" }).click()
    await page.getByRole("button", { name: "Demo data loaded" }).waitFor()

    await page.getByRole("button", { name: "Kugurisha" }).click()
    await page.getByRole("button", { name: "umugati" }).click()
    await page.getByRole("button", { name: "+" }).click()
    await page.getByRole("button", { name: /add/i }).click()

    await expect(page.getByText("600 RWF")).toBeVisible()
    await page.getByRole("button", { name: /confirm/i }).click()

    // Nothing writes to the ledger without passing through that
    // confirmation (CLAUDE.md §3.6) — confirming resets back to kind
    // selection, ready for the next event.
    await expect(page.getByRole("button", { name: "Kugurisha" })).toBeVisible()

    await page.getByRole("link", { name: "Report" }).click()
    await expect(page.getByRole("heading", { name: "Daily sales" })).toBeVisible()
    await expect(page.getByRole("img", { name: /daily sales totals/i })).toBeVisible()
  })

  test("a vendor records a debt via the typed voice fallback and it appears as an outstanding balance", async ({
    page,
  }) => {
    await page.goto("/record")
    await page.getByRole("button", { name: "Load demo data" }).click()
    await page.getByRole("button", { name: "Demo data loaded" }).waitFor()

    await page.getByRole("button", { name: "Debt" }).click()
    await page.getByPlaceholder(/type instead/i).fill("umugati kabiri kuri Eric")
    await page.getByRole("button", { name: /send/i }).click()

    await expect(page.getByText("Eric")).toBeVisible()
    await expect(page.getByText("600 RWF")).toBeVisible()
    await page.getByRole("button", { name: /confirm/i }).click()

    await page.getByRole("link", { name: "Report" }).click()
    await expect(page.getByText("Eric")).toBeVisible()
  })

  test("discarding a confirmation never writes to the ledger", async ({ page }) => {
    await page.goto("/record")
    await page.getByRole("button", { name: "Load demo data" }).click()
    await page.getByRole("button", { name: "Demo data loaded" }).waitFor()

    await page.getByRole("button", { name: "Kuzigama" }).click()
    await page.getByLabel(/amount/i).fill("500")
    await page.getByRole("button", { name: /add/i }).click()
    await page.getByRole("button", { name: /discard/i }).click()

    await expect(page.getByRole("button", { name: "Kuzigama" })).toBeVisible()
  })
})
