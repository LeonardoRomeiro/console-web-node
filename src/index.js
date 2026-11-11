import { createLogBuffer } from './log-buffer.js'
import { createLogsHandler } from './logs-handler.js'

// guarda em memória as últimas maxLines linhas escritas no stdout/stderr e as disponibiliza
// na rota logsPath do app express para o cliente (npx console-web-node <servidor>)
// moment: coloca data e hora em cada linha (sem ele as linhas ficam como foram escritas, ex.: logger que já tem data e hora)
// consoleTimestamp: escreve também no console as linhas com data e hora (false: o console recebe o texto original)
export default function ConsoleWebNode({ express, moment, logsPath = '/api/x/logs', maxLines = 10000, consoleTimestamp = true }) {
  if (!express) throw new Error('console-web-node: informe em express o app onde registrar a rota dos logs')

  const buffer = createLogBuffer(maxLines)
  express.get(logsPath, createLogsHandler(buffer))

  const format = createFormatter(moment)
  intercept(process.stdout, buffer, format, consoleTimestamp, (line) => line)
  intercept(process.stderr, buffer, format, consoleTimestamp, (line) => `\x1b[31m${line}\x1b[0m`)
}

// só linhas completas (terminadas em \n) vão para os logs; escritas parciais (ex.: progresso com \r) só para o console
function intercept(stream, buffer, format, consoleTimestamp, color) {
  const write = stream.write.bind(stream)
  stream.write = function(chunk, ...args) {
    if (typeof chunk !== 'string') return write(chunk, ...args)
    if (!chunk.endsWith('\n')) return write(consoleTimestamp ? format.partial(chunk) : chunk, ...args)
    const line = color(format.line(chunk))
    buffer.push(line)
    return write(consoleTimestamp ? line : chunk, ...args)
  }
}

// data e hora no início, com as linhas seguintes de uma mensagem com várias linhas alinhadas depois dela
export function createFormatter(moment) {
  if (!moment) return { line: (text) => text, partial: (text) => text }
  const timestamp = (text) => `${moment().format('DD MMM YYYY HH:mm:ss')}   ${text}`
  return {
    line: (text) => timestamp(text).slice(0, -1).replace(/\n/g, '\n                       ') + '\n',
    partial: timestamp,
  }
}
