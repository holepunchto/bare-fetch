const http = require('bare-http1')
const https = require('bare-https')

module.exports = function get (link) {
  return new Promise((resolve, reject) => {
    function processLink (link) {
      const target = new URL(link)

      let protocol
      if (target.protocol === 'http:') {
        protocol = http
      } else if (target.protocol === 'https:') {
        protocol = https
      } else reject(new Error('You need an http or https link'))

      const req = protocol.request(target, (incoming) => {
        const result = {
          data: null,
          status: null
        }

        incoming.setEncoding('utf8')

        incoming.on('data', (chunk) => {
          result.data = result.data ? result.data += chunk : chunk
        })

        incoming.on('end', () => {
          if (incoming.headers.location) {
            processLink(incoming.headers.location)
          } else {
            result.status = incoming.statusCode
            resolve(result)
          }
        })
      })

      req.on('error', (e) => reject(e))

      req.end()
    }

    processLink(link)
  })
}
