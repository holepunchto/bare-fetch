declare class FetchError extends Error {
  constructor(msg: string, code: string, fn?: FetchError, cause?: unknown)

  static INVALID_URL(msg: string, cause?: unknown): FetchError
  static NETWORK_ERROR(msg: string, cause?: unknown): FetchError
  static TOO_MANY_REDIRECTS(msg: string, cause?: unknown): FetchError
  static UNKNOWN_PROTOCOL(msg: string, cause?: unknown): FetchError
  static BODY_UNUSABLE(msg: string, cause?: unknown): FetchError
}

export = FetchError
