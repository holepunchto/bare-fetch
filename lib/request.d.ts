import { type HTTPMethod, HTTPAgent } from 'bare-http1'
import URL from 'bare-url'
import { AbortSignal } from 'bare-abort-controller'
import Headers from './headers'
import Body from './body'

interface RequestInit {
  /** The request body: a string, buffer, blob, `FormData`, `URLSearchParams`, or `ReadableStream` (default `null`). */
  body?: unknown
  /** The request method (default `'GET'`). */
  method?: HTTPMethod
  /** The request headers (default an empty `Headers`). */
  headers?: Headers
  /** An `AbortSignal` for aborting the request with an `AbortController` (default `null`). */
  signal?: AbortSignal
  /** The HTTP agent to use, or `null` to use the protocol's global agent (default `null`). */
  agent?: HTTPAgent
}

interface Request extends Body {
  /** The request URL as a string. */
  readonly url: string
  /** The request method. Standard methods (`GET`, `POST`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`) are uppercased automatically. */
  readonly method: HTTPMethod
  /** The request headers as a `Headers` object. */
  readonly headers: Headers
  /** The abort signal associated with the request, or `null`. */
  readonly signal: AbortSignal | null
}

declare class Request {
  /**
   * @param input - The URL string, `URL`, or `Request` to base the request on.
   * @param init - Request options, identical to the ones accepted by `fetch()`.
   * @throws {INVALID_URL} `input` is not a valid URL.
   * @throws {BODY_UNUSABLE} `init.body` is a `ReadableStream` that is locked or has already been consumed.
   */
  constructor(input: string | URL | Request, init?: RequestInit)
}

/** Construct a new `Request` from `input`, which may be a URL string, a `URL`, or another `Request`. */
declare namespace Request {
  export { type RequestInit }
}

export = Request
