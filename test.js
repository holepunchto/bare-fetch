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

  const sent = Buffer.from('This is the correct message.')

  const port = await createServer(t, (req, res) => {
    const ua = req.headers['user-agent']

    t.comment(ua)
    t.ok(ua)

    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(sent)
  })

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.buffer()

  t.is(res.ok, true)
  t.is(res.url, `http://localhost:${port}/`)
  t.is(res.status, 200)
  t.is(res.statusText, 'OK')
  t.is(res.headers.get('content-type'), 'text/plain')
  t.is(res.redirected, false)
  t.is(res.bodyUsed, true)

  t.alike(sent, received)

  await t.exception(res.buffer(), /BODY_UNUSABLE/)
})

test('server error', async (t) => {
  t.plan(5)

  const port = await createServer(t, (req, res) => {
    res.writeHead(500)
    res.end()
  })

  const res = await fetch(`http://localhost:${port}`)

  t.is(res.ok, false)
  t.is(res.url, `http://localhost:${port}/`)
  t.is(res.status, 500)
  t.is(res.statusText, 'Internal Server Error')
  t.is(res.redirected, false)
})

test('network error', async (t) => {
  t.plan(1)

  const port = await createServer(t, (req, res) => res.destroy())

  await t.exception(fetch(`http://localhost:${port}`), /NETWORK_ERROR/)
})

test('text', async (t) => {
  t.plan(3)

  const sent = 'This is the correct message.'

  const port = await createServer(t, (req, res) => res.end(sent))

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.text()

  t.is(sent, received)
  t.is(res.bodyUsed, true)

  await t.exception(res.text(), /BODY_UNUSABLE/)
})

test('json', async (t) => {
  t.plan(3)

  const sent = { a: 1, b: 2, c: 3 }

  const port = await createServer(t, (req, res) => res.end(JSON.stringify(sent)))

  const res = await fetch(`http://localhost:${port}`)
  const received = await res.json()

  t.alike(sent, received)
  t.is(res.bodyUsed, true)

  await t.exception(res.json(), /BODY_UNUSABLE/)
})

test('arrayBuffer', async (t) => {
  t.plan(3)

  const sent = Buffer.from('This is the correct message.')

  const port = await createServer(t, (req, res) => res.end(sent))

  const res = await fetch(`http://localhost:${port}`)

  const received = await res.arrayBuffer()

  t.alike(received, sent.buffer)
  t.is(res.bodyUsed, true)

  await t.exception(res.arrayBuffer(), /BODY_UNUSABLE/)
})

test('WHATWG URL', async (t) => {
  t.plan(1)

  const port = await createServer(t, (req, res) => {
    res.end()

    t.pass()
  })

  const url = new URL(`http://localhost:${port}`)
  await fetch(url)
})

test('request argument', async (t) => {
  t.plan(2)

  const sent = 'This is the correct message.'

  const port = await createServer(t, (req, res) => {
    t.is(req.headers['cache-control'], 'max-age=604800')

    res.end(sent)
  })

  const headers = new Headers([['Cache-Control', 'max-age=604800']])
  const req = new Request(`http://localhost:${port}`, { headers })

  const res = await fetch(req)
  const received = await res.text()

  t.is(sent, received)
})

test('post string', async (t) => {
  t.plan(1)

  const port = await createServer(t, async (req, res) => {
    req.on('data', (data) => t.alike(data, Buffer.from('message')))
    res.end()
  })

  await fetch(`http://localhost:${port}`, { method: 'POST', body: 'message' })
})

