import chai from 'chai'
import { isAuthorized, newKey, KEY_HASH } from './auth.js'

const { expect } = chai

describe(import.meta.url, function() {
  describe(isAuthorized.name, function() {
    const { key, hash } = newKey()

    it('deve aceitar a chave cujo hash confere', function() {
      expect(isAuthorized(`Bearer ${key}`, hash)).to.equal(true)
    })

    it('deve recusar chave errada, cabeçalho ausente ou fora do formato', function() {
      expect(isAuthorized(`Bearer ${newKey().key}`, hash)).to.equal(false)
      expect(isAuthorized(undefined, hash)).to.equal(false)
      expect(isAuthorized(key, hash)).to.equal(false)
      expect(isAuthorized(`Basic ${key}`, hash)).to.equal(false)
    })

    it('deve recusar tudo quando não há hash configurado ou ele é inválido', function() {
      expect(isAuthorized(`Bearer ${key}`, '')).to.equal(false)
      expect(isAuthorized(`Bearer ${key}`, 'abc')).to.equal(false)
    })

    it('deve ter um hash de chave válido configurado', function() {
      expect(Buffer.from(KEY_HASH, 'base64')).to.have.length(32)
    })
  })
})
