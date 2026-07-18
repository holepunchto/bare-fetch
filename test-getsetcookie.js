const { Headers } = require('.')

const h = new Headers()
h.append('set-cookie', 'a=1')
h.append('set-cookie', 'b=2')
console.log('get():', h.get('set-cookie'))
console.log('getSetCookie:', typeof h.getSetCookie)
try {
  console.log('getSetCookie():', h.getSetCookie())
} catch (e) {
  console.log('getSetCookie() error:', e.message)
}
