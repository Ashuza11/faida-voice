import Link from "next/link"

// TODO: Kinyarwanda copy needed for all of this — CLAUDE.md §10, see the
// translation list handed off alongside this page.
export default function Home() {
  return (
    <div className="flex min-h-lvh flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-bold text-heading">Faida</h1>
        <p className="max-w-sm text-lg text-body">
          Record sales and debts by speaking Kinyarwanda. Works without the internet.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <Link
          href="/record"
          className="flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 py-4 text-xl font-semibold text-dark"
        >
          Start recording
        </Link>
        <Link href="/report" className="flex min-h-12 items-center justify-center text-body underline">
          View report
        </Link>
      </div>
    </div>
  )
}
