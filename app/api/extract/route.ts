import { NextResponse } from "next/server"
import { extractEntities } from "@/lib/nlu/extract-llm"
import { extractRequestSchema } from "@/lib/nlu/extract-request-schema"

// CLAUDE.md §5/§9: this route only resolves WHICH known product/customer a
// transcript refers to — it never decides event kind and never computes
// money. The caller (tap-selected kind + deterministic number parsing)
// still owns everything else.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }

  const result = extractRequestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { transcript, products, customers } = result.data
  const entities = await extractEntities(transcript, products, customers)
  return NextResponse.json(entities, { status: 200 })
}
