import { CircularBuffer } from './utils/circular-buffer.js'
import minio from 'minio'
import crypto from 'crypto'
import eventEmitter from 'events'

const minioClient = new minio.Client({
  endPoint: process.env.MINIO_URL,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  useSSL: true
})
const LOGS_BUCKET = 'logs'
const READ_TIMEOUT = 30000
const LISTNER_TIMEOUT = 60000
const BROADCAST_TOKEN = 'broadcast'
const events = new eventEmitter()

export default async function ConsoleWebNode({ consoleTimestamp = true, maxLines = 10000, express = null, name = 'logs', moment, logsPath = '/api/x/logs' }) {
  const circularBuffer = CircularBuffer(maxLines)

  !await minioClient.bucketExists(LOGS_BUCKET) && await minioClient.makeBucket(LOGS_BUCKET)

  await minioClient.getObject(LOGS_BUCKET, name)
    .then((stream) => new Promise((resolve) => {
        const data = []
        stream.on('data', data.push.bind(data))
        stream.on('end', resolve.bind(null, data))
      }))
    .then((file) => Buffer.concat(file).toString().split('\n').forEach(line => circularBuffer.push(line + '\n')))
    .catch(() => { })

  express.get(logsPath, async (req, res) => {
    if (!hasListner(req.query.u)) {
      if (!checkPass(req.query.p)) res.end()
      setListner(req.query.u)
      return res.send(circularBuffer.toArray().join(''))
    }
    setListner(req.query.u)
    const ls = await readListner(req.query.u)
    res.send(ls.join(''))
  })
  express.post(logsPath, async (req, res) => {
    if (hasListner(req.query.u)) clearLastLogs(req.query.u)
    res.end()
  })

  const StdoutWrite = global.process.stdout.write.bind(global.process.stdout)
  const StderrWrite = global.process.stderr.write.bind(global.process.stderr)

  global.process.stdout.write = function($str) {
    if (typeof $str !== 'string') return StdoutWrite($str)

    const strTime = _setTimestamp(moment, $str)

    if ($str[$str.length - 1] === '\n') {
      const strFormat = _formatLogString(strTime)
      consoleTimestamp ? StdoutWrite(strFormat) : StdoutWrite($str)
      broadcast(strFormat)
      circularBuffer.push(strFormat)
      writeToFile()
    } else {
      consoleTimestamp ? StdoutWrite(strTime) : StdoutWrite($str)
      broadcast(strTime)
    }
  }

  global.process.stderr.write = function($str) {
    if (typeof $str !== 'string') return StderrWrite($str)

    const strTime = _setTimestamp(moment, $str)

    if ($str[$str.length - 1] === '\n') {
      const strFormat = _formatLogErrString(strTime)
      consoleTimestamp ? StderrWrite(strFormat) : StderrWrite($str)
      broadcast(strFormat)
      circularBuffer.push(strFormat)
      writeToFile()
    } else {
      consoleTimestamp ? StderrWrite(strTime) : StderrWrite($str)
      broadcast(strTime)
    }
  }

  function writeToFile() {
    writeToFile._timeout && clearTimeout(writeToFile._timeout)
    writeToFile._timeout = setTimeout(() => minioClient.putObject(LOGS_BUCKET, name, circularBuffer.toArray().join('')), 200)
  }

}

const listners = {}
function broadcast($str) {
  Object.keys(listners).forEach((key) => {
    listners[key].logs.push($str)
  })

  broadcast._timeout && clearTimeout(broadcast._timeout)
  broadcast._timeout = setTimeout(() => events.emit(BROADCAST_TOKEN), 0)
}

function setListner(listner) {
  listners[listner] = listners[listner] || { logs: [], lastLogs: [] }

  listners[listner]._setTimeout && clearTimeout(listners[listner]._setTimeout)
  listners[listner]._setTimeout = setTimeout(() => {
    listners[listner]._readTimeout && clearTimeout(listners[listner]._readTimeout)
    listners[listner]._readClear && events.off(BROADCAST_TOKEN, listners[listner]._readClear)
    delete listners[listner]
  }, LISTNER_TIMEOUT)
}

function clearLastLogs(listner) {
  listners[listner].lastLogs = []
}

function readListner(listner) {
  return new Promise((resolve) => {
    if (listners[listner].lastLogs[0] || listners[listner].logs[0]) return resolve(read(listner))

    listners[listner]._readTimeout && clearTimeout(listners[listner]._readTimeout)
    listners[listner]._readClear && events.off(BROADCAST_TOKEN, listners[listner]._readClear)

    listners[listner]._readClear = () => {
      clearTimeout(listners[listner]._readTimeout)
      resolve(read(listner))
    }

    listners[listner]._readTimeout = setTimeout(() => {
      events.off(BROADCAST_TOKEN, listners[listner]._readClear)
      resolve([])
    }, READ_TIMEOUT)

    events.once(BROADCAST_TOKEN, listners[listner]._readClear)
  })
}

function read(listner) {
  listners[listner].lastLogs = listners[listner].lastLogs.concat(listners[listner].logs)
  listners[listner].logs = []
  return listners[listner].lastLogs
}

function hasListner(listner) {
  return !!listners[listner]
}

function checkPass(pass) {
  return crypto.createHash('sha1').update(pass).digest('base64') === 'rJzrVISFf5EOCkdA3DkVpId9yZo='
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
