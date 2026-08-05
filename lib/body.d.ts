import { ReadableStream } from 'bare-stream/web'
import Buffer from 'bare-buffer'
import { FormData, Blob } from 'bare-form-data'
import { URLSearchParams } from 'bare-url'

type JSON = string | number | boolean | JSON[] | { [key: string]: JSON }

interface Body {
  /** The body as a `ReadableStream`, or `null`. */
  readonly body: ReadableStream
  /** Whether the body stream has already been consumed. */
  readonly bodyUsed: boolean

  /**
   * @throws {BODY_UNUSABLE} the body has already been consumed.
   */
  buffer(): Promise<Buffer>
  /**
   * @throws {BODY_UNUSABLE} the body has already been consumed.
   */
  bytes(): Promise<Buffer>
  /**
   * @throws {BODY_UNUSABLE} the body has already been consumed.
   */
  arrayBuffer(): Promise<ArrayBuffer>
  /**
   * @throws {BODY_UNUSABLE} the body has already been consumed.
   */
  text(): Promise<string>
  /**
   * @throws {BODY_UNUSABLE} the body has already been consumed.
   */
  json(): Promise<JSON>
  /**
   * @throws {BODY_UNUSABLE} the body has already been consumed.
   * @throws {INVALID_FORM_DATA} the content type is not form data, or the multipart boundary parameter is missing.
   */
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
