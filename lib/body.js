const { ReadableStream, isReadableStream, isReadableStreamDisturbed } = require('bare-stream/web')
const { isURLSearchParams } = require('bare-url')
const { FormData, isFormData, isBlob } = require('bare-form-data')
const errors = require('./errors')

const empty = Buffer.from(new ArrayBuffer(0))

// https://fetch.spec.whatwg.org/#body-mixin
module.exports = exports = class Body {
  constructor(body = null, type = null) {
    if (isReadableStream(body)) {
      if (isReadableStreamDisturbed(body) || body.locked) {
        throw errors.BODY_UNUSABLE('Body has already been consumed')
      }
    } else {
      if (typeof body === 'string') body = Buffer.from(body)
      else if (isFormData(body)) body = FormData.toBlob(body)
      else if (isURLSearchParams(body)) {
        body = body.toString()
        type = 'application/x-www-form-urlencoded;charset=UTF-8'
      }

      if (isBlob(body)) {
        type = body.type || null
        body = body.stream()
      } else if (body !== null) {
        if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength)
        } else {
          body = Buffer.from(body)
        }

        body = new ReadableStream({
          start(controller) {
            controller.enqueue(body)
            controller.close()
          }
        })
      }
    }

    this._type = type
    this._body = body
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

    if (Body.isUnusable(this)) {
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
    return (await this.buffer()).toString()
  }

  // https://fetch.spec.whatwg.org/#dom-body-json
  async json() {
    return JSON.parse(await this.text())
  }
}

// https://fetch.spec.whatwg.org/#body-unusable
exports.isUnusable = function isUsable(body) {
  return body._body !== null && (isReadableStreamDisturbed(body._body) || body._body.locked)
}

// https://fetch.spec.whatwg.org/#concept-body-clone
exports.clone = function clone(body) {
  if (body._body === null) return null

  const [out1, out2] = body._body.tee()

  body._body = out1

  return out2
}
