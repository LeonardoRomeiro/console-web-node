import chai from 'chai'
import http from 'http'
import { createLogBuffer } from './log-buffer.js'
import { createLogsHandler } from './logs-handler.js'

const { expect } = chai

describe(import.meta.url, function() {
  describe(createLogsHandler.name, function() {
    let server
    let buffer
    let base

    beforeEach(async function() {
      buffer = createLogBuffer(10)
      const handler = createLogsHandler(buffer, { waitMs: 200, isAuthorized: (authorization) => authorization === 'Bearer certa' })
      server = http.createServer(handler)
      await new Promise((resolve) => server.listen(0, resolve))
      base = `http://localhost:${server.address().port}/api/x/logs`
    })

    afterEach(() => server.close())

    const get = (query = '', authorization = 'Bearer certa') => new Promise((resolve, reject) => {
      http.get(`${base}${query}`, { headers: { authorization } }, (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (data) => { body += data })
        res.on('end', () => resolve({ status: res.statusCode, cursor: res.headers['x-cursor'], body }))
      }).on('error', reject)
    })

    it('deve recusar sem a chave certa, sem registrar nada', async function() {
      buffer.push('segredo\n')
      expect(await get('', 'Bearer errada')).to.include({ status: 401, body: '' })
      expect(await get('', 'Bearer errada')).to.include({ status: 401, body: '' })
    })

    it('deve devolver o histórico e depois só as linhas novas', async function() {
      buffer.push('a\n')
      const primeira = await get()
      expect(primeira).to.include({ status: 200, body: 'a\n' })

      setTimeout(() => buffer.push('b\n'), 50)
      const segunda = await get(`?cursor=${primeira.cursor}`)
      expect(segunda).to.include({ status: 200, body: 'b\n' })
    })

    it('deve responder vazio com o mesmo cursor depois do tempo de espera', async function() {
      buffer.push('a\n')
      const { cursor } = await get()
      const vazia = await get(`?cursor=${cursor}`)
      expect(vazia).to.include({ status: 200, body: '', cursor })
    })
  })
})
