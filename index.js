const http = require('bare-http1')
const https = require('bare-https')
const { now, markResourceTiming } = require('bare-performance')
const { finished } = require('bare-stream')
const { ReadableStream } = require('bare-stream/web')
const Body = require('./lib/body')
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

  // https://fetch.spec.whatwg.org/#concept-filtered-response-basic
  response._type = 'basic'

  const timingInfo = { startTime: now(), endTime: 0 }

  let request
  try {
    request = new Request(input, init)
  } catch (err) {
    reject(err)

    return promise
  }

  process()

  return promise

  async function process() {
    let req = null

    if (request.signal) {
      if (request.signal.aborted) return abort(reject, request, response)

      request.signal.addEventListener('abort', () => {
        abort(reject, request, response)

        if (req !== null) {
          req.off('close', onclose)
          req.destroy()
        }
      })
    }

    if (response._urls.length > 20) {
      return reject(errors.TOO_MANY_REDIRECTS('Redirect count exceeded'))
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

    const agent = request._agent || protocol.globalAgent

    while (agent.suspended) await agent.resumed

    try {
      req = protocol.request(
        request._url,
        {
          agent,
          method: request._method,
          headers: Object.fromEntries(request._headers)
        },
        onresponse
      )
    } catch (err) {
      return reject(errors.NETWORK_ERROR('Network error', err))
    }

    req.on('error', onerror).on('close', onclose)

    try {
      if (request._body) {
        for await (const data of request._body) req.write(data)
      }

      req.end()
    } catch (err) {
      req.destroy(err)
    }

    function onresponse(res) {
      req.off('close', onclose)

      if (request.signal && request.signal.aborted) {
        res.resume()

        return abort(reject, request, response)
      }

      if (
        res.headers.location &&
        isRedirectStatus(res.statusCode) &&
        request.redirect !== 'manual'
      ) {
        res.resume()

        if (request.redirect === 'error') {
          return reject(new TypeError('Redirect mode is set to error'))
        }

        let url
        try {
          url = new URL(res.headers.location, request._url)
        } catch (err) {
          return reject(errors.INVALID_URL('Invalid URL', err))
        }

        try {
          redirect(request, res.statusCode, url)
        } catch (err) {
          return reject(err)
        }

        return process()
      }

      const responseStream = new ResponseStream(res)

      response._body = new ReadableStream(responseStream)
      response._status = res.statusCode
      response._statusText = res.statusMessage

      finished(responseStream, { cleanup: true }, processResponseEndOfBody)

      for (const [name, value] of Object.entries(res.headers)) {
        if (Array.isArray(value)) {
          for (const item of value) response._headers.append(name, item)
        } else {
          response._headers.set(name, value)
        }
      }

      resolve(response)
    }

    function processResponseEndOfBody(err) {
      if (err) return

      timingInfo.endTime = now()

      markResourceTiming(timingInfo, response._urls[0].href, 'fetch', {}, '', {}, response.status)
    }

    function onerror(err) {
      req.off('close', onclose)

      reject(errors.NETWORK_ERROR('Network error', err))
    }

    function onclose() {
      onerror(http.errors.CONNECTION_LOST())
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

// https://fetch.spec.whatwg.org/#http-redirect-fetch
function redirect(request, status, url) {
  if (status !== 303 && request._body !== null && request._source === null) {
    throw errors.NETWORK_ERROR('Cannot replay a streamed body to follow a redirect')
  }

  if (
    ((status === 301 || status === 302) && request._method === 'POST') ||
    (status === 303 && request._method !== 'GET' && request._method !== 'HEAD')
  ) {
    request._method = 'GET'
    request._body = null
    request._source = null

    for (const name of requestBodyHeaderNames) request._headers.delete(name)
  }

  if (!isSameOrigin(request._url, url)) {
    for (const name of crossOriginHeaderNames) request._headers.delete(name)
  }

  if (request._body !== null) request._body = Body.fromSource(request._source)

  request._url = url
}

// https://fetch.spec.whatwg.org/#request-body-header-name
const requestBodyHeaderNames = [
  'content-encoding',
  'content-language',
  'content-length',
  'content-location',
  'content-type'
]

// Beyond the `authorization` header required by the specification, credentials
// and routing set by the caller for one origin must not reach another.
const crossOriginHeaderNames = ['authorization', 'cookie', 'host', 'proxy-authorization']

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
