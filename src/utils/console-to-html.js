export function _replaceAllColor(text) {
  return text
    .replace(/\[0m/g, '</span>')
    .replace(/\[39m/g, '</span>')
    .replace(/\[30m/g, '<span style="color:gray">')
    .replace(/\[31m/g, '<span style="color:red">')
    .replace(/\[32m/g, '<span style="color:green">')
    .replace(/\[33m/g, '<span style="color:yellow">')
    .replace(/\[34m/g, '<span style="color:blue">')
    .replace(/\[35m/g, '<span style="color:magenta">')
    .replace(/\[36m/g, '<span style="color:cyan">')
    .replace(/\[37m/g, '<span style="color:gray">')
    .replace(/\[90m/g, '<span style="color:gray">')
}

export function consoleToHtmlLine(text = '') {
  return _replaceAllColor(text)
}

export function consoleToHtml(text) {
  return `
  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <style>body {background-color:black; color: white;}</style>
  <pre>${text}</pre>
  `
}
