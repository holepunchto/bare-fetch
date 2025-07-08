import URL from 'bare-url'
import Headers from './lib/headers'
import Request, { type RequestInit } from './lib/request'
import Response from './lib/response'

declare function fetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response>

declare namespace fetch {
  export { Headers, Request, Response }
}

export = fetch
