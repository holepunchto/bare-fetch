const Body = require('./body')
const Headers = require('./headers')

// https://fetch.spec.whatwg.org/#response-class
module.exports = class Response extends Body {
  // https://fetch.spec.whatwg.org/#dom-response
  constructor(body = null, init = {}) {
    const { status = 200, statusText = '', headers } = init

    super(body)

    this._urls = []
    this._status = status
    this._statusText = statusText
    this._headers = new Headers(headers)
  }

  // https://fetch.spec.whatwg.org/#dom-response-url
  get url() {
    return this._urls.length === 0
      ? null
      : this._urls[this._urls.length - 1].href
  }

  // https://fetch.spec.whatwg.org/#dom-response-redirected
  get redirected() {
    return this._urls.length > 1
  }

  // https://fetch.spec.whatwg.org/#dom-response-status
  get status() {
    return this._status
  }

  // https://fetch.spec.whatwg.org/#dom-response-ok
  get ok() {
    return this._status >= 200 && this._status <= 299
  }

  // https://fetch.spec.whatwg.org/#dom-response-statustext
  get statusText() {
    return this._statusText
  }

  // https://fetch.spec.whatwg.org/#dom-response-headers
  get headers() {
    return this._headers
  }
}
