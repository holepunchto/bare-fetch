import { ReadableStream } from 'bare-stream/web'
import Buffer from 'bare-buffer'

type JSON = string | number | boolean | JSON[] | { [key: string]: JSON }

interface Body {
  readonly body: ReadableStream
  readonly bodyUsed: boolean

  buffer(): Promise<Buffer>
  bytes(): Promise<Buffer>
  arrayBuffer(): Promise<ArrayBuffer>
  text(): Promise<string>
  json(): Promise<JSON>
}

declare class Body {
  constructor(body: unknown)
}

declare namespace Body {
  export function extractBody(obj: unknown): ReadableStream | null
  export function fullyReadBody(stream: ReadableStream): Buffer
}

export = Body
