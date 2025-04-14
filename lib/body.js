const { ReadableStream, isReadableStreamDisturbed } = require('bare-stream/web')
const { isStream } = require('bare-stream')
const errors = require('./errors')

const empty = Buffer.from(new ArrayBuffer(0))

// https://fetch.spec.whatwg.org/#body-mixin
module.exports = exports = class Body {
  constructor(body = null) {
    this._body = exports.extractBody(body)
  }

  // https://fetch.spec.whatwg.org/#dom-body-body
  get body() {
    return this._body
  }

  // https://fetch.spec.whatwg.org/#dom-body-bodyused
  get bodyUsed() {
    return this._body !== null && isReadableStreamDisturbed(this._body)
  }

  // https://fetch.spec.whatwg.org/#concept-body-consume-body
  async buffer() {
    if (this._body === null) return empty

    return exports.fullyReadBody(this._body)
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

// https://fetch.spec.whatwg.org/#concept-bodyinit-extract
exports.extractBody = function extractBody(obj) {
  if (obj === null || obj instanceof ReadableStream) {
    return obj
  }

  if (isStream(obj)) {
    return new ReadableStream(obj)
  }

  if (typeof obj === 'string') obj = Buffer.from(obj)

  return new ReadableStream({
    start(controller) {
      controller.enqueue(obj)
      controller.close()
    }
  })
}

// https://fetch.spec.whatwg.org/#body-fully-read
exports.fullyReadBody = async function fullyReadBody(stream) {
  if (isReadableStreamDisturbed(stream)) {
    throw errors.BODY_UNUSABLE('Body has already been consumed')
  }

  const chunks = []
  let length = 0

  for await (const chunk of stream) {
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
