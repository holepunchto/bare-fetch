const http = require('bare-http1')
const https = require('bare-https')
const { Readable } = require('bare-stream')
const { ReadableStream } = require('bare-stream/web')
const Request = require('./lib/request')
const Response = require('./lib/response')
const ResponseStream = require('./lib/response-stream')
const Headers = require('./lib/headers')
const errors = require('./lib/errors')

// https://fetch.spec.whatwg.org/#dom-global-fetch
module.exports = exports = function fetch(input, init = {}) {
  let resolve
  let reject

  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  const response = new Response()

  process(input)

  return promise

  async function process(input, origin = null) {
    let request
    try {
      request = new Request(input, init)
    } catch (err) {
      return reject(err)
    }

    if (response._urls.length > 20) {
      return reject(errors.TOO_MANY_REDIRECTS('Redirect count exceeded'))
    }

    if (origin && !isSameOrigin(request._url, origin)) {
      request.headers.delete('authorization')
    }

    let protocol

    if (request._url.protocol === 'http:') {
      protocol = http
    } else if (request._url.protocol === 'https:') {
      protocol = https
    } else {
      return reject(errors.UNKNOWN_PROTOCOL('Unknown protocol'))
    }

    response._urls.push(request._url)

    if (!request._headers.has('user-agent')) {
      request._headers.set('user-agent', `Bare/${Bare.version.substring(1)}`)
    }

    const req = protocol.request(
      request._url,
      {
        method: request._method,
        headers: Object.fromEntries(request._headers)
      },
      (res) => {
        if (res.headers.location && isRedirectStatus(res.statusCode)) {
          return process(res.headers.location, request._url)
        }

        response._body = new ReadableStream(new ResponseStream(res))
        response._status = res.statusCode
        response._statusText = res.statusMessage

        for (const [name, value] of Object.entries(res.headers)) {
          response._headers.set(name, value)
        }

        resolve(response)
      }
    )

    req.on('error', (err) => reject(errors.NETWORK_ERROR('Network error', err)))

    try {
      if (request._body) {
        for await (const data of request._body) req.write(data)
      }

      req.end()
    } catch (err) {
      return reject(errors.NETWORK_ERROR('Network error', err))
    }
  }
}

exports.Request = Request
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

// https://html.spec.whatwg.org/multipage/browsers.html#same-origin
function isSameOrigin(a, b) {
  return a.protocol === b.protocol && a.host === b.host
}
