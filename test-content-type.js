const { Request } = require('.')

// Test 1: URLSearchParams body
const params = new URLSearchParams({ foo: 'bar' })
const req1 = new Request('https://example.com', {
  method: 'POST',
  body: params
})
console.log('URLSearchParams content-type:', req1.headers.get('content-type'))
console.log('Has content-type header:', req1.headers.has('content-type'))

// Test 2: string body
const req2 = new Request('https://example.com', {
  method: 'POST',
  body: 'hello'
})
console.log('String body content-type:', req2.headers.get('content-type'))

// Test 3: explicit content-type with URLSearchParams
const req3 = new Request('https://example.com', {
  method: 'POST',
  body: params,
  headers: { 'content-type': 'application/x-www-form-urlencoded' }
})
console.log('Explicit content-type:', req3.headers.get('content-type'))
