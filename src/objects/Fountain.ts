import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, lightenColor } from '../utils/color'
import { spawnSpray } from '../utils/particles'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { ActionTarget } from '../logic/types'
import { Marble } from './Marble'
import { WATER_REDUCE_MARBLE_COUNT } from './WaterZone'

export interface FountainOptions {
  position: { x: number; y: number }
  radius?: number
  strength?: number
  color?: string
  id?: string
}

export interface FountainPropertyPatch {
  radius?: number
  strength?: number
  color?: string
}

const BASE_RADIUS = 18
const SPRAY_INTERVAL_MS = 70

/** A decorative fountain: a continuous upward spray, with a gentle lift for any marble that lands in its jet. */
export class Fountain extends PhysicsObject implements ActionTarget {
  /** Effect radius - how far the upward lift reaches, separate from the small physical base. */
  radius: number
  strength: number
  color: string
  active = true

  private sprayTimer = 0

  constructor(options: FountainOptions) {
    const body = Matter.Bodies.circle(options.position.x, options.position.y, BASE_RADIUS, {
      isStatic: true,
      isSensor: true,
      label: 'fountain',
    })

    super(options.id ?? generateId('fountain'), 'fountain', body)

    this.radius = options.radius ?? 70
    this.strength = options.strength ?? 0.0012
    this.color = options.color ?? '#67e8f9'
  }

  receiveAction() {
    this.active = !this.active
  }

  updateProperties(patch: FountainPropertyPatch) {
    if (patch.radius !== undefined) this.radius = patch.radius
    if (patch.strength !== undefined) this.strength = patch.strength
    if (patch.color !== undefined) this.color = patch.color
  }

  tick(deltaMs: number, world: PhysicsWorld) {
    if (!this.active) return

    let marbleCount = 0
    world.list().forEach((object) => {
      if (!(object instanceof Marble)) return
      marbleCount += 1
      const dx = object.body.position.x - this.body.position.x
      const dy = object.body.position.y - this.body.position.y
      const distance = Math.hypot(dx, dy)
      if (distance > this.radius) return
      const falloff = 1 - distance / this.radius
      Matter.Body.applyForce(object.body, object.body.position, { x: 0, y: -this.strength * falloff })
    })

    const reduced = marbleCount > WATER_REDUCE_MARBLE_COUNT
    this.sprayTimer += deltaMs
    const interval = reduced ? SPRAY_INTERVAL_MS * 2.5 : SPRAY_INTERVAL_MS
    if (this.sprayTimer < interval) return
    this.sprayTimer = 0
    spawnSpray(this.body.position.x, this.body.position.y - BASE_RADIUS * 0.4, this.color, -Math.PI / 2, Math.PI / 3.5, reduced ? 2 : 5)
  }

  containsPoint(x: number, y: number): boolean {
    return Math.hypot(this.body.position.x - x, this.body.position.y - y) <= BASE_RADIUS
  }

  getOutline(alpha: number): SelectionOutline {
    const { x, y } = this.interpolated(alpha)
    return { kind: 'circle', x, y, radius: BASE_RADIUS + 4 }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, quality: RenderQuality = 'full') {
    const { x, y } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)

    if (this.active && quality === 'full') {
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.25)'
      ctx.lineWidth = 1.5
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath()
        ctx.arc(0, 0, (this.radius / 2) * i, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // base/pool
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, BASE_RADIUS)
    gradient.addColorStop(0, lightenColor(this.color, 0.3))
    gradient.addColorStop(1, this.color)
    ctx.beginPath()
    ctx.arc(0, 0, BASE_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = this.active ? gradient : darkenColor(this.color, 0.4)
    ctx.fill()
    ctx.strokeStyle = darkenColor(this.color, 0.35)
    ctx.lineWidth = 2
    ctx.stroke()

    // static jet column for a constant "always running" feel
    if (this.active) {
      const jetGradient = ctx.createLinearGradient(0, -BASE_RADIUS * 2, 0, 0)
      jetGradient.addColorStop(0, 'rgba(255,255,255,0)')
      jetGradient.addColorStop(1, lightenColor(this.color, 0.4))
      ctx.fillStyle = jetGradient
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.moveTo(-3, 0)
      ctx.lineTo(3, 0)
      ctx.lineTo(1.5, -BASE_RADIUS * 2)
      ctx.lineTo(-1.5, -BASE_RADIUS * 2)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }
}
