import chai from 'chai'
import { _replaceAllBarraN, _replaceAllColor, consoleToHtmlLine } from './console-to-html.js'

describe(import .meta.url, function() {
  describe(_replaceAllColor.name, function() {
    it('deve trocar a cor [30m para <span style="color:gray">', function() {
      const texto = 'texto [30mteste texto[0m teste'
      const esperado = 'texto <span style="color:gray">teste texto</span> teste'
      chai.expect(_replaceAllColor(texto)).to.deep.equal(esperado)
    })
    it('deve trocar a cor [31m para <span style="color:red">', function() {
      const texto = 'texto [31mteste texto[0m teste'
      const esperado = 'texto <span style="color:red">teste texto</span> teste'
      chai.expect(_replaceAllColor(texto)).to.deep.equal(esperado)
    })
    it('deve trocar a cor [32m para <span style="color:green">', function() {
      const texto = 'texto [32mteste texto[0m teste'
      const esperado = 'texto <span style="color:green">teste texto</span> teste'
      chai.expect(_replaceAllColor(texto)).to.deep.equal(esperado)
    })
    it('deve trocar a cor [33m para <span style="color:yellow">', function() {
      const texto = 'texto [33mteste texto[0m teste'
      const esperado = 'texto <span style="color:yellow">teste texto</span> teste'
      chai.expect(_replaceAllColor(texto)).to.deep.equal(esperado)
    })
    it('deve trocar a cor [34m para <span style="color:blue">', function() {
      const texto = 'texto [34mteste texto[0m teste'
      const esperado = 'texto <span style="color:blue">teste texto</span> teste'
      chai.expect(_replaceAllColor(texto)).to.deep.equal(esperado)
    })
    it('deve trocar a cor [35m para <span style="color:magenta">', function() {
      const texto = 'texto [35mteste texto[0m teste'
      const esperado = 'texto <span style="color:magenta">teste texto</span> teste'
      chai.expect(_replaceAllColor(texto)).to.deep.equal(esperado)
    })
    it('deve trocar a cor [36m para <span style="color:cyan">', function() {
      const texto = 'texto [36mteste texto[0m teste'
      const esperado = 'texto <span style="color:cyan">teste texto</span> teste'
      chai.expect(_replaceAllColor(texto)).to.deep.equal(esperado)
    })
    it('deve trocar a cor [37m para <span style="color:gray">', function() {
      const texto = 'texto [37mteste texto[0m teste'
      const esperado = 'texto <span style="color:gray">teste texto</span> teste'
      chai.expect(_replaceAllColor(texto)).to.deep.equal(esperado)
    })
    it('deve trocar a cor [90m para <span style="color:gray">', function() {
      const texto = 'texto [90mteste texto[39m teste'
      const esperado = 'texto <span style="color:gray">teste texto</span> teste'
      chai.expect(_replaceAllColor(texto)).to.deep.equal(esperado)
    })
  })
})
