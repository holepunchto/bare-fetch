const Body = require('./body')
const Headers = require('./headers')
const errors = require('./errors')

// https://fetch.spec.whatwg.org/#response-class
module.exports = class Response extends Body {
  // https://fetch.spec.whatwg.org/#dom-response
  constructor(body = null, init = {}) {
    const { status = 200, statusText = '', headers } = init

    super(body)

    this._urls = []
    this._type = 'default'
    this._status = status
    this._statusText = statusText
    this._headers = new Headers(headers)

    if (this._contentType !== null && !this._headers.has('content-type')) {
      this._headers.set('content-type', this._contentType)
    }
  }

  // https://fetch.spec.whatwg.org/#dom-response-type
  get type() {
    return this._type
  }

  // https://fetch.spec.whatwg.org/#dom-response-url
  get url() {
    return this._urls.length === 0 ? null : this._urls[this._urls.length - 1].href
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

  // https://fetch.spec.whatwg.org/#dom-response-clone
  clone() {
    if (Body.isUnusable(this)) throw errors.BODY_UNUSABLE('Body has already been consumed')

    const cloned = new Response(Body.clone(this), this)
    cloned._type = this._type
    return cloned
  }

  // https://fetch.spec.whatwg.org/#dom-response-error
  static error() {
    const response = new Response(null)

    response._type = 'error'
    response._status = 0
    response._statusText = ''

    return response
  }

  // https://fetch.spec.whatwg.org/#dom-response-redirect
  static redirect(url, status = 302) {
    let parsed
    try {
      parsed = new URL(url)
    } catch (err) {
      throw errors.INVALID_URL('Invalid URL', err)
    }

    if (!isRedirectStatus(status)) {
      throw errors.INVALID_REDIRECT_STATUS(`'${status}' is not a redirect status`)
    }

    const response = new Response(null, { status })

    response._headers.set('location', parsed.href)

    return response
  }

  // https://fetch.spec.whatwg.org/#dom-response-json
  static json(data, init = {}) {
    let body
    try {
      body = JSON.stringify(data)
    } catch (err) {
      throw errors.INVALID_JSON('Data could not be serialized to JSON', err)
    }

    if (body === undefined) {
      throw errors.INVALID_JSON('Data could not be serialized to JSON')
    }

    const response = new Response(body, init)

    if (!response._headers.has('content-type')) {
      response._headers.set('content-type', 'application/json')
    }

    return response
  }
}

// https://fetch.spec.whatwg.org/#redirect-status
function isRedirectStatus(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308
}
