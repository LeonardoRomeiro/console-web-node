import crypto from 'crypto'

// sha256 (base64) da chave de acesso aos logs, gerado com `npx console-web-node --nova-chave`
// a chave é aleatória (256 bits): mesmo com o hash público não dá para descobri-la por força bruta
// vazio: nenhuma chave é aceita
export const KEY_HASH = 'PgYhxkg8Kk8BXArYKM8a6Y/ME7/cYn3COpBoAf9lm58='

const sha256 = (value) => crypto.createHash('sha256').update(value).digest()

// confere o cabeçalho Authorization (Bearer <chave>) com o hash da chave
export function isAuthorized(authorization, keyHash = KEY_HASH) {
  const match = /^Bearer (\S+)$/.exec(authorization || '')
  const expected = Buffer.from(keyHash, 'base64')
  if (!match || expected.length !== 32) return false
  return crypto.timingSafeEqual(sha256(match[1]), expected)
}

export function newKey() {
  const key = crypto.randomBytes(32).toString('hex')
  return { key, hash: sha256(key).toString('base64') }
}
