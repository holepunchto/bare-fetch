const test = require('brittle')
const listen = require('listen-async')
const http = require('bare-http1')
const zlib = require('bare-zlib')
const FormData = require('bare-form-data')
const { AbortSignal } = require('bare-abort-controller')
const fetch = require('.')

const { Response, Request, Headers } = fetch

test('basic', async (t) => {
  t.plan(10)

  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = Buffer.from('This is the correct message.')

  server.on('request', (req, res) => {
    const ua = req.headers['user-agent']

    t.comment(ua)
    t.ok(ua)

    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(sent)
  })

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.bytes()

  t.is(res.ok, true)
  t.is(res.url, `http://localhost:${port}/`)
  t.is(res.status, 200)
  t.is(res.statusText, 'OK')
  t.is(res.headers.get('content-type'), 'text/plain')
  t.is(res.redirected, false)
  t.is(res.bodyUsed, true)

  t.alike(sent, received)

  await t.exception(res.bytes(), /BODY_UNUSABLE/)

  server.close()
})

test('text', async (t) => {
  t.plan(3)

  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = 'This is the correct message.'

  server.on('request', (req, res) => {
    res.end(sent)
  })

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.text()

  t.is(sent, received)
  t.is(res.bodyUsed, true)

  await t.exception(res.text(), /BODY_UNUSABLE/)

  server.close()
})

test('json', async (t) => {
  t.plan(3)

  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = { a: 1, b: 2, c: 3 }

  server.on('request', (req, res) => {
    res.end(JSON.stringify(sent))
  })

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.json()

  t.alike(sent, received)
  t.is(res.bodyUsed, true)

  await t.exception(res.json(), /BODY_UNUSABLE/)

  server.close()
})

test('response clone', async (t) => {
  t.plan(2)

  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = 'This is the correct message.'

  server.on('request', (req, res) => res.end(sent))

  const res = await fetch(`http://localhost:${port}`)
  const clone = res.clone()

  t.is(await res.text(), sent)
  t.is(await clone.text(), sent)

  server.close()
})

test('request clone', async (t) => {
  const req = new Request('http://localhost', { body: 'Hello world' })
  const clone = req.clone()

  t.is(await req.text(), 'Hello world')
  t.is(await clone.text(), 'Hello world')
})

test('arrayBuffer', async (t) => {
  t.plan(3)

  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = Buffer.from('This is the correct message.')

  server.on('request', (req, res) => res.end(sent))

  const res = await fetch(`http://localhost:${port}`)

  const received = await res.arrayBuffer()

  const expected = sent.buffer.slice(sent.byteOffset, sent.byteOffset + sent.byteLength)

  t.alike(received, expected)
  t.is(res.bodyUsed, true)

  await t.exception(res.arrayBuffer(), /BODY_UNUSABLE/)

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

test('compression', async (t) => {
  t.plan(4)

  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  const sent = Buffer.from('This is the correct message.')

  server.on('request', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Encoding': 'gzip'
    })

    zlib.gzip(sent, (err, data) => {
      t.absent(err)

      res.end(data)
    })
  })

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.buffer()

  t.is(res.headers.get('content-encoding'), 'gzip')
  t.is(res.bodyUsed, true)

  t.alike(sent, received)

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

test('destroy unconsumed body', async (t) => {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  server.on('request', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('data')
  })

  const agent = new http.Agent()

  for (let i = 0; i < 128; i++) {
    const res = await fetch(`http://localhost:${port}`, { agent })
    await res.body.cancel()
  }

  t.ok([...agent.sockets].length <= 1)

  server.close()
})

test('free connection after redirect', async (t) => {
  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  let redirected = false

  server.on('request', (req, res) => {
    if (!redirected) {
      redirected = true

      res.writeHead(301, { location: `http://localhost:${port}/dest` })
      res.end('redirecting')
    } else {
      res.end('ok')
    }
  })

  const agent = new http.Agent()

  for (let i = 0; i < 128; i++) {
    const res = await fetch(`http://localhost:${port}`, { agent })
    await res.buffer()
  }

  t.ok([...agent.sockets].length <= 1)

  server.close()
})

test('signal', async (t) => {
  t.plan(2)

  const server = http.createServer()
  await listen(server, 0)

  const { port } = server.address()

  await t.exception(
    fetch(`http://localhost:${port}`, { signal: AbortSignal.abort(new Error('boom!')) }),
    /boom!/
  )

  await t.exception(
    fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(100) }),
    /TimeoutError/
  )

  server.close()
})

test('suspend agent', async (t) => {
  const server = http.createServer((req, res) => res.end())
  await listen(server, 0)

  const { port } = server.address()

  const agent = new http.Agent()
  agent.suspend()

  const res = fetch(`http://localhost:${port}`, { agent })

  agent.resume()
  await t.execution(res)

  server.close()
})

test('response constructor', async (t) => {
  const res = new Response(null, { status: 123 })

  t.is(res.body, null)
  t.is(res.status, 123)
})

test('response constructor, string body', async (t) => {
  const res = new Response('response')

  t.is(await res.text(), 'response')
})

test('response constructor, buffer body', async (t) => {
  const res = new Response(Buffer.from('response'))

  t.is(await res.text(), 'response')
})

test('response constructor, uint8array body', async (t) => {
  const res = new Response(Uint8Array.from([1, 2, 3, 4]))

  t.alike(await res.buffer(), Buffer.from([1, 2, 3, 4]))
})

test('response constructor, arraybuffer body', async (t) => {
  const res = new Response(Uint8Array.from([1, 2, 3, 4]).buffer)

  t.alike(await res.buffer(), Buffer.from([1, 2, 3, 4]))
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

test('normalize method to uppercase', async (t) => {
  const req = new Request('https://example.com', { method: 'post' })
  t.is(req.method, 'POST')

  const req2 = new Request('https://example.com', { method: 'get' })
  t.is(req2.method, 'GET')

  const req3 = new Request('https://example.com', { method: 'delete' })
  t.is(req3.method, 'DELETE')

  const req4 = new Request('https://example.com', { method: 'PATCH' })
  t.is(req4.method, 'PATCH')
})

test('headers iterator methods', async (t) => {
  const headers = new Headers({
    'Content-Type': 'text/plain',
    Accept: 'application/json'
  })

  t.alike(
    [...headers.entries()],
    [
      ['accept', 'application/json'],
      ['content-type', 'text/plain']
    ]
  )
  t.alike([...headers.keys()], ['accept', 'content-type'])
  t.alike([...headers.values()], ['application/json', 'text/plain'])

  const result = []
  headers.forEach((value, name) => result.push([name, value]))
  t.alike(result, [
    ['accept', 'application/json'],
    ['content-type', 'text/plain']
  ])
})
