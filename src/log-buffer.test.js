import chai from 'chai'
import { createLogBuffer } from './log-buffer.js'

const { expect } = chai

describe(import.meta.url, function() {
  describe(createLogBuffer.name, function() {
    it('deve devolver a janela inteira sem cursor e só as linhas novas a partir do cursor', function() {
      const buffer = createLogBuffer(10)
      buffer.push('a\n')
      buffer.push('b\n')
      const primeira = buffer.since()
      expect(primeira.lines).to.deep.equal(['a\n', 'b\n'])

      expect(buffer.since(primeira.cursor).lines).to.deep.equal([])
      buffer.push('c\n')
      const segunda = buffer.since(primeira.cursor)
      expect(segunda.lines).to.deep.equal(['c\n'])
      expect(segunda.cursor).to.not.equal(primeira.cursor)
    })

    it('deve manter só as últimas maxLines linhas', function() {
      const buffer = createLogBuffer(3)
      for (let i = 1; i <= 10; i++) buffer.push(`${i}\n`)
      expect(buffer.since().lines).to.deep.equal(['8\n', '9\n', '10\n'])
    })

    it('deve devolver o que ainda tem na janela quando o cliente ficou para trás', function() {
      const buffer = createLogBuffer(3)
      buffer.push('1\n')
      const { cursor } = buffer.since()
      for (let i = 2; i <= 10; i++) buffer.push(`${i}\n`)
      expect(buffer.since(cursor).lines).to.deep.equal(['8\n', '9\n', '10\n'])
    })

    it('deve devolver a janela inteira para cursor de outra instância (processo reiniciado) ou inválido', function() {
      const anterior = createLogBuffer(10)
      anterior.push('antigo\n')
      const buffer = createLogBuffer(10)
      buffer.push('novo\n')
      expect(buffer.since(anterior.since().cursor).lines).to.deep.equal(['novo\n'])
      expect(buffer.since('lixo').lines).to.deep.equal(['novo\n'])
      expect(buffer.since(`${buffer.since().cursor.split('.')[0]}.abc`).lines).to.deep.equal(['novo\n'])
    })

    it('deve avisar quem espera quando chegam linhas novas, juntando as linhas seguidas', async function() {
      const buffer = createLogBuffer(10)
      const { cursor } = buffer.since()
      const espera = buffer.waitForLines(5000)
      buffer.push('a\n')
      buffer.push('b\n')
      await espera
      expect(buffer.since(cursor).lines).to.deep.equal(['a\n', 'b\n'])
    })

    it('deve parar de esperar depois do tempo limite', async function() {
      const buffer = createLogBuffer(10)
      const inicio = Date.now()
      await buffer.waitForLines(50)
      expect(Date.now() - inicio).to.be.at.least(45)
    })
  })
})
