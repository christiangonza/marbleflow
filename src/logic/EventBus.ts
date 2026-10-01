type Handler = (payload?: unknown) => void

/** Minimal typed pub-sub. One instance per emitting object, not a global singleton. */
export class EventBus {
  private handlers = new Map<string, Set<Handler>>()

  on(type: string, handler: Handler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler)
    return () => this.handlers.get(type)?.delete(handler)
  }

  emit(type: string, payload?: unknown) {
    this.handlers.get(type)?.forEach((handler) => handler(payload))
  }

  clear() {
    this.handlers.clear()
  }
}
