import type { ComponentDescriptor } from './descriptors'
import type { ConnectionDescriptor } from '../logic/LogicNetwork'

export interface WorldSnapshot {
  objects: ComponentDescriptor[]
  connections: ConnectionDescriptor[]
}

const MAX_HISTORY = 100

/**
 * Whole-scene snapshot history. Simple and robust: every discrete editor
 * action (place, move, rotate, resize, delete, paste, property edit) pushes
 * a full serialized snapshot of every object in the world. Undo/redo just
 * hands back a previous/next snapshot for the caller to rebuild the world
 * from - no per-action diffing or inverse-operation bookkeeping needed.
 */
export class EditorHistory {
  private past: WorldSnapshot[] = []
  private future: WorldSnapshot[] = []
  private current: WorldSnapshot

  constructor(initial: WorldSnapshot) {
    this.current = initial
  }

  push(snapshot: WorldSnapshot) {
    this.past.push(this.current)
    if (this.past.length > MAX_HISTORY) this.past.shift()
    this.current = snapshot
    this.future = []
  }

  undo(): WorldSnapshot | null {
    const previous = this.past.pop()
    if (!previous) return null
    this.future.unshift(this.current)
    this.current = previous
    return this.current
  }

  redo(): WorldSnapshot | null {
    const next = this.future.shift()
    if (!next) return null
    this.past.push(this.current)
    this.current = next
    return this.current
  }

  get canUndo() {
    return this.past.length > 0
  }

  get canRedo() {
    return this.future.length > 0
  }
}
