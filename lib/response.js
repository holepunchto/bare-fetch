const Body = require('./body')
const Headers = require('./headers')

// https://fetch.spec.whatwg.org/#response-class
module.exports = class Response extends Body {
  constructor(body = null, opts = {}) {
    const { headers = new Headers(), status = 200 } = opts

    super(body)

    this.headers = headers
    this.status = status
    this.redirected = false
  }

  // https://fetch.spec.whatwg.org/#dom-response-ok
  get ok() {
    return this.status >= 200 && this.status <= 299
  }
}
