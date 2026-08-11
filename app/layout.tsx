import type { Metadata } from "next"
import "@/app/globals.css"

export const metadata: Metadata = {
  title: "Faida",
  // TODO: Kinyarwanda copy needs native-speaker review before shipping (CLAUDE.md §10)
  description: "Record sales and debts by speaking Kinyarwanda.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="rw">
      <body>
        {children}
      </body>
    </html>
  )
}