const { ReadableStream, isReadableStream, isReadableStreamDisturbed } = require('bare-stream/web')
const { isURLSearchParams } = require('bare-url')
const { FormData, File, isFormData, isBlob } = require('bare-form-data')
const Headers = require('./headers')
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

  // https://fetch.spec.whatwg.org/#dom-body-formdata
  async formData() {
    const mimeType = getMIMEType(this)

    // 1.
    if (mimeType !== null && mimeType.type === 'multipart' && mimeType.subtype === 'form-data') {
      const body = await this.text()
      const boundary = mimeType.parameters.get('boundary')

      if (boundary === undefined) {
        throw errors.INVALID_FORM_DATA('Missing boundary parameter')
      }

      return parseMultipart(body, boundary)
    }

    // 2.
    if (
      mimeType !== null &&
      mimeType.type === 'application' &&
      mimeType.subtype === 'x-www-form-urlencoded'
    ) {
      const body = await this.text()
      const formData = new FormData()

      for (const [name, value] of new URLSearchParams(body)) {
        formData.append(name, value)
      }

      return formData
    }

    // 3.
    throw errors.INVALID_FORM_DATA('Could not parse content as form data')
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

// https://fetch.spec.whatwg.org/#concept-body-mime-type
function getMIMEType(body) {
  const headers = body._headers

  if (headers === undefined) return null

  return Headers.extractMIMEType(headers)
}

// https://www.rfc-editor.org/rfc/rfc7578
// https://www.rfc-editor.org/rfc/rfc2046#section-5.1
function parseMultipart(input, boundary) {
  const formData = new FormData()

  const delimiter = `\r\n--${boundary}`
  const close = `\r\n--${boundary}--`

  let start = input.indexOf(`--${boundary}`)
  if (start === -1) return formData

  start += `--${boundary}`.length

  while (true) {
    if (input.startsWith('--', start)) break
    if (input.startsWith('\r\n', start)) start += 2

    let end = input.indexOf(delimiter, start)
    if (end === -1) end = input.indexOf(close, start)
    if (end === -1) break

    const part = input.slice(start, end)

    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd === -1) {
      start = end + delimiter.length
      continue
    }

    const headerSection = part.slice(0, headerEnd)
    const body = part.slice(headerEnd + 4)

    const contentDisposition = { name: null, filename: null }
    let contentType = null

    for (const line of headerSection.split('\r\n')) {
      const colon = line.indexOf(':')
      if (colon === -1) continue

      const name = line.slice(0, colon).trim().toLowerCase()
      const value = line.slice(colon + 1).trim()

      if (name === 'content-disposition') {
        contentDisposition.name = getParameter(value, 'name')
        contentDisposition.filename = getParameter(value, 'filename')
      } else if (name === 'content-type') {
        contentType = value
      }
    }

    if (contentDisposition.name === null) {
      start = end + delimiter.length
      continue
    }

    if (contentDisposition.filename !== null) {
      const file = new File([body], contentDisposition.filename, {
        type: contentType || 'application/octet-stream'
      })

      formData.append(contentDisposition.name, file)
    } else {
      formData.append(contentDisposition.name, body)
    }

    start = end + delimiter.length
  }

  return formData
}

function getParameter(header, name) {
  const pattern = new RegExp(`${name}="([^"]*)"|${name}=([^;\\s]*)`, 'i')

  const match = header.match(pattern)
  if (match === null) return null

  return match[1] !== undefined ? match[1] : match[2]
}
