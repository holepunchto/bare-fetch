const http = require('http')
const test = require('brittle')
const listen = require('listen-async')
const fetch = require('.')

test('basic http', async function (t) {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = Buffer.from('This is the correct message.')

  server.on('request', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.write(sent)
    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.buffer()

  t.is(res.status, 200)
  t.is(res.headers.get('content-type'), 'text/plain')
  t.is(res.redirected, false)
  t.is(res.bodyUsed, true)

  t.alike(sent, received)

  await t.exception(res.buffer(), /BODY_ALREADY_CONSUMED/)

  server.close()
})

test('text method', async function (t) {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = 'This is the correct message.'

  server.on('request', (req, res) => {
    res.write(sent)
    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.text()

  t.is(sent, received)
  t.is(res.bodyUsed, true)

  await t.exception(res.text(), /BODY_ALREADY_CONSUMED/)

  server.close()
})

test('json method', async function (t) {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = { a: 1, b: 2, c: 3 }

  server.on('request', (req, res) => {
    res.write(JSON.stringify(sent))
    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.json()

  t.alike(sent, received)
  t.is(res.bodyUsed, true)

  await t.exception(res.json(), /BODY_ALREADY_CONSUMED/)

  server.close()
})

test('redirect', async function (t) {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  let redirects = 0

  server.on('request', (req, res) => {
    if (redirects === 0) {
      redirects++

      res.writeHead(301, { location: `http://localhost:${port}` })
      res.write('redirecting')
    } else {
      res.write('redirected')
    }

    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const buf = await res.buffer()

  t.is(redirects, 1)
  t.is(res.redirected, true)
  t.is(buf.toString(), 'redirected')

  server.close()
})

test('unknown protocol', async function (t) {
  await t.exception(fetch('htp://localhost:0'), /UNKNOWN_PROTOCOL/)
})

test('invalid url', async function (t) {
  await t.exception(fetch('http://localhost:10000000000'), /INVALID_URL/)
})

test('too many redirects', async function (t) {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  server.on('request', (req, res) => {
    res.writeHead(301, { location: `http://localhost:${port}` })
    res.end()
  })

  await t.exception(fetch(`http://localhost:${port}`), /TOO_MANY_REDIRECTS/)

  server.close()
})
