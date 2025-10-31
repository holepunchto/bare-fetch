module.exports = class FetchError extends Error {
  constructor(msg, fn = FetchError, code = fn.name, opts = {}) {
    if (typeof code === 'object' && code !== null) {
      opts = code
      code = fn.name
    }

    super(`${code}: ${msg}`, opts)

    this.code = code

    if (Error.captureStackTrace) Error.captureStackTrace(this, fn)
  }

  get name() {
    return 'FetchError'
  }

  static INVALID_URL(msg, cause) {
    return new FetchError(msg, FetchError.INVALID_URL, { cause })
  }

  static NETWORK_ERROR(msg, cause) {
    return new FetchError(msg, FetchError.NETWORK_ERROR, { cause })
  }

  static TOO_MANY_REDIRECTS(msg) {
    return new FetchError(msg, FetchError.TOO_MANY_REDIRECTS)
  }

  static UNKNOWN_PROTOCOL(msg) {
    return new FetchError(msg, FetchError.UNKNOWN_PROTOCOL)
  }

  static BODY_UNUSABLE(msg) {
    return new FetchError(msg, FetchError.BODY_UNUSABLE)
  }
}
