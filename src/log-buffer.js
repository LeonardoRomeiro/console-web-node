import crypto from 'crypto'

// janela com as últimas linhas do log, numeradas em sequência desde o início do processo
// o cursor (instância.sequência) indica ao cliente de onde continuar a leitura;
// a instância muda quando o processo reinicia, e aí o cliente recebe a janela inteira do processo novo
export function createLogBuffer(maxLines) {
  const instance = crypto.randomBytes(4).toString('hex')
  const waiting = new Set()
  let notifying = false
  let lines = []
  let total = 0

  const notify = () => {
    notifying = false
    const waiters = Array.from(waiting)
    waiting.clear()
    waiters.forEach((done) => done())
  }

  return {
    push(line) {
      lines.push(line)
      total++
      if (lines.length >= maxLines * 2) lines = lines.slice(-maxLines) // descarta as antigas de uma vez, não a cada linha
      if (waiting.size && !notifying) { // várias linhas seguidas vão na mesma resposta
        notifying = true
        setImmediate(notify)
      }
    },

    // linhas depois do cursor (a janela inteira se o cursor for de outra instância, inválido ou ausente) e o próximo cursor
    since(cursor) {
      const [cursorInstance, sequence] = String(cursor || '').split('.')
      const seen = cursorInstance === instance && /^\d+$/.test(sequence) ? Number(sequence) : -Infinity
      const count = Math.min(total - seen, lines.length, maxLines)
      return { lines: count > 0 ? lines.slice(-count) : [], cursor: `${instance}.${total}` }
    },

    // resolve quando chegar uma linha nova ou depois de timeoutMs
    waitForLines(timeoutMs) {
      return new Promise((resolve) => {
        const done = () => {
          clearTimeout(timer)
          waiting.delete(done)
          resolve()
        }
        const timer = setTimeout(done, timeoutMs)
        waiting.add(done)
      })
    },
  }
}
