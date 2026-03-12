import { type HTTPMethod, HTTPAgent } from 'bare-http1'
import URL from 'bare-url'
import { AbortSignal } from 'bare-abort-controller'
import Headers from './headers'
import Body from './body'

interface RequestInit {
  body?: unknown
  method?: HTTPMethod
  headers?: Headers
  signal?: AbortSignal
  agent?: HTTPAgent
}

interface Request extends Body {
  readonly url: string
  readonly method: HTTPMethod
  readonly headers: Headers
  readonly signal: AbortSignal | null
}

declare class Request {
  constructor(input: string | URL | Request, init?: RequestInit)
}

declare namespace Request {
  export { type RequestInit }
}

export = Request
