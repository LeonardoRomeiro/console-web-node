export function CircularBuffer(size) {
  let currentIndex = size - 1
  const bufferArray = Array(size)
  const indexTable = _newBufferNextIndexTable(size)
  return {
    push(value) {
      currentIndex = _push(currentIndex, indexTable, bufferArray, value)
      return this
    },
    toArray() { return _toArray(currentIndex, indexTable, bufferArray) }
  }
}

export function _newBufferNextIndexTable(size) {
  const result = {}
  for (let index = 0; index < size; index++) {
    result[index] = index + 1
  }
  result[size - 1] = 0
  return result
}

export function _push(currentIndex, indexTable, bufferArray, value) {
  const nextIndex = indexTable[currentIndex]
  bufferArray[nextIndex] = value
  return nextIndex
}

export function _toArray(currentIndex, indexTable, bufferArray) {
  currentIndex = indexTable[currentIndex]
  if (typeof bufferArray[currentIndex] === 'undefined') return bufferArray.slice(0, currentIndex)

  const result = []
  for (const value of bufferArray) {
    result.push(bufferArray[currentIndex])
    currentIndex = indexTable[currentIndex]
  }
  return result
}