test('post form data', async (t) => {
  t.plan(2)

  const port = await createServer(t, async (req, res) => {
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
})

test('post WHATWG URLSearchParams', async (t) => {
  t.plan(2)

  const port = await createServer(t, async (req, res) => {
    t.is(req.headers['content-type'], 'application/x-www-form-urlencoded;charset=UTF-8')

    req.on('data', (data) => t.alike(data, Buffer.from('a=1')))

    res.end()
  })

  const params = new URLSearchParams()
  params.append('a', '1')

  await fetch(`http://localhost:${port}`, { method: 'POST', body: params })
})

test('redirect', async (t) => {
  t.plan(3)

  let redirects = 0

  const port = await createServer(t, (req, res) => {
    if (redirects < 4) {
      res.writeHead(301, { location: `http://localhost:${port}/${++redirects}` })
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
})

test('redirect, relative location', async (t) => {
  t.plan(3)

  let redirects = 0

  const port = await createServer(t, (req, res) => {
    if (redirects < 4) {
      res.writeHead(301, { location: `/${++redirects}` })
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
})

test('redirect to invalid url', async (t) => {
  t.plan(1)

  const port = await createServer(t, (req, res) => {
    res.writeHead(301, { location: 'htp://localhost:10000000000' })
    res.end()
  })

  await t.exception(fetch(`http://localhost:${port}`), /INVALID_URL/)
})

test('response clone', async (t) => {
  t.plan(2)

  const sent = 'This is the correct message.'

  const port = await createServer(t, (req, res) => res.end(sent))

  const res = await fetch(`http://localhost:${port}`)
  const clone = res.clone()

  t.is(await res.text(), sent)
  t.is(await clone.text(), sent)
})

test('request clone', async (t) => {
  const req = new Request('http://localhost', { body: 'Hello world' })
  const clone = req.clone()

  t.is(await req.text(), 'Hello world')
  t.is(await clone.text(), 'Hello world')
})

test('compression', async (t) => {
  t.plan(4)

  const sent = Buffer.from('This is the correct message.')

  const port = await createServer(t, (req, res) => {
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
})

test('unknown protocol', async (t) => {
  await t.exception(fetch('htp://localhost:0'), /UNKNOWN_PROTOCOL/)
})

test('invalid url', async (t) => {
  await t.exception(fetch('http://localhost:10000000000'), /INVALID_URL/)
})

test('relative url', async (t) => {
  await t.exception(fetch('/some/path'), /INVALID_URL/)
})

test('too many redirects', async (t) => {
  t.plan(1)

  const port = await createServer(t, (req, res) => {
    res.writeHead(301, { location: `http://localhost:${port}` })
    res.end()
  })

  await t.exception(fetch(`http://localhost:${port}`), /TOO_MANY_REDIRECTS/)
})

test('strip auth headers from cross-origin redirects', async (t) => {
  const sub = t.test()
  sub.plan(3)

  const serverA = http.createServer()
  await listen(serverA)
  const { port: portA } = serverA.address()

  const serverB = http.createServer()
  await listen(serverB)
  const { port: portB } = serverB.address()

  serverA.on('request', (req, res) => {
    if (req.url === '/redirect') {
      sub.ok('authorization' in req.headers, 'same-origin')

      res.writeHead(301, { location: `http://localhost:${portB}` })
      res.end()
    } else {
      sub.ok('authorization' in req.headers, 'from client')

      res.writeHead(301, { location: `http://localhost:${portA}/redirect` })
      res.end()
    }
  })

  serverB.on('request', (req, res) => {
    sub.absent('authorization' in req.headers, 'cross-origin')

    res.end()
  })

  await fetch(`http://localhost:${portA}`, { headers: { Authorization: 'Bearer Bare' } })

  await sub

  serverA.close()
  serverB.close()
})

test('destroy unconsumed body', async (t) => {
  t.plan(1)

  const port = await createServer(t, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('data')
  })

  const agent = new http.Agent()

  for (let i = 0; i < 128; i++) {
    const res = await fetch(`http://localhost:${port}`, { agent })
    await res.body.cancel()
  }

  t.ok([...agent.sockets].length <= 1)
})

test('free connection after redirect', async (t) => {
  t.plan(1)

  let redirected = false

  const port = await createServer(t, (req, res) => {
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
})

test('signal', async (t) => {
  t.plan(2)

  const port = await createServer(t)

  await t.exception(
    fetch(`http://localhost:${port}`, { signal: AbortSignal.abort(new Error('boom!')) }),
    /boom!/
  )

  await t.exception(
    fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(100) }),
    /TimeoutError/
  )
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

async function createServer(t, handler) {
  const server = http.createServer(handler)
  t.teardown(() => server.close())

  await listen(server, 0)

  return server.address().port
}
