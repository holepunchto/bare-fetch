# bare-fetch

Minimal WHATWG Fetch implementation for Bare.

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

Extends `Readable`.

#### `response.buffer()`
Consumes the stream and returns a buffer.

#### `response.arrayBuffer()`
Consumes the stream and returns an array buffer.

#### `response.text()`
Consumes the stream, parses it as utf8 and returns a string.

#### `response.json() `
Consumes the stream, parses it as json and returns a js object.

#### `response.headers`
The headers on the response.

#### `response.body`
The `Readable` stream wrapped by the response.

#### `response.bodyUsed`
A boolean property that tracks whether the stream has already been consumed.

#### `response.status`
The http status code of the response.

#### `response.redirected`
A boolean property that tracks whether the request has been redirected to a different URL.

## License

Apache-2.0
