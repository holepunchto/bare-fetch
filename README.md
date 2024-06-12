# simple-get

Simple http & https fetch function for Bare. It handles redirection from one protocol to the other.

## Usage

The function returns a promise that resolves to a `{ data, status }` object

```js
const get = require('simple-get')

async function main () {
  const res = await get('https://api.restful-api.dev/objects/7')
  console.log(res)
}

main()
```

This will print 

```js
{
  data: '{"id":"7","name":"Apple MacBook Pro 16","data":{"year":2019,"price":1849.99,"CPU model":"Intel Core i9","Hard disk size":"1 TB"}}',
  status: 200
}
```

## License

Apache-2.0