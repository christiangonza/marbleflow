import Matter from 'matter-js'
import { PhysicsObject, generateId, type SelectionOutline } from '../physics/PhysicsObject'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import { EventBus } from '../logic/EventBus'
import type { EventSource } from '../logic/types'

export interface TriggerZoneOptions {
  position: { x: number; y: number }
  width: number
  height: number
  angle?: number
  color?: string
  id?: string
}

/**
 * Shared base for pieces that fire an event when a marble touches them
 * (Sensor, Lever). Detection uses Matter's own collision events - each zone
 * registers its own listener when added to a world and cleans it up when
 * removed, so PhysicsWorld itself never needs to know sensors exist.
 */
export abstract class TriggerZone extends PhysicsObject implements EventSource {
  width: number
  height: number
  color: string

  abstract readonly primaryEvent: string
  protected abstract readonly exitEvent: string

  protected pressed = false
  protected visualProgress = 0
  private bus = new EventBus()
  private occupants = new Set<number>()
  private unsubscribeCollisions: (() => void) | null = null

  constructor(type: string, options: TriggerZoneOptions, defaultColor: string) {
    const body = Matter.Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, {
      isStatic: true,
      isSensor: true,
      angle: options.angle ?? 0,
      label: type,
    })

    super(options.id ?? generateId(type), type, body)

    this.width = options.width
    this.height = options.height
    this.color = options.color ?? defaultColor
  }

  on(type: string, handler: (payload?: unknown) => void) {
    return this.bus.on(type, handler)
  }

  onAddedToWorld(world: PhysicsWorld) {
    const otherBody = (pair: Matter.Pair) => (pair.bodyA === this.body ? pair.bodyB : pair.bodyB === this.body ? pair.bodyA : null)

    const handleStart = (event: Matter.IEventCollision<Matter.Engine>) => {
      event.pairs.forEach((pair) => {
        const other = otherBody(pair)
        if (!other || other.label !== 'marble' || this.occupants.has(other.id)) return
        this.occupants.add(other.id)
        this.pressed = true
        this.bus.emit(this.primaryEvent, { marbleBodyId: other.id })
      })
    }

    const handleEnd = (event: Matter.IEventCollision<Matter.Engine>) => {
      event.pairs.forEach((pair) => {
        const other = otherBody(pair)
        if (!other || other.label !== 'marble') return
        this.occupants.delete(other.id)
        if (this.occupants.size === 0) this.pressed = false
        this.bus.emit(this.exitEvent, { marbleBodyId: other.id })
      })
    }

    Matter.Events.on(world.engine, 'collisionStart', handleStart)
    Matter.Events.on(world.engine, 'collisionEnd', handleEnd)
    this.unsubscribeCollisions = () => {
      Matter.Events.off(world.engine, 'collisionStart', handleStart)
      Matter.Events.off(world.engine, 'collisionEnd', handleEnd)
    }
  }

  onRemovedFromWorld() {
    this.unsubscribeCollisions?.()
    this.unsubscribeCollisions = null
    this.occupants.clear()
  }

  tick(deltaMs: number) {
    const target = this.pressed ? 1 : 0
    this.visualProgress += (target - this.visualProgress) * Math.min(1, deltaMs / 120)
  }

  updateProperties(patch: { width?: number; height?: number; color?: string }) {
    if (patch.color !== undefined) this.color = patch.color

    if (patch.width !== undefined || patch.height !== undefined) {
      this.width = patch.width ?? this.width
      this.height = patch.height ?? this.height
      const position = { x: this.body.position.x, y: this.body.position.y }
      const angle = this.body.angle
      const newBody = Matter.Bodies.rectangle(position.x, position.y, this.width, this.height, {
        isStatic: true,
        isSensor: true,
        angle,
        label: this.type,
      })
      this.setBody(newBody)
    }

    this.commitInitial()
  }

  containsPoint(x: number, y: number): boolean {
    const { position, angle } = this.body
    const dx = x - position.x
    const dy = y - position.y
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    const localX = dx * cos - dy * sin
    const localY = dx * sin + dy * cos
    return Math.abs(localX) <= this.width / 2 && Math.abs(localY) <= this.height / 2
  }

  getOutline(alpha: number): SelectionOutline {
    const { x, y, angle } = this.interpolated(alpha)
    return { kind: 'rect', x, y, angle, length: this.width, thickness: this.height }
  }
}
