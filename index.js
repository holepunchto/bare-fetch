const http = require('bare-http1')
const https = require('bare-https')
const { ReadableStream } = require('bare-stream/web')
const Response = require('./lib/response')
const Headers = require('./lib/headers')
const errors = require('./lib/errors')

// https://fetch.spec.whatwg.org/#dom-global-fetch
module.exports = exports = function fetch(input, init = { headers: {} }) {
  let resolve
  let reject

  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  const result = new Response()

  process(input)

  return promise

  function process(input) {
    if (result._urls.length > 20) {
      return reject(errors.TOO_MANY_REDIRECTS('Redirect count exceeded'))
    }

    let target
    try {
      target = new URL(input)
    } catch (err) {
      return reject(errors.INVALID_URL('Invalid URL', err))
    }

    let protocol

    if (target.protocol === 'http:') {
      protocol = http
    } else if (target.protocol === 'https:') {
      protocol = https
    } else {
      return reject(errors.UNKNOWN_PROTOCOL('Unknown protocol'))
    }

    result._urls.push(target)

    if (!init.headers['user-agent']) init.headers['user-agent'] = 'bare'

    const req = protocol.request(target, init, (res) => {
      if (res.headers.location && isRedirectStatus(res.statusCode)) {
        return process(res.headers.location)
      }

      result._body = new ReadableStream(res)
      result._status = res.statusCode
      result._statusText = res.statusMessage

      for (const [name, value] of Object.entries(res.headers)) {
        result._headers.set(name, value)
      }

      resolve(result)
    })

    req
      .on('error', (e) => reject(errors.NETWORK_ERROR('Network error', e)))
      .end(init.body)
  }
}

exports.Response = Response
exports.Headers = Headers

// https://fetch.spec.whatwg.org/#redirect-status
function isRedirectStatus(status) {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  )
}
