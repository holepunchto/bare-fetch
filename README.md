# bare-fetch

WHATWG Fetch implementation for <https://github.com/nicolo-ribaudo/tc39-proposal-bare>.

```
npm i bare-fetch
```

## Usage

```js
const fetch = require('bare-fetch')

const res = await fetch('https://example.com/data')

console.log(await res.json())
```

## API

#### `const response = await fetch(input[, init])`

Perform an HTTP or HTTPS request. `input` may be a URL string, a `URL` object, or a `Request` object. `init` is an optional options object.

Options include:

```js
init = {
  body: null,
  method: 'GET',
  headers: new Headers(),
  signal: null,
  agent: null
}
```

Redirects are followed automatically up to a maximum of 20. When crossing origins, the `authorization` header is removed. If `signal` is provided, the request can be aborted using an `AbortController`.

#### `fetch.Request`

The `Request` class. See below.

#### `fetch.Response`

The `Response` class. See below.

#### `fetch.Headers`

The `Headers` class. See below.

### `Request`

#### `const request = new Request(input[, init])`

Create a new request. `input` may be a URL string, a `URL` object, or another `Request` object. `init` is an optional options object, identical to the one accepted by `fetch()`.

#### `request.url`

The request URL as a string.

#### `request.method`

The request method. Standard methods (`GET`, `POST`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`) are uppercased automatically.

#### `request.headers`

The request headers as a `Headers` object.

#### `request.signal`

The abort signal associated with the request, or `null`.

#### `request.body`

The request body as a `ReadableStream`, or `null`.

#### `request.bodyUsed`

Whether the body stream has already been consumed.

#### `request.clone()`

Clone the request. Throws if the body has already been consumed.

### `Response`

#### `response.url`

The final response URL as a string, or `null` if no request has been made.

#### `response.redirected`

Whether the request was redirected to a different URL.

#### `response.status`

The HTTP status code of the response.

#### `response.ok`

Whether the status code is in the range 200-299.

#### `response.statusText`

The HTTP status message of the response.

#### `response.headers`

The response headers as a `Headers` object.

#### `response.body`

The response body as a `ReadableStream`, or `null`.

#### `response.bodyUsed`

Whether the body stream has already been consumed.

#### `response.buffer()`

Consume the body and return a `Buffer`.

#### `response.bytes()`

Consume the body and return a `Uint8Array`.

#### `response.arrayBuffer()`

Consume the body and return an `ArrayBuffer`.

#### `response.text()`

Consume the body and return a UTF-8 string.

#### `response.json()`

Consume the body and return a parsed JSON value.

#### `response.clone()`

Clone the response. Throws if the body has already been consumed.

### `Headers`

#### `const headers = new Headers([init])`

Create a new headers object. `init` may be a plain object, an iterable of `[name, value]` pairs, or another `Headers` instance.

#### `headers.append(name, value)`

Append a value to the header `name`. If the header already exists, the value is added to the existing list.

#### `headers.delete(name)`

Delete the header `name`.

#### `headers.get(name)`

Get the value of the header `name` as a comma-separated string, or `null` if it does not exist.

#### `headers.has(name)`

Return whether the header `name` exists.

#### `headers.set(name, value)`

Set the header `name` to `value`, replacing any existing values.

#### `headers.entries()`

Return an iterator over `[name, value]` pairs.

#### `headers.keys()`

Return an iterator over header names.

#### `headers.values()`

Return an iterator over header values.

#### `headers.forEach(callback[, thisArg])`

Call `callback` for each header with the arguments `(value, name, headers)`.

## License

Apache-2.0
