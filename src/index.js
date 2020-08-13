import moment from 'moment'

export default () => {
  const StdoutWrite = process.stdout.write.bind(process.stdout)
  process.stdout.write = function($str) {
    const str = _formatLogString($str)
    StdoutWrite(str)
  }
  
  const StderrWrite = process.stderr.write.bind(process.stderr)
  process.stderr.write = function($str) {
    const str = _formatLogErrString($str)
    StderrWrite(str)
  }
  
  console.log('Logs loaded ✓')
}

function _formatLogString($str) {
  const timestamp = moment().format('DD MMM YYYY HH:mm:ss')
  const str = `${timestamp}   ${$str.slice(0, -1).replace(/\n/g, '\n                       ') + '\n'}`
  return str
}

function _formatLogErrString($str) {
  return `\x1b[31m${_formatLogString($str)}\x1b[0m`
}
