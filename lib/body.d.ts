import { ReadableStream } from 'bare-stream/web'
import Buffer from 'bare-buffer'
import { FormData, Blob } from 'bare-form-data'

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
  constructor(
    body:
      | ReadableStream
      | FormData
      | Blob
      | ArrayBufferView
      | ArrayBuffer
      | string
      | null
  )
}

export = Body
