const { ReadableStream } = require('bare-stream/web')
const Headers = require('./headers')
const errors = require('./errors')

module.exports = class Response {
  constructor(body = null, opts = {}) {
    const { headers = new Headers(), status = 200 } = opts

    this.headers = headers
    this.status = status
    this.redirected = false
    this.body = null
    this.bodyUsed = false

    if (typeof body === 'string') body = Buffer.from(body)

    if (Buffer.isBuffer(body)) {
      this.body = new ReadableStream({
        start(controller) {
          if (typeof body === 'string') body = Buffer.from(body)

          controller.enqueue(body)
          controller.close()
        }
      })
    } else if (body !== null) {
      this.body = body
    }
  }

  async buffer() {
    if (this.bodyUsed) {
      throw errors.BODY_ALREADY_CONSUMED('Body has already been consumed')
    }

    this.bodyUsed = true

    const chunks = []
    let length = 0

    for await (const chunk of this.body) {
      chunks.push(chunk)
      length += chunk.byteLength
    }

    const result = Buffer.from(new ArrayBuffer(length))
    let offset = 0

    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.byteLength
    }

    return result
  }

  // https://fetch.spec.whatwg.org/#dom-body-bytes
  async bytes() {
    return this.buffer()
  }

  // https://fetch.spec.whatwg.org/#dom-body-arraybuffer
  async arrayBuffer() {
    return (await this.buffer()).buffer
  }

  // https://fetch.spec.whatwg.org/#dom-body-text
  async text() {
    return (await this.buffer()).toString('utf8')
  }

  // https://fetch.spec.whatwg.org/#dom-body-json
  async json() {
    return JSON.parse(await this.text())
  }
}
