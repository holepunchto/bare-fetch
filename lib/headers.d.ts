interface Headers extends Iterable<[name: string, value: string]> {
  /**
   * @param name - The header name.
   * @param value - The value to append to the header.
   * @throws {INVALID_HEADER_NAME} `name` is empty or contains characters that are not valid in a header name.
   * @throws {INVALID_HEADER_VALUE} `value` contains a NUL, CR, or LF character.
   */
  append(name: string, value: string): void
  /**
   * @param name - The header name.
   */
  delete(name: string): void
  /**
   * @param name - The header name.
   */
  get(name: string): string | null
  /**
   * @param name - The header name.
   */
  has(name: string): boolean
  /**
   * @param name - The header name.
   * @param value - The value to set, replacing any existing values.
   * @throws {INVALID_HEADER_NAME} `name` is empty or contains characters that are not valid in a header name.
   * @throws {INVALID_HEADER_VALUE} `value` contains a NUL, CR, or LF character.
   */
  set(name: string, value: string): void
  /** Return an iterator over `[name, value]` pairs. */
  entries(): IterableIterator<[name: string, value: string]>
  /** Return an iterator over header names. */
  keys(): IterableIterator<string>
  /** Return an iterator over header values. */
  values(): IterableIterator<string>
  /**
   * @param callback - Called with `(value, name, headers)` for each header.
   * @param thisArg - The value of `this` inside `callback`.
   */
  forEach(callback: (value: string, name: string, headers: Headers) => void, thisArg?: any): void
}

declare class Headers {
  /**
   * @param init - A plain object of name–value pairs, an iterable of `[name, value]` pairs, or another `Headers` instance.
   */
  constructor(init?: Record<string, string> | Iterable<[string, string]>)
}

export = Headers
