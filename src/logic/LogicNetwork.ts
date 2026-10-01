import type { PhysicsWorld } from '../physics/PhysicsWorld'
import { isActionTarget, isEventSource } from './types'

export interface ConnectionDescriptor {
  id: string
  sourceId: string
  targetId: string
}

interface ActiveConnection extends ConnectionDescriptor {
  unsubscribe: () => void
}

let connectionCounter = 0

/**
 * Wires EventSource -> ActionTarget connections. This is the only "generic"
 * layer of the logic system: it has zero knowledge of what a Sensor or a
 * Door is. It just asks "can this emit events?" / "can this receive
 * actions?" and, if both, subscribes the source's primary event to send a
 * 'TRIGGER' action to the target. New mechanism types need nothing added
 * here - implementing EventSource and/or ActionTarget is enough.
 */
export class LogicNetwork {
  private connections = new Map<string, ActiveConnection>()

  connect(world: PhysicsWorld, sourceId: string, targetId: string): string | null {
    if (sourceId === targetId) return null
    const source = world.get(sourceId)
    const target = world.get(targetId)
    if (!source || !target || !isEventSource(source) || !isActionTarget(target)) return null

    connectionCounter += 1
    const id = `conn-${connectionCounter}-${Date.now().toString(36)}`
    const unsubscribe = source.on(source.primaryEvent, (payload) => target.receiveAction('TRIGGER', payload))
    this.connections.set(id, { id, sourceId, targetId, unsubscribe })
    return id
  }

  disconnect(id: string) {
    const connection = this.connections.get(id)
    if (!connection) return
    connection.unsubscribe()
    this.connections.delete(id)
  }

  /** Called when an object is deleted, so dangling connections don't linger. */
  disconnectAllFor(objectId: string) {
    this.connections.forEach((connection, id) => {
      if (connection.sourceId === objectId || connection.targetId === objectId) this.disconnect(id)
    })
  }

  list(): ConnectionDescriptor[] {
    return Array.from(this.connections.values()).map(({ id, sourceId, targetId }) => ({ id, sourceId, targetId }))
  }

  clear() {
    this.connections.forEach((connection) => connection.unsubscribe())
    this.connections.clear()
  }

  /** Rebuilds every connection against a freshly-instantiated world (used by undo/redo). */
  restore(world: PhysicsWorld, descriptors: ConnectionDescriptor[]) {
    this.clear()
    descriptors.forEach((descriptor) => this.connect(world, descriptor.sourceId, descriptor.targetId))
  }
}
