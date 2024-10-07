const http = require('http')
const https = require('https')
const Response = require('./lib/response')
const Headers = require('./lib/headers')

const redirectStatuses = [301, 302, 303, 307, 308]

const supportedMethods = ['GET', 'POST', 'PUT']

module.exports = exports = function fetch (link, opts = {}) {
  return new Promise((resolve, reject) => {
    let redirects = 0
    const redirectsLimit = 20

    function processLink (link) {
      if (redirects > redirectsLimit) {
        reject(new Error(`Exceeded ${redirectsLimit} redirects.`))
        return
      }

      let target
      try {
        target = new URL(link)
      } catch (e) {
        reject(e)
        return
      }

      let protocol
      if (target.protocol === 'http:') {
        protocol = http
      } else if (target.protocol === 'https:') {
        protocol = https
      } else {
        reject(new Error('You need an http or https link'))
        return
      }

      if (opts.method && !supportedMethods.includes(opts.method)) {
        reject(new Error(`The method ${opts.method} is not currently supported by bare-fetch.`))
        return
      }

      const req = protocol.request(
        target,
        { method: opts.method, headers: opts.headers },
        (incoming) => {
          if (incoming.headers.location && redirectStatuses.includes(incoming.statusCode)) {
            redirects++
            processLink(incoming.headers.location)
            return
          }

          const result = new Response()

          result.status = incoming.statusCode

          result.body._read = (callback) => {
            incoming.resume()
            callback(null)
          }

          incoming.on('data', (chunk) => {
            if (result.body.push(chunk) === false) incoming.pause()
          })

          incoming.on('end', () => {
            result.body.push(null)

            if (redirects > 0) result.redirected = true
            Object.entries(incoming.headers).forEach(h => result.headers.set(...h))

            resolve(result)
          })
        }
      )

      req.on('error', (e) => reject(e))

      if (opts.body) req.write(opts.body)

      req.end()
    }

    processLink(link)
  })
}

exports.Response = Response
exports.Headers = Headers
