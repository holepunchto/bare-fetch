const fetch = require('.')
const http = require('bare-http1')
const test = require('brittle')

test('basic http', async function (t) {
  const server = http.createServer().listen(0)
  await waitForServer(server)
  const { port } = server.address()

  const bufferSent = Buffer.from('This is the correct message.')

  server.on('request', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    })
    res.write(bufferSent)
    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const bufferReceived = await res.buffer()

  t.is(res.status, 200)
  t.is(res.headers.get('content-type'), 'text/plain')
  t.is(res.redirected, false)
  t.is(Buffer.compare(bufferSent, bufferReceived), 0)
  await t.exception(res.buffer(), /The body of this response has already been consumed./)
  t.is(res.bodyUsed, true)

  server.close()
})

test('text method', async function (t) {
  const server = http.createServer().listen(0)
  await waitForServer(server)
  const { port } = server.address()

  const stringSent = 'This is the correct message.'

  server.on('request', (req, res) => {
    res.write(stringSent)
    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const stringReceived = await res.text()

  t.is(stringSent, stringReceived)
  await t.exception(res.text(), /The body of this response has already been consumed./)
  t.is(res.bodyUsed, true)

  server.close()
})

test('json method', async function (t) {
  const server = http.createServer().listen(0)
  await waitForServer(server)
  const { port } = server.address()

  const objectSent = { a: 1, b: 2, c: 3 }
  const jsonSent = JSON.stringify(objectSent)

  server.on('request', (req, res) => {
    res.write(jsonSent)
    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const objectReceived = await res.json()

  t.alike(objectSent, objectReceived)
  await t.exception(res.json(), /The body of this response has already been consumed./)
  t.is(res.bodyUsed, true)

  server.close()
})

test('redirect', async function (t) {
  const server = http.createServer().listen(0)
  await waitForServer(server)
  const { port } = server.address()

  const firstMessage = 'You are being redirected'
  const lastMessage = 'Destination reached'

  let serverRedirectCounter = 0

  server.on('request', (req, res) => {
    if (serverRedirectCounter === 0) {
      res.writeHead(301, {
        location: `http://localhost:${port}`
      })
      res.write(firstMessage)
      serverRedirectCounter++
    } else {
      res.write(lastMessage)
    }
    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const bufferReceived = await res.buffer()
  const stringReceived = bufferReceived.toString()

  t.is(serverRedirectCounter, 1)
  t.is(lastMessage, stringReceived)
  t.is(res.redirected, true)

  server.close()
})

test('errors', async function (t) {
  await t.exception(fetch('htp://localhost:0'), /You need an http or https link/)
  await t.exception(fetch('http://lo'), /unknown node or service/)
  await t.exception(fetch('http://localhost:10000000000'), /INVALID_URL: Invalid URL/)

  const server = http.createServer().listen(0)
  await waitForServer(server)
  const { port } = server.address()

  let serverRedirectCounter = 0

  server.on('request', (req, res) => {
    serverRedirectCounter++
    res.writeHead(301, {
      location: `http://localhost:${port}`
    })

    res.end()
  })

  await t.exception(fetch(`http://localhost:${port}`), /Exceeded 20 redirects./)
  t.is(serverRedirectCounter, 21)

  server.close()
})

function waitForServer (server) {
  return new Promise((resolve, reject) => {
    server.on('listening', done)
    server.on('error', done)

    function done (error) {
      server.removeListener('listening', done)
      server.removeListener('error', done)
      error ? reject(error) : resolve()
    }
  })
}
