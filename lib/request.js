const Body = require('./body')
const Headers = require('./headers')
const errors = require('./errors')

// https://fetch.spec.whatwg.org/#request-class
module.exports = class Request extends Body {
  // https://fetch.spec.whatwg.org/#dom-request
  constructor(input, init = {}) {
    const { body = null, method = 'GET', headers } = init

    super(body)

    let url
    try {
      url = new URL(input)
    } catch (err) {
      throw errors.INVALID_URL('Invalid URL', err)
    }

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
