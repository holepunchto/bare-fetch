import fetch, { Request, Response, Headers } from '.'

/** The type of the `fetch` function, used to type the global `fetch`. */
type Fetch = typeof fetch

declare global {
  /**
   * Perform an HTTP or HTTPS request. `input` may be a URL string, a `URL` object, or a `Request`
   * object. `init` is an optional options object.
   * @param input - The URL string, `URL`, or `Request` to fetch.
   * @param init - Request options; `body`, `signal`, and `agent` default to `null`, `method` to
   * `'GET'`, and `headers` to an empty `Headers`.
   * @returns A promise that resolves with the `Response` once the response headers arrive.
   * @throws {INVALID_URL} `input` or a redirect `Location` is not a valid URL.
   * @throws {UNKNOWN_PROTOCOL} the URL protocol is neither `http:` nor `https:`.
   * @throws {TOO_MANY_REDIRECTS} more than 20 redirects were followed.
   * @throws {NETWORK_ERROR} the underlying request failed or the connection was lost.
   */
  const fetch: Fetch

  /**
   * Construct a new `Request` from `input`, which may be a URL string, a `URL`, or another
   * `Request`.
   */
  const Request: Request
  /** Construct a new `Response` wrapping `body`. */
  const Response: Response
  /** Construct a new `Headers` collection, optionally initialized from `init`. */
  const Headers: Headers
}
