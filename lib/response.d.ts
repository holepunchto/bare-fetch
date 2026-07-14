import { type HTTPStatusCode, type HTTPStatusMessage } from 'bare-http1'
import Headers from './headers'
import Body from './body'

type ResponseType = 'basic' | 'cors' | 'default' | 'error' | 'opaque' | 'opaqueredirect'

interface ResponseInit {
  status?: HTTPStatusCode
  statusText?: HTTPStatusMessage
  headers?: Headers
}

interface Response extends Body {
  readonly type: ResponseType
  readonly url: string | null
  readonly redirected: boolean
  readonly status: HTTPStatusCode
  readonly ok: boolean
  readonly statusText: HTTPStatusMessage
  readonly headers: Headers
}

declare class Response {
  constructor(body: unknown, init?: ResponseInit)
}

export = Response
