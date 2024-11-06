const { Readable } = require('bare-stream')
const Headers = require('./headers')
const errors = require('./errors')

module.exports = class Response {
  constructor () {
    this.headers = new Headers()
    this.body = new Readable()
    this.bodyUsed = false
    this.redirected = false
    this.status = 0
  }

  async buffer () {
    if (this.bodyUsed) throw errors.BODY_ALREADY_CONSUMED('Body has already been consumed')

    this.bodyUsed = true

    const chunks = []

    for await (const chunk of this.body) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }

  async bytes () {
    return this.buffer()
  }

  async arrayBuffer () {
    return (await this.buffer()).buffer
  }

  async text () {
    return (await this.buffer()).toString('utf8')
  }

  async json () {
    return JSON.parse(await this.text())
  }
}
