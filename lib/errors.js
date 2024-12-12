module.exports = class FetchError extends Error {
  constructor(msg, code, fn = FetchError, cause) {
    super(`${code}: ${msg}`, { cause })
    this.code = code

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, fn)
    }
  }

  get name() {
    return 'FetchError'
  }

  static INVALID_URL(msg, cause) {
    return new FetchError(msg, 'INVALID_URL', FetchError.INVALID_URL, cause)
  }

  static NETWORK_ERROR(msg, cause) {
    return new FetchError(msg, 'NETWORK_ERROR', FetchError.NETWORK_ERROR, cause)
  }

  static TOO_MANY_REDIRECTS(msg) {
    return new FetchError(
      msg,
      'TOO_MANY_REDIRECTS',
      FetchError.TOO_MANY_REDIRECTS
    )
  }

  static UNKNOWN_PROTOCOL(msg) {
    return new FetchError(msg, 'UNKNOWN_PROTOCOL', FetchError.UNKNOWN_PROTOCOL)
  }

  static BODY_UNUSABLE(msg) {
    return new FetchError(msg, 'BODY_UNUSABLE', FetchError.BODY_UNUSABLE)
  }
}
