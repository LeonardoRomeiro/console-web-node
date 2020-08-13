import { CircularBuffer } from './utils/circular-buffer.js'
import { consoleToHtml, consoleToHtmlLine } from './utils/console-to-html.js'

const LINES = 10000
const LINE_SIZE = 200
const COLLECTION_NAME = 'logs'

export default async function ConsoleWebNode(moment, db, logsCollectionName = COLLECTION_NAME, lines = LINES) {
  let persistMethodFn
  let logsFn

  if (db) {
    const collectionLogs = db.collection(logsCollectionName)
    await db.createCollection(logsCollectionName, { capped: true, size: lines * LINE_SIZE, max: lines }).catch(() => { })
    persistMethodFn = _persistMongodb.bind(null, collectionLogs)
    logsFn = _logsFromMongodb.bind(null, collectionLogs)
  } else {
    const circularBuffer = CircularBuffer(lines)
    persistMethodFn = _persistMemory.bind(null, circularBuffer)
    logsFn = _logsFromMemory.bind(null, circularBuffer)
  }
  
  ConsoleWebNode.logs = logsFn

  const StdoutWrite = global.process.stdout.write.bind(global.process.stdout)
  global.process.stdout.write = function($str) {
    StdoutWrite($str)
    persistMethodFn(_formatLogString(moment, $str))
  }
  
  const StderrWrite = global.process.stderr.write.bind(global.process.stderr)
  global.process.stderr.write = function($str) {
    StderrWrite($str)
    persistMethodFn(_formatLogErrString(moment, $str))
  }
}

function _formatLogString(moment, $str) {
  if (typeof $str !== 'string') return $str
  const timestamp = moment().format('DD MMM YYYY HH:mm:ss')
  const str = `${timestamp}   ${$str.slice(0, -1).replace(/\n/g, '\n                       ') + '\n'}`
  return str
}

function _formatLogErrString(moment, $str) {
  return `\x1b[31m${_formatLogString(moment, $str)}\x1b[0m`
}

function _persistMemory(circularBuffer, $str) {
  circularBuffer.push($str)
}

function _persistMongodb(collectionLogs, $str) {
  collectionLogs.insertOne({ line: $str })
}

async function _logsFromMemory(circularBuffer) {
  return consoleToHtml(circularBuffer.toArray().map((line) => consoleToHtmlLine(line)).join(''))
}

async function _logsFromMongodb(collectionLogs) {
  const logsDocs = await collectionLogs.find().toArray()
  return consoleToHtml(logsDocs.map(({ line }) => consoleToHtmlLine(line)).join(''))
}
