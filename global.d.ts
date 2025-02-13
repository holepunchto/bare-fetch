import fetch, { Request, Response, Headers } from '.'

type Fetch = typeof fetch

declare global {
  const fetch: Fetch

  const Request: Request
  const Response: Response
  const Headers: Headers
}
