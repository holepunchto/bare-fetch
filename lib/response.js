const { Readable } = require('bare-stream')
const Headers = require('./headers')

module.exports = class Response {
  constructor () {
    this.headers = new Headers()
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

  arrayBuffer () {
    return this.buffer().then((buffer) => buffer.buffer)
  }

  async text () {
    return (await this.buffer()).toString('utf8')
  }

  async json () {
    return JSON.parse(await this.text())
  }
}
