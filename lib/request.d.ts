import { type HTTPMethod, HTTPAgent } from 'bare-http1'
import URL from 'bare-url'
import { AbortSignal } from 'bare-abort-controller'
import Headers from './headers'
import Body from './body'

type RequestRedirect = 'error' | 'follow' | 'manual'
type RequestCredentials = 'omit' | 'same-origin' | 'include'

interface RequestInit {
  /**
   * The request body: a string, buffer, blob, `FormData`, `URLSearchParams`, or `ReadableStream`
   * (default `null`).
   */
  body?: unknown
  /** The request method (default `'GET'`). */
  method?: HTTPMethod
  /** The request headers (default an empty `Headers`). */
  headers?: Headers
  /** An `AbortSignal` for aborting the request with an `AbortController` (default `null`). */
  signal?: AbortSignal
  /**
   * How fetch handles redirects: follow them, reject the fetch, or return the redirect response
   * (default `'follow'`).
   */
  redirect?: RequestRedirect
  /**
   * Credential mode metadata (default `'same-origin'`). The module has no cookie jar and does not
   * add or remove cookies based on this value.
   */
  credentials?: RequestCredentials
  /** The HTTP agent to use, or `null` to use the protocol's global agent (default `null`). */
  agent?: HTTPAgent
}

interface Request extends Body {
  /** The request URL as a string. */
  readonly url: string
  /**
   * The request method. Standard methods (`GET`, `POST`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`) are
   * uppercased automatically.
   */
  readonly method: HTTPMethod
  /** The request headers as a `Headers` object. */
  readonly headers: Headers
  /** The abort signal associated with the request, or `null`. */
  readonly signal: AbortSignal | null
  /** How fetch handles redirects for this request. */
  readonly redirect: RequestRedirect
  /**
   * Credential mode metadata. The module has no cookie jar and does not add or remove cookies
   * based on this value.
   */
  readonly credentials: RequestCredentials
}

declare class Request {
  /**
   * @param input - The URL string, `URL`, or `Request` to base the request on.
   * @param init - Request options, identical to the ones accepted by `fetch()`.
   * @throws {INVALID_URL} `input` is not a valid URL.
   * @throws {BODY_UNUSABLE} `init.body` is a `ReadableStream` that is locked or has already been
   * consumed.
   * @throws {INVALID_REDIRECT} `init.redirect` is not `'follow'`, `'error'`, or `'manual'`.
   * @throws {INVALID_CREDENTIALS} `init.credentials` is not `'omit'`, `'same-origin'`, or
   * `'include'`.
   */
  constructor(input: string | URL | Request, init?: RequestInit)
}

declare namespace Request {
  export { type RequestCredentials, type RequestInit, type RequestRedirect }
}

export = Request
