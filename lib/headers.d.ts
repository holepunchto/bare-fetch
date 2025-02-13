interface Headers extends Iterable<[name: string, value: string]> {
  append(name: string, value: string): void
  delete(name: string): void
  get(name: string): string | null
  has(name: string): boolean
  set(name: string, value: string): void
}

declare class Headers {
  constructor(init: Record<string, string>)
}

export = Headers
