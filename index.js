const http = require('bare-http1')
const https = require('bare-https')
const { Readable } = require('bare-stream')

module.exports = function fetch (link) {
  return new Promise((resolve, reject) => {
    function processLink (link) {
      const target = new URL(link)

      let protocol
      if (target.protocol === 'http:') {
        protocol = http
      } else if (target.protocol === 'https:') {
        protocol = https
      } else {
        reject(new Error('You need an http or https link'))
        return
      }

      const req = protocol.request(target, (incoming) => {
        const result = {
          body: new Readable(),

          async buffer () {
            if (this.bodyUsed) throw new Error('The body of this response has already been consumed.')
            this.bodyUsed = true

            const chunks = []

            for await (const chunk of this.body) {
              chunks.push(chunk)
            }

            return Buffer.concat(chunks)
          },

          async text () {
            return (await this.buffer()).toString('utf8')
          },

          async json () {
            return JSON.parse(await this.text())
          },

          bodyUsed: false
        }

        incoming.on('data', (chunk) => {
          result.body.push(chunk)
        })

        incoming.on('end', () => {
          result.body.push(null)
          if (incoming.headers.location) {
            processLink(incoming.headers.location)
          } else {
            result.status = incoming.statusCode
            result.headers = new Map(Object.entries(incoming.headers))

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
