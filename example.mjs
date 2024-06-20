import fetch from '.'

const res = await fetch('https://api.restful-api.dev/objects/7')

console.log(await res.text())
