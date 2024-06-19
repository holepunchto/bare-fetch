const fetch = require('.')

async function main () {
  const res = await fetch('https://api.restful-api.dev/objects/7')
  const text = await res.text()
  console.log(text)
}

main()
