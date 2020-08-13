import moment from 'moment'
import { CircularBuffer } from './utils/circular-buffer.js'

const LINES = 10000
const LINE_SIZE = 200
const COLLECTION_NAME = 'logs'

export default async function ConsoleWebNode(db, logsCollectionName = COLLECTION_NAME, lines = LINES) {
  let persistMethodFn
  if (db) {
    const collectionLogs = db.collection(logsCollectionName)
    await db.createCollection(logsCollectionName, { capped: true, size: lines * LINE_SIZE, max: lines }).catch(() => { })
    persistMethodFn = _persistMongodb.bind(null, collectionLogs)
  } else {
    const circularBuffer = CircularBuffer(lines)
    persistMethodFn = _persistMemory.bind(null, circularBuffer)
  }
    

  const StdoutWrite = process.stdout.write.bind(process.stdout)
  process.stdout.write = function($str) {
    const str = _formatLogString($str)
    StdoutWrite(str)
    persistMethodFn(str)
  }
  
  const StderrWrite = process.stderr.write.bind(process.stderr)
  process.stderr.write = function($str) {
    const str = _formatLogErrString($str)
    StderrWrite(str)
    persistMethodFn(str)
  }
}

function _formatLogString($str) {
  const timestamp = moment().format('DD MMM YYYY HH:mm:ss')
  const str = `${timestamp}   ${$str.slice(0, -1).replace(/\n/g, '\n                       ') + '\n'}`
  return str
}

function _formatLogErrString($str) {
  return `\x1b[31m${_formatLogString($str)}\x1b[0m`
}

function _persistMemory(circularBuffer, $str) {
  circularBuffer.push($str)
}

function _persistMongodb(collectionLogs, $str) {
  collectionLogs.insertOne({ line: $str })
}
