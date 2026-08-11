import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

type Db = ReturnType<typeof drizzle<typeof schema>>

let instance: Db | undefined

function getDb(): Db {
  if (!instance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set")
    }
    instance = drizzle(neon(process.env.DATABASE_URL), { schema })
  }
  return instance
}

// Lazy: importing this module must not throw when DATABASE_URL is unset
// (e.g. tests gated by `describe.skipIf`) — only using `db` should.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
