const get = require('.')

async function main () {
  const res = await get('https://api.restful-api.dev/objects/7')
  console.log(res)
}

main()
