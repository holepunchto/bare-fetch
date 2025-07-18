const test = require('brittle')
const listen = require('listen-async')
const http = require('bare-http1')
const FormData = require('bare-form-data')
const fetch = require('.')

const { Response, Request } = fetch

test('basic', async (t) => {
  t.plan(8)

  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = Buffer.from('This is the correct message.')

  server.on('request', (req, res) => {
    const ua = req.headers['user-agent']

    t.comment(ua)
    t.ok(ua)

    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.write(sent)
    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.buffer()

  t.is(res.url, `http://localhost:${port}/`)
  t.is(res.status, 200)
  t.is(res.headers.get('content-type'), 'text/plain')
  t.is(res.redirected, false)
  t.is(res.bodyUsed, true)

  t.alike(sent, received)

  await t.exception(res.buffer(), /BODY_UNUSABLE/)

  server.close()
})

test('text', async (t) => {
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

  await t.exception(res.text(), /BODY_UNUSABLE/)

  server.close()
})

test('json', async (t) => {
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

  await t.exception(res.json(), /BODY_UNUSABLE/)

  server.close()
})

test('post form data', async (t) => {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  server.on('request', async (req, res) => {
    const type = req.headers['content-type']

    t.ok(type.startsWith('multipart/form-data'))

    let body = ''

    for await (const chunk of req) {
      body += chunk.toString()
    }

    t.alike(
      body
        .trim()
        .split(/(?:\r\n)+/g)
        .slice(1, -1),
      ['Content-Disposition: form-data; name="text"', 'Hello world']
    )

    res.end()
  })

  const body = new FormData()

  body.append('text', 'Hello world')

  await fetch(`http://localhost:${port}`, { method: 'POST', body })

  server.close()
})

test('redirect', async (t) => {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  let redirects = 0

  server.on('request', (req, res) => {
    if (redirects < 4) {
      res.writeHead(301, {
        location: `http://localhost:${port}/${++redirects}`
      })
      res.write('redirecting')
    } else {
      res.write('redirected')
    }

    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const buf = await res.buffer()

  t.is(res.url, `http://localhost:${port}/4`)
  t.is(res.redirected, true)
  t.is(buf.toString(), 'redirected')

  server.close()
})

test('redirect, relative location', async (t) => {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  let redirects = 0

  server.on('request', (req, res) => {
    if (redirects < 4) {
      res.writeHead(301, {
        location: `/${++redirects}`
      })
      res.write('redirecting')
    } else {
      res.write('redirected')
    }

    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)
  const buf = await res.buffer()

  t.is(res.url, `http://localhost:${port}/4`)
  t.is(res.redirected, true)
  t.is(buf.toString(), 'redirected')

  server.close()
})

test('unknown protocol', async (t) => {
  await t.exception(fetch('htp://localhost:0'), /UNKNOWN_PROTOCOL/)
})

test('invalid url', async (t) => {
  await t.exception(fetch('http://localhost:10000000000'), /INVALID_URL/)
})

test('too many redirects', async (t) => {
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

test('strip auth headers from cross-origin redirects', async (t) => {
  const sub = t.test()
  sub.plan(2)

  const serverA = http.createServer()
  await listen(serverA)
  const { port: portA } = serverA.address()

  const serverB = http.createServer()
  await listen(serverB)
  const { port: portB } = serverB.address()

  serverA.on('request', (req, res) => {
    sub.ok('authorization' in req.headers)

    res.writeHead(301, { location: `http://localhost:${portB}` })
    res.end()
  })

  serverB.on('request', (req, res) => {
    sub.absent('authorization' in req.headers)

    res.end()
  })

  await fetch(`http://localhost:${portA}`, {
    headers: { Authorization: 'Bearer Bare' }
  })

  await sub

  serverA.close()
  serverB.close()
})

test('response constructor', async (t) => {
  const res = new Response('response', { status: 123 })

  t.is(res.status, 123)
  t.is(await res.text(), 'response')
})

test('construct request from existing request', async (t) => {
  const req = new Request('https://example.com', {
    method: 'POST',
    headers: [['content-type', 'text/plain']]
  })

  const clone = new Request(req)

  t.is(clone.url, 'https://example.com/')
  t.is(clone.method, 'POST')
  t.is(clone.headers.get('content-type'), 'text/plain')
})
