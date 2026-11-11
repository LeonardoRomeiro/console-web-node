# console-web-node

Guarda em memória as últimas linhas escritas no console (stdout/stderr) de um servidor Node com Express (ou NestJS sobre Express), e permite acompanhá-las de outra máquina: primeiro a janela guardada, depois as linhas novas em tempo real.

## Servidor

```js
import consoleWebNode from 'console-web-node'
import moment from 'moment'

consoleWebNode({ express: app, moment })

// NestJS: o logger já coloca data e hora
consoleWebNode({ express: app.getHttpAdapter().getInstance(), consoleTimestamp: false })
```

| opção | padrão | |
|---|---|---|
| `express` | — | app ou router express onde é registrada a rota dos logs |
| `moment` | — | instância do moment para colocar data e hora nas linhas (sem ela as linhas ficam como foram escritas, para loggers que já colocam data e hora) |
| `logsPath` | `/api/x/logs` | caminho da rota (relativo ao `express` informado) |
| `maxLines` | `10000` | quantidade de linhas guardadas em memória |
| `consoleTimestamp` | `true` | escreve também no console as linhas com data e hora |

## Acompanhar os logs

```sh
export CONSOLE_WEB_NODE_KEY=<chave>
npx console-web-node meusistema.com.br                 # https://meusistema.com.br/api/x/logs
npx console-web-node https://meusistema.com.br/x/logs  # outro caminho
```

Rodando na pasta do projeto que usa a biblioteca, o `npx` usa a versão instalada nele (a mesma do servidor).

## Chave de acesso

```sh
npx console-web-node --nova-chave
```

Gera uma chave aleatória (para a variável `CONSOLE_WEB_NODE_KEY`) e o hash dela, que vai em `KEY_HASH` em `src/auth.js`. Sem hash configurado nenhuma chave é aceita.
