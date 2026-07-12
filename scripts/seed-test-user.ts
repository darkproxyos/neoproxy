import { db } from '../lib/core-db/index'
import { users } from '../src/db/schema'
import { createHash, randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'

async function seed() {
  const username = 'test'
  const password = 'test123'
  const passwordHash = createHash('sha256').update(password).digest('hex')

  const existing = await db.select().from(users).where(eq(users.username, username)).get()

  if (existing) {
    await db.update(users).set({ passwordHash }).where(eq(users.username, username))
    console.log(`✅ usuario '${username}' actualizado, password: ${password}`)
  } else {
    await db.insert(users).values({
      id: randomUUID(),
      username,
      passwordHash,
      role: 'tester',
      createdAt: Date.now(),
    })
    console.log(`✅ usuario '${username}' creado, password: ${password}`)
  }
}
seed()
