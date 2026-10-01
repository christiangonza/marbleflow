import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { lightenColor } from '../utils/color'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { ActionTarget } from '../logic/types'
import { Marble } from './Marble'

export interface WaterOptions {
  position: { x: number; y: number }
  width: number
  height: number
  angle?: number
  flowSpeed?: number
  color?: string
  id?: string
}

export interface WaterGeometryPatch {
  width?: number
  height?: number
  flowSpeed?: number
  color?: string
}

/** A fixed upward push, independent of mass - light marbles float, heavy ones sink, exactly like real buoyancy. */
const BUOYANCY = 0.00028

/**
 * A river/pool segment: a static sensor zone that pushes any marble inside
 * it downstream (along its own local +x axis) and damps/buoys it so it
 * bobs through the current instead of just rolling. Forces are plain
 * Matter forces, so heavier marbles (higher density) naturally resist the
 * current more - no special-casing, just F = ma. Toggleable via a
 * connection (TRIGGER flips the current on/off), on by default.
 */
export class Water extends PhysicsObject implements ActionTarget {
  width: number
  height: number
  flowSpeed: number
  color: string
  flowing = true

  private waveOffset = 0

  constructor(options: WaterOptions) {
    const body = Matter.Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, {
      isStatic: true,
      isSensor: true,
      angle: options.angle ?? 0,
      label: 'water',
    })

    super(options.id ?? generateId('water'), 'water', body)

    this.width = options.width
    this.height = options.height
    this.flowSpeed = options.flowSpeed ?? 0.0009
    this.color = options.color ?? '#38bdf8'
  }

  receiveAction() {
    this.flowing = !this.flowing
  }

  updateProperties(patch: WaterGeometryPatch) {
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
        label: 'water',
      })
      this.setBody(newBody)
    }

    this.commitInitial()
  }

  tick(deltaMs: number, world: PhysicsWorld) {
    this.waveOffset += deltaMs * 0.003

    const { position, angle } = this.body
    const forwardX = Math.cos(angle)
    const forwardY = Math.sin(angle)

    world.list().forEach((object) => {
      if (!(object instanceof Marble)) return

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
        Matter.Body.applyForce(object.body, object.body.position, {
          x: forwardX * this.flowSpeed,
          y: forwardY * this.flowSpeed,
        })
      }
    })
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

  render(ctx: CanvasRenderingContext2D, alpha: number, quality: RenderQuality = 'full') {
    const { x, y, angle } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    ctx.save()
    ctx.beginPath()
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height)
    ctx.clip()

    const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2)
    gradient.addColorStop(0, lightenColor(this.color, 0.15))
    gradient.addColorStop(1, this.color)
    ctx.fillStyle = gradient
    ctx.globalAlpha = 0.55
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)

    if (quality === 'full') {
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      const waveSpacing = 26
      const waveCount = Math.ceil(this.width / waveSpacing) + 2
      for (let i = 0; i < waveCount; i++) {
        const baseX = -this.width / 2 + i * waveSpacing - (this.waveOffset * 40) % waveSpacing
        ctx.beginPath()
        for (let t = -this.height / 2; t <= this.height / 2; t += 4) {
          const wobble = Math.sin(t * 0.3 + this.waveOffset * 2) * 4
          const px = baseX + wobble
          if (t === -this.height / 2) ctx.moveTo(px, t)
          else ctx.lineTo(px, t)
        }
        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1
    ctx.restore()

    ctx.strokeStyle = lightenColor(this.color, 0.3)
    ctx.lineWidth = 2
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height)

    ctx.restore()
  }
}
