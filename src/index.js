import { CircularBuffer } from './utils/circular-buffer.js'
import websocket from 'websocket'
import fs from 'fs'

export default function ConsoleWebNode({ moment = null, consoleTimestamp = true, maxLines = 10000, server = null }) {
  const circularBuffer = CircularBuffer(maxLines)

  if (fs.existsSync('logs')) fs.readFileSync('logs', 'utf8').split('\n').forEach(line => circularBuffer.push(line + '\n'))

  const ws = new websocket.server({ httpServer: server })

  ws.on('request', function(request) {
    const connection = request.accept('log-me', request.origin)
    circularBuffer.toArray().forEach((line) => connection.send(line))
  })

  const StdoutWrite = global.process.stdout.write.bind(global.process.stdout)
  const StderrWrite = global.process.stderr.write.bind(global.process.stderr)

  global.process.stdout.write = function($str) {
    if (typeof $str !== 'string') return StdoutWrite($str)

    const strTime = _setTimestamp(moment, $str)

    if ($str[$str.length - 1] === '\n') {
      const strFormat = _formatLogString(strTime)
      consoleTimestamp ? StdoutWrite(strFormat) : StdoutWrite($str)
      ws.broadcast(strFormat)
      circularBuffer.push(strFormat)
      writeToFile()
    } else {
      consoleTimestamp ? StdoutWrite(strTime) : StdoutWrite($str)
      ws.broadcast(strTime)
    }
  }

  global.process.stderr.write = function($str) {
    if (typeof $str !== 'string') return StderrWrite($str)

    const strTime = _setTimestamp(moment, $str)

    if ($str[$str.length - 1] === '\n') {
      const strFormat = _formatLogErrString(strTime)
      consoleTimestamp ? StderrWrite(strFormat) : StderrWrite($str)
      ws.broadcast(strFormat)
      circularBuffer.push(strFormat)
      writeToFile()
    } else {
      consoleTimestamp ? StderrWrite(strTime) : StderrWrite($str)
      ws.broadcast(strTime)
    }
  }

  function writeToFile() {
    clearTimeout(writeToFile._timeout)
    writeToFile._timeout = setTimeout(() => fs.writeFileSync('logs', circularBuffer.toArray().join('')), 200)
  }

}

function _setTimestamp(moment, $str) {
  return `${moment().format('DD MMM YYYY HH:mm:ss')}   ${$str}`
}

function _formatLogString($str) {
  return `${$str.slice(0, -1).replace(/\n/g, '\n                       ') + '\n'}`
}

function _formatLogErrString($str) {
  return `\x1b[31m${_formatLogString($str)}\x1b[0m`
}
