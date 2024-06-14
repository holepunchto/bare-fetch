# bare-fetch

Simple http & https fetch function for Bare. It handles redirection from one protocol to the other.

## Usage

### `fetch(link, [options])`

`link` must be a string containing an http or https url

The `options` object can contain the following fields:

```js
{
  format: "utf8" || "json" // specifies the format the received data should be parsed to.
}
```

The function returns a promise that resolves to a `{ data, headers, status }` object.

If no `format` option is passed, `data` is kept as a buffer.

```js
const fetch = require('bare-fetch')

async function main () {
  const res = await fetch('https://api.restful-api.dev/objects/7')
  console.log(res)
}

main()
```

This will print 

```js
{
  data: <Buffer
    7b 22 69 64 22 3a 22 37 22 2c 22 6e 61 6d 65 22 3a 22 41 70 70 6c 65 20 4d 61
    63 42 6f 6f 6b 20 50 72 6f 20 31 36 22 2c
    ... 89 more
  >,
  headers: {...}
  status: 200
}
```

## License

Apache-2.0