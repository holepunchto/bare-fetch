const http = require('http')
const https = require('https')
const { ReadableStream } = require('bare-stream/web')
const Response = require('./lib/response')
const Headers = require('./lib/headers')
const errors = require('./lib/errors')

module.exports = exports = function fetch (url, opts = {}) {
  let redirects = 0

  return process(url)

  async function process (url) {
    if (redirects > 20) {
      throw errors.TOO_MANY_REDIRECTS('Redirect count exceeded')
    }

    let target
    try {
      target = new URL(url)
    } catch (err) {
      throw errors.INVALID_URL('Invalid URL', err)
    }

    let protocol

    if (target.protocol === 'http:') {
      protocol = http
    } else if (target.protocol === 'https:') {
      protocol = https
    } else {
      throw errors.UNKNOWN_PROTOCOL('Unknown protocol')
    }

    return new Promise((resolve, reject) => {
      const req = protocol.request(target, opts, (res) => {
        if (res.headers.location && isRedirectStatus(res.statusCode)) {
          redirects++

          return process(res.headers.location).then(resolve, reject)
        }

        const body = new ReadableStream({
          start (controller) {
            res
              .on('data', (chunk) => controller.enqueue(chunk))
              .on('end', () => {
                controller.close()

                if (redirects > 0) result.redirected = true

                Object.entries(res.headers).forEach(h => result.headers.set(...h))

                resolve(result)
              })
          }
        })

        const result = new Response(body)
        result.status = res.statusCode
      })

      req.on('error', (e) => reject(errors.NETWORK_ERROR('Network error', e)))

      if (opts.body) req.write(opts.body)

      req.end()
    })
  }
}

exports.Response = Response
exports.Headers = Headers

// https://fetch.spec.whatwg.org/#redirect-status
function isRedirectStatus (status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308
}
