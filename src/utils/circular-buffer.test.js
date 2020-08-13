import chai from 'chai'
import { _newBufferNextIndexTable, _push, _toArray, CircularBuffer } from './circular-buffer.js'

describe(import.meta.url, function() {

  describe(_newBufferNextIndexTable.name, function() {
    it('deve retornar uma tabela de próximos índices', function() {
      chai.expect(_newBufferNextIndexTable(4)).to.deep.equal({ 0: 1, 1: 2, 2: 3, 3: 0 })
    })
  })

  describe(_push.name, function() {
    it('deve retornar o array com o valor inserido na posicão 5', function() {
      const value = 'teste'
      const index = 3
      const indexTable = _newBufferNextIndexTable(6)
      const bufferArray = Array(6)
      const nextIndex = _push(index, indexTable, bufferArray, value)
      chai.expect(nextIndex).to.equal(4)
      chai.expect(bufferArray[4]).to.equal(value)
    })
    it('deve retornar o array com o valor inserido na última posição', function() {
      const value = 'teste'
      const index = 4
      const indexTable = _newBufferNextIndexTable(6)
      const bufferArray = Array(6)
      const nextIndex = _push(index, indexTable, bufferArray, value)
      chai.expect(nextIndex).to.equal(5)
      chai.expect(bufferArray[bufferArray.length - 1]).to.equal(value)
    })
    it('deve retornar o array com o valor inserido na primeira posicão', function() {
      const value = 'teste'
      const index = 5
      const indexTable = _newBufferNextIndexTable(6)
      const bufferArray = Array(6)
      const nextIndex = _push(index, indexTable, bufferArray, value)
      chai.expect(nextIndex).to.equal(0)
      chai.expect(bufferArray[0]).to.equal(value)
    })
  })

  describe(_toArray.name, function() {
    it('deve retornar um array com a órdem dos itens do buffer circular', function() {
      const bufferArray = [4, 5, 0, 1, 2, 3]
      const indexTable = _newBufferNextIndexTable(6)
      const currentIndex = 1
      const expectedArray = [0, 1, 2, 3, 4, 5]
      const resultArray = _toArray(currentIndex, indexTable, bufferArray)
      chai.expect(resultArray).to.deep.equal(expectedArray)
    })
    it('deve retornar um array incompleto', function() {
      const bufferArray = [4, 5, , , , ]
      const indexTable = _newBufferNextIndexTable(6)
      const currentIndex = 1
      const expectedArray = [4, 5]
      const resultArray = _toArray(currentIndex, indexTable, bufferArray)
      chai.expect(resultArray).to.deep.equal(expectedArray)
    })
  })

  describe(CircularBuffer.name, function() {
    it('deve retornar um array preenchido 1', function() {
      const circularBuffer = CircularBuffer(6)
      const expectedArray = [0, 1, 2, 3, 4, 5]
      circularBuffer.push(0)
      circularBuffer.push(1)
      circularBuffer.push(2)
      circularBuffer.push(3)
      circularBuffer.push(4)
      circularBuffer.push(5)
      chai.expect(circularBuffer.toArray()).to.deep.equal(expectedArray)
    })
    it('deve retornar um array preenchido 2', function() {
      const circularBuffer = CircularBuffer(6)
      const expectedArray = [3, 4, 5, 6, 7, 8]
      circularBuffer.push(0)
      circularBuffer.push(1)
      circularBuffer.push(2)
      circularBuffer.push(3)
      circularBuffer.push(4)
      circularBuffer.push(5)
      circularBuffer.push(6)
      circularBuffer.push(7)
      circularBuffer.push(8)
      chai.expect(circularBuffer.toArray()).to.deep.equal(expectedArray)
    })
    it('deve retornar um array preenchido 3', function() {
      const circularBuffer = CircularBuffer(6)
      const expectedArray = [6, 7, 8]
      circularBuffer.push(6)
      circularBuffer.push(7)
      circularBuffer.push(8)
      chai.expect(circularBuffer.toArray()).to.deep.equal(expectedArray)
    })
    it('deve retornar um array vazio', function() {
      const circularBuffer = CircularBuffer(6)
      const expectedArray = []
      chai.expect(circularBuffer.toArray()).to.deep.equal(expectedArray)
    })
  })

})
