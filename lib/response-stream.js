const { Readable } = require('bare-stream')
const { Gunzip, Inflate } = require('bare-zlib')

module.exports = class ResponseStream extends Readable {
  constructor(response) {
    super()

    this._response = response
    this._response.socket.unref()

    this._decoders = createDecoders(response.headers['content-encoding'])
  }

  _open(cb) {
    if (this._response.socket) this._response.socket.ref()

    const onerror = this._onerror.bind(this)

    let stream = this._response

    for (const decoder of this._decoders) {
      stream.on('error', onerror)
      stream = stream.pipe(decoder)
    }

    stream
      .on('data', this._ondata.bind(this))
      .on('end', this._onend.bind(this))
      .on('error', onerror)

    cb(null)
  }

  _read() {
    this._response.resume()
  }

  _predestroy() {
    this._response.destroy()
  }

  _ondata(data) {
    if (this.push(data) === false) {
      this._response.pause()
    }
  }

  _onend() {
    this.push(null)
  }

  _onerror(err) {
    this.destroy(err)
  }
}

// https://httpwg.org/specs/rfc9110.html#field.content-encoding
function createDecoders(encoding = '') {
  if (Array.isArray(encoding)) encoding = encoding.join(',')

  const codings = encoding
    .toLowerCase()
    .split(',')
    .map((coding) => coding.trim())
    .filter((coding) => coding !== '' && coding !== 'identity')
    .reverse()

  const decoders = []

  for (const coding of codings) {
    if (coding === 'gzip' || coding === 'x-gzip') decoders.push(Gunzip)
    else if (coding === 'deflate') decoders.push(Inflate)
    else return []
  }

  return decoders.map((Decoder) => new Decoder())
}
