import { type HTTPStatusCode, type HTTPStatusMessage } from 'bare-http1'
import Headers from './headers'
import Body from './body'

type ResponseType = 'basic' | 'cors' | 'default' | 'error' | 'opaque' | 'opaqueredirect'

interface ResponseInit {
  /** The HTTP status code of the response. */
  status?: HTTPStatusCode
  /** The HTTP status message of the response. */
  statusText?: HTTPStatusMessage
  /** The request headers as a `Headers` object. */
  headers?: Headers
}

interface Response extends Body {
  readonly type: ResponseType
  /** The final response URL as a string, or `null` if no request has been made. */
  readonly url: string | null
  /** Whether the request was redirected to a different URL. */
  readonly redirected: boolean
  readonly status: HTTPStatusCode
  /** Whether the status code is in the range 200-299. */
  readonly ok: boolean
  readonly statusText: HTTPStatusMessage
  /** The response headers as a `Headers` object. */
  readonly headers: Headers
}

declare class Response {
  /**
   * @param body - The response body, or `null` (default `null`).
   * @param init - Options; `status` defaults to `200`, `statusText` to `''`, and `headers` to an
   * empty `Headers`.
   * @throws {BODY_UNUSABLE} `body` is a `ReadableStream` that is locked or has already been
   * consumed.
   */
  constructor(body: unknown, init?: ResponseInit)

  static error(): Response
  static redirect(url: string | URL, status?: HTTPStatusCode): Response
  /**
   * Consume the body and return a parsed JSON value.
   * @throws {BODY_UNUSABLE} the body has already been consumed.
   */
  static json(data: unknown, init?: ResponseInit): Response
}

export = Response
