/**
 * The two roles a mechanism can play in the logic network. Nothing in this
 * file (or in LogicNetwork) knows about specific mechanisms - a Sensor and a
 * Counter and a future "Whatever" are all just "something with a primary
 * event" or "something that reacts to an action", full stop.
 */
export interface EventSource {
  /** The event name a Connection fires on. */
  readonly primaryEvent: string
  on(type: string, handler: (payload?: unknown) => void): () => void
}

export interface ActionTarget {
  /** Connections always send 'TRIGGER'; what that means is entirely up to the receiver. */
  receiveAction(action: string, payload?: unknown): void
}

export function isEventSource(value: unknown): value is EventSource {
  const candidate = value as Partial<EventSource> | null
  return !!candidate && typeof candidate.on === 'function' && typeof candidate.primaryEvent === 'string'
}

export function isActionTarget(value: unknown): value is ActionTarget {
  const candidate = value as Partial<ActionTarget> | null
  return !!candidate && typeof candidate.receiveAction === 'function'
}
