interface Headers extends Iterable<[name: string, value: string]> {
  append(name: string, value: string): void
  delete(name: string): void
  get(name: string): string | null
  has(name: string): boolean
  set(name: string, value: string): void
  entries(): IterableIterator<[name: string, value: string]>
  keys(): IterableIterator<string>
  values(): IterableIterator<string>
  forEach(callback: (value: string, name: string, headers: Headers) => void, thisArg?: any): void
}

declare class Headers {
  constructor(init?: Record<string, string> | Iterable<[string, string]>)
}

export = Headers
