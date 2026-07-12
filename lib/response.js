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
    this._status = status
    this._statusText = statusText
    this._type = null
    this._headers = new Headers(headers)
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

  // https://fetch.spec.whatwg.org/#dom-response-type
  get type() {
    return this._type || 'default'
  }

  // https://fetch.spec.whatwg.org/#dom-response-clone
  clone() {
    if (Body.isUnusable(this)) throw errors.BODY_UNUSABLE('Body has already been consumed')

    return new Response(Body.clone(this), this)
  }
}

// https://fetch.spec.whatwg.org/#dom-response-error
Response.error = function error() {
  const response = new Response(null, { status: 0, statusText: '' })
  response._type = 'error'
  return response
}

// https://fetch.spec.whatwg.org/#dom-response-redirect
Response.redirect = function redirect(url, status = 302) {
  // https://fetch.spec.whatwg.org/#concept-response-redirect
  let parsedURL

  try {
    parsedURL = new URL(url, 'http://localhost')
  } catch {
    throw new TypeError('Invalid URL')
  }

  if (!parsedURL) throw new TypeError('Invalid URL')

  if (status < 300 || status > 399) {
    throw new RangeError('Redirect status must be between 300 and 399')
  }

  const response = new Response(null, { status, statusText: '' })
  response._headers.set('Location', parsedURL.href)
  response._type = 'default'
  return response
}
