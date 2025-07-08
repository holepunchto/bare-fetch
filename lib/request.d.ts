import { type HTTPMethod } from 'bare-http1'
import URL from 'bare-url'
import Headers from './headers'
import Body from './body'

interface RequestInit {
  body?: unknown
  method?: HTTPMethod
  headers?: Headers
}

interface Request extends Body {
  readonly url: string
  readonly method: HTTPMethod
  readonly headers: Headers
}

declare class Request {
  constructor(input: string | URL | Request, init?: RequestInit)
}

declare namespace Request {
  export { type RequestInit }
}

export = Request
