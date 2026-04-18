import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'

let baseUrl = ''
let closeServer = async () => {}
let createUser: typeof import('../repositories/users.js').createUser
let findUserByUsername: typeof import('../repositories/users.js').findUserByUsername
let hashPassword: typeof import('../lib/password.js').hashPassword
let verifyPassword: typeof import('../lib/password.js').verifyPassword
let signAuthToken: typeof import('../lib/auth.js').signAuthToken

before(async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'lvyou-auth-route-test-'))
  process.env.DB_PATH = join(tempDir, 'auth-route-test.db')
  process.env.JWT_SECRET = 'lvyou-auth-route-test-secret'

  const [{ createApp }, usersModule, passwordModule, authModule] = await Promise.all([
    import('../app.js'),
    import('../repositories/users.js'),
    import('../lib/password.js'),
    import('../lib/auth.js'),
  ])

  createUser = usersModule.createUser
  findUserByUsername = usersModule.findUserByUsername
  hashPassword = passwordModule.hashPassword
  verifyPassword = passwordModule.verifyPassword
  signAuthToken = authModule.signAuthToken

  const server = createApp().listen(0)
  await once(server, 'listening')

  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
  closeServer = async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
    rmSync(tempDir, { force: true, recursive: true })
  }
})

after(async () => {
  await closeServer()
})

test('PATCH /api/auth/profile updates the username and refreshes the auth token', async () => {
  const currentUsername = createUniqueUsername('hangzhou-guide')
  const nextUsername = createUniqueUsername('westlake-guide')
  const user = createUser(currentUsername, hashPassword('Heritage!2026'))
  const token = signAuthToken(user)

  const response = await fetch(`${baseUrl}/api/auth/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: nextUsername,
    }),
  })

  assert.equal(response.status, 200)

  const payload = (await response.json()) as {
    token: string
    user: {
      id: string
      username: string
    }
  }

  assert.equal(payload.user.id, user.id)
  assert.equal(payload.user.username, nextUsername)
  assert.equal(typeof payload.token, 'string')
  assert.notEqual(payload.token, token)
  assert.equal(findUserByUsername(currentUsername), null)
  assert.equal(findUserByUsername(nextUsername)?.user.username, nextUsername)
})

test('PATCH /api/auth/password requires the current password and persists the new password hash', async () => {
  const currentUsername = createUniqueUsername('xian-heritage')
  const user = createUser(currentUsername, hashPassword('Heritage!2026'))
  const token = signAuthToken(user)

  const rejectedResponse = await fetch(`${baseUrl}/api/auth/password`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      confirmPassword: 'NewHeritage!2027',
      currentPassword: 'WrongPassword!2026',
      newPassword: 'NewHeritage!2027',
    }),
  })

  assert.equal(rejectedResponse.status, 401)

  const successResponse = await fetch(`${baseUrl}/api/auth/password`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      confirmPassword: 'NewHeritage!2027',
      currentPassword: 'Heritage!2026',
      newPassword: 'NewHeritage!2027',
    }),
  })

  assert.equal(successResponse.status, 200)

  const updatedUser = findUserByUsername(currentUsername)
  assert.ok(updatedUser)
  assert.equal(verifyPassword('Heritage!2026', updatedUser.passwordHash), false)
  assert.equal(verifyPassword('NewHeritage!2027', updatedUser.passwordHash), true)
})

function createUniqueUsername(prefix: string) {
  const normalizedPrefix = prefix.slice(0, 16)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${normalizedPrefix}-${suffix}`
}
