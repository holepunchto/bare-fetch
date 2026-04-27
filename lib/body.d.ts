import { ReadableStream } from 'bare-stream/web'
import Buffer from 'bare-buffer'
import { FormData, Blob } from 'bare-form-data'
import { URLSearchParams } from 'bare-url'

type JSON = string | number | boolean | JSON[] | { [key: string]: JSON }

interface Body {
  readonly body: ReadableStream
  readonly bodyUsed: boolean

  buffer(): Promise<Buffer>
  bytes(): Promise<Buffer>
  arrayBuffer(): Promise<ArrayBuffer>
  text(): Promise<string>
  json(): Promise<JSON>
  formData(): Promise<FormData>
}

declare class Body {
  private constructor(
    body?:
      | ReadableStream
      | FormData
      | Blob
      | URLSearchParams
      | ArrayBufferView
      | ArrayBuffer
      | string
      | null,
    type?: string | null
  )
}

export = Body
