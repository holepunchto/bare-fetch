const { isURL } = require('bare-url')
const Body = require('./body')
const Headers = require('./headers')
const errors = require('./errors')

// https://fetch.spec.whatwg.org/#request-class
module.exports = class Request extends Body {
  // https://fetch.spec.whatwg.org/#dom-request
  constructor(input, init = {}) {
    let url
    try {
      if (isURL(input)) {
        url = input
        input = {}
      } else if (typeof input === 'string') {
        url = new URL(input)
        input = {}
      } else {
        url = new URL(input.url)
      }
    } catch (err) {
      throw errors.INVALID_URL('Invalid URL', err)
    }

    const {
      body = input.body || null,
      method = input.method || 'GET',
      headers = input.headers,
      signal = input.signal || null,
      agent = input.agent || null
    } = init

    super(body)

    this._url = url

    // https://fetch.spec.whatwg.org/#concept-method
    if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(method)) {
      throw errors.INVALID_METHOD(`'${method}' is not a valid method`)
    }

    // https://fetch.spec.whatwg.org/#forbidden-method
    if (/^(connect|trace|track)$/i.test(method)) {
      throw errors.FORBIDDEN_METHOD(`'${method}' is a forbidden method`)
    }

    // https://fetch.spec.whatwg.org/#concept-method-normalize
    this._method = /^(delete|get|head|options|post|put)$/i.test(method)
      ? method.toUpperCase()
      : method
    this._headers = new Headers(headers)
    this._signal = signal
    this._agent = agent

    if (this._contentType !== null && !this._headers.has('content-type')) {
      this._headers.set('content-type', this._contentType)
    }
  }

  // https://fetch.spec.whatwg.org/#dom-request-url
  get url() {
    return this._url.href
  }

  // https://fetch.spec.whatwg.org/#dom-request-method
  get method() {
    return this._method
  }

  // https://fetch.spec.whatwg.org/#dom-request-headers
  get headers() {
    return this._headers
  }

  // https://fetch.spec.whatwg.org/#dom-request-signal
  get signal() {
    return this._signal
  }

  // https://fetch.spec.whatwg.org/#dom-request-clone
  clone() {
    if (Body.isUnusable(this)) throw errors.BODY_UNUSABLE('Body has already been consumed')

    return new Request(this, { body: Body.clone(this) })
  }
}
