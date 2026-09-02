interface FetchError extends Error {
  /** The error code identifying the failure. */
  readonly code: string
}

declare class FetchError extends Error {
  /** An error produced by this module, carrying a `code` identifying the failure. */
  private constructor()
}

export = FetchError
