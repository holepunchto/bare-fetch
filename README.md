# bare-fetch

WHATWG Fetch implementation for Bare.

```
npm i bare-fetch
```

## Usage

```js
const fetch = require('bare-fetch')

const res = await fetch('https://api.restful-api.dev/objects/7')

console.log(await res.text())
```

## API

#### `const response = await fetch(url[, options])`

### `Response`

#### `response.headers`

The response headers.

#### `response.status`

The HTTP status code of the response.

#### `response.redirected`

Whether or not the request has been redirected to a different URL.

#### `response.body`

The response body stream.

#### `response.bodyUsed`

Whether or not the stream has already been consumed.

#### `response.buffer()`

Consumes the stream and returns a `Buffer`.

#### `response.bytes()`

Consumes the stream and returns a `Uint8Array`.

#### `response.arrayBuffer()`

Consumes the stream and returns an `ArrayBuffer`.

#### `response.text()`

Consumes the stream and returns a UTF-8 string.

#### `response.json() `

Consumes the stream and returns a JSON value.

## License

Apache-2.0
