import Headers from './lib/headers'
import Request, { type RequestInit } from './lib/request'
import Response from './lib/response'

declare function fetch(input: string, init?: RequestInit): Promise<Response>

declare namespace fetch {
  export { Headers, Request, Response }
}

export = fetch
