interface FetchError extends Error {
  readonly code: string
}

declare class FetchError extends Error {
  private constructor()
}

export = FetchError
