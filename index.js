const http = require('http')
const https = require('https')
const Response = require('./lib/response')
const Headers = require('./lib/headers')
const errors = require('./lib/errors')

module.exports = exports = function fetch(url, opts = {}) {
  let redirects = 0

  return process(url)

  async function process(url) {
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

        const result = new Response()

        result.status = res.statusCode
        result.redirected = redirects > 0

        for (const [name, value] of Object.entries(res.headers)) {
          result.headers.set(name, value)
        }

        result.body._read = (cb) => {
          res.resume()
          cb(null)
        }

        res
          .on('data', (chunk) => {
            if (result.body.push(chunk) === false) res.pause()
          })
          .on('end', () => {
            result.body.push(null)
          })

        resolve(result)
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
function isRedirectStatus(status) {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  )
}
