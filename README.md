# bare-fetch

WHATWG Fetch implementation for Bare.

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

Throws if `method` is not a valid HTTP method or is a forbidden method (`CONNECT`, `TRACE`, `TRACK`). If a body is provided and no `Content-Type` header is set, one is inferred from the body.

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

#### `request.buffer()`

Consume the body and return a `Buffer`.

#### `request.bytes()`

Consume the body and return a `Uint8Array`.

#### `request.arrayBuffer()`

Consume the body and return an `ArrayBuffer`.

#### `request.text()`

Consume the body and return a UTF-8 string.

#### `request.json()`

Consume the body and return a parsed JSON value.

#### `request.formData()`

Consume the body and return a `FormData` object. Supports `multipart/form-data` and `application/x-www-form-urlencoded` content types.

#### `request.clone()`

Clone the request. Throws if the body has already been consumed.

### `Response`

#### `const response = new Response([body][, init])`

Create a new response. `body` may be a string, `Buffer`, `ArrayBuffer`, typed array, `Blob`, `FormData`, `URLSearchParams`, `ReadableStream`, or `null`. `init` is an optional options object.

Options include:

```js
init = {
  status: 200,
  statusText: '',
  headers: new Headers()
}
```

If a body is provided and no `Content-Type` header is set, one is inferred from the body.

#### `Response.error()`

Return a new response representing a network error. Its `type` is `'error'`, `status` is `0`, and body is `null`.

#### `Response.redirect(url[, status])`

Return a new redirect response to `url` with the given `status` (`302` by default). Throws if `url` is invalid or `status` is not a redirect status (`301`, `302`, `303`, `307`, `308`).

#### `Response.json(data[, init])`

Return a new response with `data` serialized to JSON as its body. Sets the `Content-Type` to `application/json` unless `init.headers` already provides one. Throws if `data` cannot be serialized to JSON.

#### `response.type`

The response type: `'basic'` for responses from the network, `'default'` for responses created directly, or `'error'` for network errors.

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

#### `response.formData()`

Consume the body and return a `FormData` object. Supports `multipart/form-data` and `application/x-www-form-urlencoded` content types.

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

#### `headers.getSetCookie()`

Return an array of the values of all `Set-Cookie` headers, in order, without combining them. Unlike `get('set-cookie')`, the values are not joined into a single comma-separated string, since `Set-Cookie` values may themselves contain commas. Returns an empty array if no `Set-Cookie` header is present. The returned array is a copy, so mutating it does not affect the headers.

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
