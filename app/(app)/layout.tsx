import type { ReactNode } from "react"
import DemoDataBar from "@/components/DemoDataBar"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-lvh flex-col">
      <DemoDataBar />
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
