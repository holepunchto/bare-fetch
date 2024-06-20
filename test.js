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

  t.is(res.status, 200, 'The Response contains the correct status code')
  t.is(res.headers.get('content-type'), 'text/plain', 'The Response contains the correct header')
  t.is(res.redirected, false, 'The .redirected property confirms that the request has not been redirected')
  t.is(Buffer.compare(bufferSent, bufferReceived), 0, 'The Response contains the correct buffer')
  await t.exception(res.buffer(), /The body of this response has already been consumed./, 'The Response throws the correct error when trying to read its body twice')
  t.is(res.bodyUsed, true, 'The .bodyUsed property tracks the state of the body')

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

  t.is(stringSent, stringReceived, 'The Response returns the correct string')
  await t.exception(res.text(), /The body of this response has already been consumed./, 'The Response throws the correct error when trying to read its body twice')
  t.is(res.bodyUsed, true, 'The .bodyUsed property tracks the state of the body')

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

  t.alike(objectSent, objectReceived, 'The Response returns the correct json')
  await t.exception(res.json(), /The body of this response has already been consumed./, 'The Response throws the correct error when trying to read its body twice')
  t.is(res.bodyUsed, true, 'The .bodyUsed property tracks the state of the body')

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

  t.is(serverRedirectCounter, 1, 'The server redirect counter signals one redirection')
  t.is(lastMessage, stringReceived, 'The Response contains the string obtained from being redirected')
  t.is(res.redirected, true, 'The .redirected property confirms that the request has been redirected')

  server.close()
})

test('errors', async function (t) {
  await t.exception(fetch('htp://localhost:0'), /You need an http or https link/, 'Correct error for invalid protocol')
  await t.exception(fetch('http://lo'), /unknown node or service/, 'Correct error for invalid URL')
  await t.exception(fetch('http://localhost:10000000000'), /INVALID_URL: Invalid URL/, 'Correct error for invalid port')

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

  await t.exception(fetch(`http://localhost:${port}`), /Exceeded 20 redirects./, 'Correct error for recursive redirection')
  t.is(serverRedirectCounter, 21, 'The server redirect counter signals 21 redirections')

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
