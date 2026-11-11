#!/usr/bin/env node
// acompanha os logs de um servidor com console-web-node: mostra a janela de linhas guardada e segue as novas
// uso: npx console-web-node <servidor ou url> (chave na variável de ambiente CONSOLE_WEB_NODE_KEY)
//      npx console-web-node --nova-chave
import http from 'http'
import https from 'https'
import { newKey } from './auth.js'

const KEY_ENV = 'CONSOLE_WEB_NODE_KEY'
const RETRY_MS = 5000
const RESPONSE_TIMEOUT_MS = 60000 // o servidor responde em até 30s mesmo sem linhas novas

const [target] = process.argv.slice(2)

if (target === '--nova-chave') {
  const { key, hash } = newKey()
  console.log(`Chave (guarde na variável de ambiente ${KEY_ENV} de quem vai acompanhar os logs):\n  ${key}\n`)
  console.log(`Hash (substitua KEY_HASH em src/auth.js e publique uma nova versão):\n  ${hash}`)
} else if (!target || target.startsWith('-')) {
  console.error('uso: console-web-node <servidor ou url>   (ex.: meusistema.com.br, https://meusistema.com.br/api/x/logs)')
  console.error('     console-web-node --nova-chave')
  process.exitCode = 1
} else if (!process.env[KEY_ENV]) {
  console.error(`informe a chave de acesso aos logs na variável de ambiente ${KEY_ENV}`)
  process.exitCode = 1
} else {
  const url = new URL(/^https?:\/\//.test(target) ? target : `https://${target}`)
  if (url.pathname === '/') url.pathname = '/api/x/logs'
  follow(url, process.env[KEY_ENV])
}

function follow(url, key, cursor = '') {
  const started = Date.now()
  let received = 0
  let finished = false // erros da requisição e da resposta podem chegar juntos: segue uma vez só
  if (cursor) url.searchParams.set('cursor', cursor)
  const continueAfter = (wait, nextCursor) => {
    if (finished) return
    finished = true
    setTimeout(() => follow(url, key, nextCursor), wait)
  }
  const retry = (error) => {
    const reason = error.message || error.code || String(error) // falha de conexão pode vir só com o código (ex.: ECONNREFUSED)
    if (!finished) console.error(`\n[console-web-node] ${reason}, tentando novamente em ${RETRY_MS / 1000}s...`)
    continueAfter(RETRY_MS, cursor)
  }

  const request = (url.protocol === 'http:' ? http : https).get(url, { headers: { Authorization: `Bearer ${key}` } }, (res) => {
    if (res.statusCode === 401) {
      console.error(`[console-web-node] chave recusada pelo servidor, confira a variável de ambiente ${KEY_ENV}`)
      process.exit(1)
    }
    const next = res.headers['x-cursor']
    if (res.statusCode !== 200 || !next) {
      res.resume()
      return retry(new Error(`resposta inesperada do servidor (HTTP ${res.statusCode})`))
    }
    if (cursor && next.split('.')[0] !== cursor.split('.')[0]) console.log('\n[console-web-node] servidor reiniciado, logs desde o início:\n')

    res.setEncoding('utf8')
    res.on('data', (data) => {
      received += data.length
      process.stdout.write(data)
    })
    res.on('error', retry)
    res.on('end', () => {
      // resposta vazia imediata não deveria acontecer: espera um pouco para não ficar em loop
      continueAfter(!received && Date.now() - started < 1000 ? 1000 : 0, next)
    })
  })
  request.setTimeout(RESPONSE_TIMEOUT_MS, () => request.destroy(new Error('sem resposta do servidor')))
  request.on('error', retry)
}
