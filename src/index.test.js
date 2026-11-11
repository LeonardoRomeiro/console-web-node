import chai from 'chai'
import { createFormatter } from './index.js'

const { expect } = chai

describe(import.meta.url, function() {
  describe(createFormatter.name, function() {
    const moment = () => ({ format: () => '11 nov 2026 16:00:00' })

    it('deve colocar data e hora e alinhar as linhas seguintes da mensagem', function() {
      expect(createFormatter(moment).line('um erro\nem duas linhas\n')).to.equal('11 nov 2026 16:00:00   um erro\n                       em duas linhas\n')
      expect(createFormatter(moment).partial('50%\r')).to.equal('11 nov 2026 16:00:00   50%\r')
    })

    it('deve manter o texto original sem moment', function() {
      expect(createFormatter().line('[Nest] 2026-11-11 16:00:00 LOG ok\n')).to.equal('[Nest] 2026-11-11 16:00:00 LOG ok\n')
    })
  })
})
