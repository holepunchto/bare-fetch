const { Readable } = require('bare-stream')

module.exports = class ResponseStream extends Readable {
  constructor(response) {
    super()

    this._response = response

    this._response.socket.unref()
  }

  _open(cb) {
    this._response.socket.ref()

    this._response
      .on('data', this._ondata.bind(this))
      .on('end', this._onend.bind(this))
      .on('error', this._onerror.bind(this))

    cb(null)
  }

  _read() {
    this._response.resume()
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
