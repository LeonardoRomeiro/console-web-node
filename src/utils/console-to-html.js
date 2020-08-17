import Convert from 'ansi-to-html'
const convert = new Convert();
 
export function consoleToHtmlLine(text = '') {
  return convert.toHtml(text)
}

export function consoleToHtml(text) {
  return `
  <link rel="icon" href="data:;base64,iVBORw0KGgo=">
  <style>body {background-color:black; color: white;}</style>
  <pre>${text}</pre>
  `
}
