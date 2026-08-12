import { NextResponse } from "next/server"
import { insertEvent } from "@/lib/db/repositories/events"
import { syncEventSchema } from "@/lib/sync/schema"

// CLAUDE.md §3.2: this route only calls a repository function — no Drizzle here.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }

  const result = syncEventSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const event = await insertEvent(result.data)
  return NextResponse.json(event, { status: 200 })
}
