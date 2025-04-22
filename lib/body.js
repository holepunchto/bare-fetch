const { ReadableStream, isReadableStreamDisturbed } = require('bare-stream/web')
const errors = require('./errors')

const empty = Buffer.from(new ArrayBuffer(0))

// https://fetch.spec.whatwg.org/#body-mixin
module.exports = class Body {
  constructor(body = null) {
    this._body = null

    if (typeof body === 'string') body = Buffer.from(body)

    if (Buffer.isBuffer(body)) {
      this._body = new ReadableStream({
        start(controller) {
          controller.enqueue(body)
          controller.close()
        }
      })
    } else if (body !== null) {
      this._body = body
    }
  }

  // https://fetch.spec.whatwg.org/#dom-body-body
  get body() {
    return this._body
  }

  // https://fetch.spec.whatwg.org/#dom-body-bodyused
  get bodyUsed() {
    return this._body !== null && isReadableStreamDisturbed(this._body)
  }

  async buffer() {
    if (this._body === null) return empty

    if (isReadableStreamDisturbed(this._body)) {
      throw errors.BODY_UNUSABLE('Body has already been consumed')
    }

    const chunks = []
    let length = 0

    for await (const chunk of this._body) {
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
