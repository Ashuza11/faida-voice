import ReportView from "@/components/ReportView"

const DEFAULT_VENDOR = "jane"

// Same ?vendor=jane|claudine switching as /record — see that page's comment.
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string }>
}) {
  const { vendor } = await searchParams
  const vendorId = `vendor-${vendor ?? DEFAULT_VENDOR}`

  return <ReportView vendorId={vendorId} />
}
