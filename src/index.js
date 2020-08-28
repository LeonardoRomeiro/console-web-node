import { CircularBuffer } from './utils/circular-buffer.js'
import { consoleToHtml, consoleToHtmlLine } from './utils/console-to-html.js'

const LINE_SIZE = 200

export default async function ConsoleWebNode({
  express = null,
  moment = null,
  db = null,
  consoleTimestamp = true,
  logsCollectionName = 'logs',
  logsPath = '/api/x/logs',
  maxLines = 10000
}) {

  let persistMethodFn
  let logsFn

  if (db) {
    const collectionLogs = db.collection(logsCollectionName)
    await db.createCollection(logsCollectionName, { capped: true, size: maxLines * LINE_SIZE, max: maxLines }).catch(() => { })
    persistMethodFn = _persistMongodb.bind(null, collectionLogs)
    logsFn = _logsFromMongodb.bind(null, collectionLogs)
  } else {
    const circularBuffer = CircularBuffer(maxLines)
    persistMethodFn = _persistMemory.bind(null, circularBuffer)
    logsFn = _logsFromMemory.bind(null, circularBuffer)
  }

  ConsoleWebNode.logs = logsFn
  if (express) {
    express.get(logsPath, async (req, res) => res.send(await ConsoleWebNode.logs()))
  }

  const StdoutWrite = global.process.stdout.write.bind(global.process.stdout)
  const StderrWrite = global.process.stderr.write.bind(global.process.stderr)

  global.process.stdout.write = function($str) {
    if (typeof $str !== 'string') return StdoutWrite($str)

    const strTime = _setTimestamp(moment, $str)

    if ($str[$str.length - 1] === '\n') {
      const strFormat = _formatLogString(strTime)
      consoleTimestamp ? StdoutWrite(strFormat) : StdoutWrite($str)
      persistMethodFn(strFormat)
    } else {
      consoleTimestamp ? StdoutWrite(strTime) : StdoutWrite($str)
    }
  }

  global.process.stderr.write = function($str) {
    if (typeof $str !== 'string') return StderrWrite($str)

    const strTime = _setTimestamp(moment, $str)

    if ($str[$str.length - 1] === '\n') {
      const strFormat = _formatLogErrString(strTime)
      consoleTimestamp ? StderrWrite(strFormat) : StderrWrite($str)
      persistMethodFn(strFormat)
    } else {
      consoleTimestamp ? StderrWrite(strTime) : StderrWrite($str)
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

function _persistMemory(circularBuffer, $str) {
  circularBuffer.push($str)
}

async function _persistMongodb(collectionLogs, $str) {
  collectionLogs.insertOne({ line: $str })
}

async function _logsFromMemory(circularBuffer) {
  return consoleToHtml(circularBuffer.toArray().map((line) => consoleToHtmlLine(line)).join(''))
}

async function _logsFromMongodb(collectionLogs) {
  const logsDocs = await collectionLogs.find().toArray()
  return consoleToHtml(logsDocs.map(({ line }) => consoleToHtmlLine(line)).join(''))
}
