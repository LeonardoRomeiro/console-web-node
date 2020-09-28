import { CircularBuffer } from './utils/circular-buffer.js'
import websocket from 'websocket'
import minio from 'minio'
import crypto from 'crypto'

let writeToFile = () => {}

export default async function ConsoleWebNode({ moment, consoleTimestamp = true, maxLines = 10000, server = null, name = 'logs' }) {
  const circularBuffer = CircularBuffer(maxLines)

  if (process.env.AMBIENTE && process.env.AMBIENTE !== 'fabrica') {
    const LOGS_BUCKET = 'logs'
    const minioClient = new minio.Client({
      endPoint: process.env.MINIO_URL,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      useSSL: true
    })

    !await minioClient.bucketExists(LOGS_BUCKET) && await minioClient.makeBucket(LOGS_BUCKET)

    await minioClient.getObject(LOGS_BUCKET, name)
    .then((stream) => new Promise((resolve) => {
      const data = []
      stream.on('data', data.push.bind(data))
      stream.on('end', resolve.bind(null, data))
    }))
    .then((file) => Buffer.concat(file).toString().split('\n').forEach(line => circularBuffer.push(line + '\n')))
    .catch(() => { })

    writeToFile = () => {
      clearTimeout(writeToFile._timeout)
      writeToFile._timeout = setTimeout(() => minioClient.putObject(LOGS_BUCKET, name, circularBuffer.toArray().join('')), 200)
    }
  }

  const ws = new websocket.server({ httpServer: server })

  ws.on('request', function(request) {
    if (crypto.createHash('sha1').update(request.origin).digest('base64') !== 'rJzrVISFf5EOCkdA3DkVpId9yZo=') return request.reject()
    const connection = request.accept(null, request.origin)
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
