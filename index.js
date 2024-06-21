const http = require('bare-http1')
const https = require('bare-https')
const { Readable } = require('bare-stream')

class Response {
  constructor () {
    this.headers = new Map()
    this.body = new Readable()
    this.bodyUsed = false
    this.redirected = false
    this.status = 0
  }

  async buffer () {
    if (this.bodyUsed) throw new Error('The body of this response has already been consumed.')
    this.bodyUsed = true

    const chunks = []

    for await (const chunk of this.body) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }

  async text () {
    return (await this.buffer()).toString('utf8')
  }

  async json () {
    return JSON.parse(await this.text())
  }
}

module.exports = function fetch (link) {
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

      const req = protocol.request(target, (incoming) => {
        if (incoming.headers.location) {
          redirects++
          processLink(incoming.headers.location)
          return
        }

        const result = new Response()

        result.status = incoming.statusCode

        incoming.on('data', (chunk) => {
          result.body.push(chunk)
        })

        incoming.on('end', () => {
          result.body.push(null)

          if (redirects > 0) result.redirected = true
          Object.entries(incoming.headers).forEach(h => result.headers.set(...h))

          resolve(result)
        })
      })

      req.on('error', (e) => reject(e))

      req.end()
    }

    processLink(link)
  })
}
