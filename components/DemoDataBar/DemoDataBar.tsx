"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { seedDemoData } from "@/lib/db/seed"

type Status = "idle" | "loading" | "done"

/**
 * Seeding is a deliberate, explicit action per the demo-slice plan — never
 * automatic on empty state, so it can't race a live demo narration or
 * silently overwrite in-progress recorded data. seedDemoData() itself is a
 * no-op once any vendor exists, so this is safe to click more than once.
 */
export default function DemoDataBar() {
  const [status, setStatus] = useState<Status>("idle")
  const pathname = usePathname()

  async function handleClick() {
    setStatus("loading")
    await seedDemoData()
    setStatus("done")
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-lighter px-4 py-2">
      <nav className="flex items-center gap-4">
        <span className="text-sm font-semibold text-heading">Faida</span>
        <Link href="/record" className={pathname === "/record" ? "text-heading" : "text-body"}>
          Record
        </Link>
        <Link href="/report" className={pathname === "/report" ? "text-heading" : "text-body"}>
          Report
        </Link>
      </nav>
      <button
        type="button"
        onClick={handleClick}
        disabled={status !== "idle"}
        className="min-h-12 rounded-lg bg-lighter px-3 py-2 text-sm text-heading disabled:opacity-60"
      >
        {status === "done" ? "Demo data loaded" : "Load demo data"}
      </button>
    </div>
  )
}
