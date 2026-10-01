import Matter from 'matter-js'
import { PhysicsObject, generateId, type SelectionOutline } from '../physics/PhysicsObject'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { ActionTarget } from '../logic/types'
import { Marble } from './Marble'

export interface WaterZoneOptions {
  position: { x: number; y: number }
  width: number
  height: number
  angle?: number
  flowSpeed?: number
  color?: string
  id?: string
}

export interface WaterZoneGeometryPatch {
  width?: number
  height?: number
  flowSpeed?: number
  color?: string
}

/** A fixed upward push, independent of mass - light marbles float, heavy ones sink, exactly like real buoyancy. */
const BUOYANCY = 0.00028

/** Above this many marbles, water mechanisms skip their decorative particle spray to keep frame time stable. */
export const WATER_REDUCE_MARBLE_COUNT = 30

/**
 * Shared base for every "flowing water" mechanism (River, Waterfall, Hose):
 * a static sensor rectangle that pushes any marble inside it along its own
 * local +x axis and damps/buoys it so it bobs through the current instead
 * of rolling straight across. Forces are plain Matter forces, so a
 * marble's weight (density) already resists the current correctly via
 * F = ma - nothing here special-cases marble mass.
 *
 * Subclasses only differ in defaults, rendering, and optional extra tick
 * behavior (e.g. a waterfall spawning mist at its base).
 */
export abstract class WaterZone extends PhysicsObject implements ActionTarget {
  width: number
  height: number
  flowSpeed: number
  color: string
  flowing = true

  protected waveOffset = 0

  constructor(type: string, options: WaterZoneOptions, defaultColor: string, defaultFlowSpeed: number) {
    const body = Matter.Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, {
      isStatic: true,
      isSensor: true,
      angle: options.angle ?? 0,
      label: type,
    })

    super(options.id ?? generateId(type), type, body)

    this.width = options.width
    this.height = options.height
    this.flowSpeed = options.flowSpeed ?? defaultFlowSpeed
    this.color = options.color ?? defaultColor
  }

  receiveAction() {
    this.flowing = !this.flowing
  }

  updateProperties(patch: WaterZoneGeometryPatch) {
    if (patch.color !== undefined) this.color = patch.color
    if (patch.flowSpeed !== undefined) this.flowSpeed = patch.flowSpeed

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

  /** Subclasses override to add extra per-frame behavior (particles, etc); called once per tick after the physics pass. */
  protected onTick(_deltaMs: number, _world: PhysicsWorld, _reduced: boolean): void {}

  tick(deltaMs: number, world: PhysicsWorld) {
    this.waveOffset += deltaMs * 0.003

    const { position, angle } = this.body
    const forwardX = Math.cos(angle)
    const forwardY = Math.sin(angle)
    let marbleCount = 0

    world.list().forEach((object) => {
      if (!(object instanceof Marble)) return
      marbleCount += 1

      const dx = object.body.position.x - position.x
      const dy = object.body.position.y - position.y
      const cos = Math.cos(-angle)
      const sin = Math.sin(-angle)
      const localX = dx * cos - dy * sin
      const localY = dx * sin + dy * cos
      if (Math.abs(localX) > this.width / 2 || Math.abs(localY) > this.height / 2) return

      // buoyancy: fixed force, so it matters relatively less for heavier marbles
      Matter.Body.applyForce(object.body, object.body.position, { x: 0, y: -BUOYANCY })

      // gentle drag so marbles bob through the water instead of rolling straight across
      const damping = Math.min(1, deltaMs / 260)
      Matter.Body.setVelocity(object.body, {
        x: object.body.velocity.x * (1 - damping * 0.3),
        y: object.body.velocity.y * (1 - damping * 0.5),
      })

      if (this.flowing) {
        // Like a real river: when the channel points downhill (local +x has a
        // downward world component), gravity adds to the current; pointing
        // uphill resists it. A level channel just flows at its base speed.
        const slope = forwardY
        const slopeMultiplier = 1 + Math.max(0, slope) * 1.8 - Math.max(0, -slope) * 0.6
        const effectiveFlow = this.flowSpeed * slopeMultiplier

        Matter.Body.applyForce(object.body, object.body.position, {
          x: forwardX * effectiveFlow,
          y: forwardY * effectiveFlow,
        })
      }
    })

    this.onTick(deltaMs, world, marbleCount > WATER_REDUCE_MARBLE_COUNT)
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
