const MIME = require('bare-mime')

// https://fetch.spec.whatwg.org/#headers-class
module.exports = exports = class Headers {
  // https://fetch.spec.whatwg.org/#dom-headers
  constructor(init) {
    this._headers = new Map()

    if (init) {
      for (const [key, value] of typeof init[Symbol.iterator] === 'function'
        ? init
        : Object.entries(init)) {
        this.append(key, value)
      }
    }
  }

  // https://fetch.spec.whatwg.org/#dom-headers-append
  append(name, value) {
    name = name.toLowerCase()
    value = value.trim()

    let list = this._headers.get(name)

    if (list === undefined) {
      list = []
      this._headers.set(name, list)
    }

    list.push(value)
  }

  // https://fetch.spec.whatwg.org/#dom-headers-delete
  delete(name) {
    name = name.toLowerCase()

    this._headers.delete(name)
  }

  // https://fetch.spec.whatwg.org/#dom-headers-get
  get(name) {
    name = name.toLowerCase()

    const list = this._headers.get(name)

    if (list === undefined) return null

    return list.join(', ')
  }

  // https://fetch.spec.whatwg.org/#dom-headers-has
  has(name) {
    name = name.toLowerCase()

    return this._headers.has(name)
  }

  // https://fetch.spec.whatwg.org/#dom-headers-set
  set(name, value) {
    name = name.toLowerCase()
    value = value.trim()

    this._headers.set(name, [value])
  }

  // https://webidl.spec.whatwg.org/#idl-iterable
  entries() {
    return this[Symbol.iterator]()
  }

  // https://webidl.spec.whatwg.org/#idl-iterable
  *keys() {
    for (const [name] of this) {
      yield name
    }
  }

  // https://webidl.spec.whatwg.org/#idl-iterable
  *values() {
    for (const [, value] of this) {
      yield value
    }
  }

  // https://webidl.spec.whatwg.org/#idl-iterable
  forEach(callback, thisArg) {
    for (const [name, value] of this) {
      callback.call(thisArg, value, name, this)
    }
  }

  *[Symbol.iterator]() {
    const names = [...this._headers.keys()].sort()

    for (const name of names) {
      yield [name, this.get(name)]
    }
  }
}

// https://fetch.spec.whatwg.org/#concept-header-extract-mime-type
exports.extractMIMEType = function extractMIMEType(headers) {
  // 1.
  const contentType = headers.get('content-type')

  // 2.
  if (contentType === null) return null

  // 3.
  const values = getDecodeSplit(contentType)

  // 4.
  let mimeType = null

  // 5.
  for (const value of values) {
    const parsed = MIME.parse(value)

    if (parsed !== null) {
      mimeType = parsed
    }
  }

  // 6.
  return mimeType
}

// https://fetch.spec.whatwg.org/#concept-header-list-get-decode-split
function getDecodeSplit(value) {
  const values = []
  let current = ''
  let position = 0

  while (position < value.length) {
    if (value[position] === '"') {
      current += value[position++]

      while (position < value.length) {
        if (value[position] === '\\' && position + 1 < value.length) {
          current += value[position++]
          current += value[position++]
        } else if (value[position] === '"') {
          current += value[position++]
          break
        } else {
          current += value[position++]
        }
      }
    } else if (value[position] === ',') {
      values.push(current.trim())
      current = ''
      position++
    } else {
      current += value[position++]
    }
  }

  values.push(current.trim())

  return values
}
