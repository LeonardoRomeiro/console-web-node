import moment from 'moment'

const LINES = 10000
const LINE_SIZE = 200
const COLLECTION_NAME = 'logs'

export default async function ConsoleWebNode(db, logsCollectionName = COLLECTION_NAME, lines = LINES) {
  const CollectionLogs = db.collection(logsCollectionName)
  await db.createCollection(logsCollectionName, { capped: true, size: lines * LINE_SIZE, max: lines }).catch(() => { })


  const StdoutWrite = process.stdout.write.bind(process.stdout)
  process.stdout.write = function($str) {
    const str = _formatLogString($str)
    StdoutWrite(str)
    CollectionLogs.insertOne({ line: str })
  }
  
  const StderrWrite = process.stderr.write.bind(process.stderr)
  process.stderr.write = function($str) {
    const str = _formatLogErrString($str)
    StderrWrite(str)
    CollectionLogs.insertOne({ line: str })
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
