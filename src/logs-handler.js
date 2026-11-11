import { isAuthorized as defaultIsAuthorized } from './auth.js'

// GET dos logs: devolve as linhas depois do cursor (?cursor=) e o próximo cursor no cabeçalho X-Cursor
// sem linhas novas, espera até waitMs por elas (long polling) antes de responder vazio
export function createLogsHandler(buffer, { waitMs = 30000, isAuthorized = defaultIsAuthorized } = {}) {
  return async (req, res) => {
    if (!isAuthorized(req.headers.authorization)) {
      res.writeHead(401)
      return res.end()
    }
    const cursor = new URL(req.url, 'http://localhost').searchParams.get('cursor')
    let result = buffer.since(cursor)
    if (!result.lines.length) {
      await buffer.waitForLines(waitMs)
      result = buffer.since(cursor)
    }
    if (res.destroyed) return // cliente desconectou enquanto esperava
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Cursor': result.cursor })
    res.end(result.lines.join(''))
  }
}
