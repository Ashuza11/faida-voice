import { describe, expect, it, vi } from "vitest"
import { extractEntities } from "@/lib/nlu/extract-llm"
import { rwf } from "@/lib/money"

const products = [
  { nameRw: "amandazi", unitPrice: rwf(100) },
  { nameRw: "umugati", unitPrice: rwf(300) },
]
const customers = [{ name: "Eric" }, { name: "Divine" }]

function fakeClient(parsed_output: unknown) {
  return { messages: { parse: vi.fn().mockResolvedValue({ parsed_output }) } }
}

describe("extractEntities", () => {
  it("returns the product and customer the model resolved from the real catalog", async () => {
    const client = fakeClient({ productName: "umugati", customerName: "Eric" })

    const result = await extractEntities("umugaati kuri Eriki", products, customers, client)

    expect(result).toEqual({ productName: "umugati", customerName: "Eric" })
  })

  it("rejects a resolved name that isn't in the real catalog, even if the model returned one", async () => {
    const client = fakeClient({ productName: "made-up product", customerName: "Eric" })

    const result = await extractEntities("some transcript", products, customers, client)

    expect(result).toEqual({ productName: null, customerName: "Eric" })
  })

  it("returns nulls when the model finds no plausible match", async () => {
    const client = fakeClient({ productName: null, customerName: null })

    const result = await extractEntities("completely unrelated transcript", products, customers, client)

    expect(result).toEqual({ productName: null, customerName: null })
  })

  it("degrades to nulls, never throws, when the API call fails", async () => {
    const client = { messages: { parse: vi.fn().mockRejectedValue(new Error("network error")) } }

    const result = await extractEntities("umugati", products, customers, client)

    expect(result).toEqual({ productName: null, customerName: null })
  })

  it("degrades to nulls when the model returns no parsed output at all", async () => {
    const client = fakeClient(null)

    const result = await extractEntities("umugati", products, customers, client)

    expect(result).toEqual({ productName: null, customerName: null })
  })

  it("short-circuits without calling the API when there is no catalog to match against", async () => {
    const client = fakeClient({ productName: null, customerName: null })

    const result = await extractEntities("umugati", [], [], client)

    expect(result).toEqual({ productName: null, customerName: null })
    expect(client.messages.parse).not.toHaveBeenCalled()
  })

  it("sends the vendor's real product and customer names as the output schema's constraint", async () => {
    const client = fakeClient({ productName: "umugati", customerName: "Eric" })

    await extractEntities("umugati kuri Eric", products, customers, client)

    const call = client.messages.parse.mock.calls[0][0]
    expect(call.model).toBe("claude-sonnet-5")
    // The Anthropic SDK's zodOutputFormat helper currently encodes zod
    // enums as a description hint (not a JSON-Schema `enum` keyword) since
    // the structured-output API doesn't support `enum` server-side yet —
    // verified by inspecting the actual output of zodOutputFormat(). The
    // real enforcement is client-side: .parse() re-validates the response
    // against the original Zod schema and throws on anything not in it,
    // which extractEntities catches and turns into null. See ASSUMPTIONS.md.
    const schemaText = JSON.stringify(call.output_config.format.schema)
    expect(schemaText).toContain("amandazi")
    expect(schemaText).toContain("umugati")
    expect(schemaText).toContain("Eric")
    expect(schemaText).toContain("Divine")
  })

  it("actually rejects an out-of-catalog value at the schema-parse boundary, not just via the post-check", async () => {
    const client = fakeClient({ productName: "umugati", customerName: "Eric" })
    await extractEntities("umugati kuri Eric", products, customers, client)
    const format = client.messages.parse.mock.calls[0][0].output_config.format

    expect(() => format.parse(JSON.stringify({ productName: "made-up product", customerName: "Eric" }))).toThrow()
    expect(format.parse(JSON.stringify({ productName: "umugati", customerName: "Eric" }))).toEqual({
      productName: "umugati",
      customerName: "Eric",
    })
  })
})
