// https://fetch.spec.whatwg.org/#headers-class
module.exports = class Headers {
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

  *[Symbol.iterator]() {
    const names = [...this._headers.keys()].sort()

    for (const name of names) {
      yield [name, this.get(name)]
    }
  }
}
