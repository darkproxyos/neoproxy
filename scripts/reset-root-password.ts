// Arregla lo que scripts/seed-root.ts no puede: ese script usa
// onConflictDoNothing(), así que si la fila 'darkproxy' ya existe (con
// cualquier contraseña, incluida la de prueba ROOT_PASSWORD_CHANGE_ME)
// volver a correrlo no cambia nada. Este script hace un upsert real:
// actualiza la contraseña si el usuario ya existe, lo crea si no.
//
// Uso (desde una terminal con TURSO_DATABASE_URL y TURSO_AUTH_TOKEN
// reales de neoproxy-prod en el entorno -- NO desde esta sesión, acá no
// hay credenciales de producción a propósito):
//
//   npx tsx scripts/reset-root-password.ts "TuContraseñaNuevaSegura"
//
// Username opcional como segundo argumento (default: darkproxy):
//
//   npx tsx scripts/reset-root-password.ts "TuContraseñaNuevaSegura" darkproxy

import { db } from '../lib/core-db/index'
import { users } from '../src/db/schema'
import { createHash, randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'

async function main() {
  const newPassword = process.argv[2]
  const username = process.argv[3] || 'darkproxy'

  if (!newPassword) {
    console.error('Falta la contraseña nueva. Uso: npx tsx scripts/reset-root-password.ts "TuContraseñaNuevaSegura" [username]')
    process.exit(1)
  }
  if (newPassword.length < 12) {
    console.error('La contraseña tiene menos de 12 caracteres -- elegí algo más largo antes de seguir.')
    process.exit(1)
  }

  const passwordHash = createHash('sha256').update(newPassword).digest('hex')
  const existing = await db.select().from(users).where(eq(users.username, username)).get()

  if (existing) {
    await db.update(users)
      .set({ passwordHash, role: 'root' })
      .where(eq(users.username, username))
    console.log(`✅ Contraseña actualizada para '${username}' (fila existente, id=${existing.id}). role=root confirmado.`)
  } else {
    await db.insert(users).values({
      id: randomUUID(),
      username,
      passwordHash,
      role: 'root',
      createdAt: Date.now(),
    })
    console.log(`✅ Usuario '${username}' creado con role=root.`)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
