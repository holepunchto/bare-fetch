const Body = require('./body')
const Headers = require('./headers')
const errors = require('./errors')

// https://fetch.spec.whatwg.org/#request-class
module.exports = class Request extends Body {
  // https://fetch.spec.whatwg.org/#dom-request
  constructor(input, init = {}) {
    let url
    try {
      if (URL.isURL(input)) {
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
      headers = input.headers
    } = init

    super(body)

    this._url = url
    this._method = method
    this._headers = new Headers(headers)
  }

  // https://fetch.spec.whatwg.org/#dom-request-url
  get url() {
    return this._url.href
  }

  // https://fetch.spec.whatwg.org/#dom-request-method
  get method() {
    return this._method
  }

  // https://fetch.spec.whatwg.org/#dom-response-headers
  get headers() {
    return this._headers
  }
}
