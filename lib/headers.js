const MIME = require('bare-mime')

const errors = require('./errors')

const NUL = 0x00
const LF = 0x0a
const CR = 0x0d

// https://www.rfc-editor.org/rfc/rfc9110.html#section-5.6.2
const TOKEN_BYTES = Buffer.from([
  // 0x00-0x1f (control characters) + 0x20 (space)
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  // 0x21-0x41: ! " # $ % & ' ( ) * + , - . / 0-9 : ; < = > ? @ A
  1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1,
  // 0x42-0x62: B-Z [ \ ] ^ _ ` a b
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1,
  // 0x63-0x7f: c-z { | } ~ DEL
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0
])

function isTokenByte(b) {
  return b < TOKEN_BYTES.length && TOKEN_BYTES[b] === 1
}

function isFieldByte(b) {
  return b !== NUL && b !== LF && b !== CR
}

// https://fetch.spec.whatwg.org/#header-name
function validateName(name) {
  if (name.length === 0) {
    throw errors.INVALID_HEADER_NAME(`Header name must not be empty`)
  }

  for (let i = 0, n = name.length; i < n; i++) {
    if (!isTokenByte(name.charCodeAt(i))) {
      throw errors.INVALID_HEADER_NAME(`Invalid header name '${name}'`)
    }
  }
}

// https://fetch.spec.whatwg.org/#header-value
function validateValue(name, value) {
  for (let i = 0, n = value.length; i < n; i++) {
    if (!isFieldByte(value.charCodeAt(i))) {
      throw errors.INVALID_HEADER_VALUE(`Invalid header value for '${name}'`)
    }
  }
}

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
    value = value.trim()

    validateName(name)
    validateValue(name, value)

    name = name.toLowerCase()

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
    value = value.trim()

    validateName(name)
    validateValue(name, value)

    name = name.toLowerCase()

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
