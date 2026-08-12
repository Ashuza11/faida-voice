import RecordFlow from "@/components/RecordFlow"

const DEFAULT_VENDOR = "jane"

// Two demo personas switchable via ?vendor=jane|claudine, no in-app switcher
// UI (ASSUMPTIONS.md) — narrow enough to demo both without building the
// multi-user accounts CLAUDE.md §9 rules out. Dexie is the only local store,
// so vendor data must be loaded client-side in RecordFlow, not here.
export default async function RecordPage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string }>
}) {
  const { vendor } = await searchParams
  const vendorId = `vendor-${vendor ?? DEFAULT_VENDOR}`

  return <RecordFlow vendorId={vendorId} />
}
