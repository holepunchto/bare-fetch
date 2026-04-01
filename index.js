const http = require('bare-http1')
const https = require('bare-https')
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

    if (request.signal) {
      if (request.signal.aborted) return abort(reject, request, response)

      request.signal.addEventListener('abort', (event) => abort(reject, request, response))
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
      return reject(errors.UNKNOWN_PROTOCOL(`Unknown protocol '${request._url.protocol}'`))
    }

    response._urls.push(request._url)

    if (!request._headers.has('user-agent')) {
      request._headers.set('user-agent', `Bare/${Bare.version.substring(1)}`)
    }

    if (!request._headers.has('content-type') && request._type) {
      request._headers.set('content-type', request._type)
    }

    const agent = request._agent || protocol.globalAgent

    while (agent.suspended) await agent.resumed

    const req = protocol.request(
      request._url,
      {
        agent,
        method: request._method,
        headers: Object.fromEntries(request._headers)
      },
      (res) => {
        if (request.signal && request.signal.aborted) return abort(reject, request, response)

        if (res.headers.location && isRedirectStatus(res.statusCode)) {
          res.resume()

          let url
          try {
            url = new URL(res.headers.location, request._url)
          } catch (err) {
            return reject(errors.INVALID_URL('Invalid URL', err))
          }

          return process(url, request._url)
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
      req.destroy(err)
    }
  }
}

exports.Request = Request
exports.Response = Response
exports.Headers = Headers

// https://fetch.spec.whatwg.org/#redirect-status
function isRedirectStatus(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308
}

// https://html.spec.whatwg.org/multipage/browsers.html#same-origin
function isSameOrigin(a, b) {
  return a.protocol === b.protocol && a.host === b.host
}

// https://fetch.spec.whatwg.org/#abort-fetch
function abort(reject, req, res) {
  const { reason } = req.signal

  if (req._body !== null) req._body.cancel(reason)
  if (res._body !== null) res._body.cancel(reason)

  reject(reason)
}
