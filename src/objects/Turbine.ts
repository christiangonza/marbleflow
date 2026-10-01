import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, lightenColor } from '../utils/color'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { ActionTarget } from '../logic/types'
import { Marble } from './Marble'

export interface TurbineOptions {
  position: { x: number; y: number }
  radius?: number
  angle?: number
  boost?: number
  color?: string
  id?: string
}

export interface TurbinePropertyPatch {
  boost?: number
  color?: string
}

/**
 * A current generator: drop one inside a River/pool (or anywhere) and it
 * pushes any marble nearby along the direction it faces, on top of whatever
 * current the water itself already has. Rotate it like any other piece to
 * aim the current; toggle it on/off via a connection.
 */
export class Turbine extends PhysicsObject implements ActionTarget {
  radius: number
  boost: number
  color: string
  active = true

  private spinAngle = 0

  constructor(options: TurbineOptions) {
    const radius = options.radius ?? 26
    const body = Matter.Bodies.circle(options.position.x, options.position.y, radius, {
      isStatic: true,
      isSensor: true,
      angle: options.angle ?? 0,
      label: 'turbine',
    })

    super(options.id ?? generateId('turbine'), 'turbine', body)

    this.radius = radius
    this.boost = options.boost ?? 0.0014
    this.color = options.color ?? '#0891b2'
  }

  receiveAction() {
    this.active = !this.active
  }

  updateProperties(patch: TurbinePropertyPatch) {
    if (patch.boost !== undefined) this.boost = patch.boost
    if (patch.color !== undefined) this.color = patch.color
  }

  updateGeometry(patch: { radius?: number }) {
    if (patch.radius === undefined || patch.radius === this.radius) return
    this.radius = patch.radius
    const position = { x: this.body.position.x, y: this.body.position.y }
    const angle = this.body.angle
    const newBody = Matter.Bodies.circle(position.x, position.y, this.radius, {
      isStatic: true,
      isSensor: true,
      angle,
      label: 'turbine',
    })
    this.setBody(newBody)
    this.commitInitial()
  }

  tick(deltaMs: number, world: PhysicsWorld) {
    if (!this.active) return
    this.spinAngle += deltaMs * 0.02

    const { position, angle } = this.body
    const forwardX = Math.cos(angle)
    const forwardY = Math.sin(angle)
    const reach = this.radius * 2.4

    world.list().forEach((object) => {
      if (!(object instanceof Marble)) return
      const dx = object.body.position.x - position.x
      const dy = object.body.position.y - position.y
      const distance = Math.hypot(dx, dy)
      if (distance > reach) return
      const falloff = 1 - distance / reach
      Matter.Body.applyForce(object.body, object.body.position, {
        x: forwardX * this.boost * falloff,
        y: forwardY * this.boost * falloff,
      })
    })
  }

  containsPoint(x: number, y: number): boolean {
    return Math.hypot(this.body.position.x - x, this.body.position.y - y) <= this.radius
  }

  getOutline(alpha: number): SelectionOutline {
    const { x, y } = this.interpolated(alpha)
    return { kind: 'circle', x, y, radius: this.radius + 4 }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, _quality?: RenderQuality) {
    const { x, y, angle } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.1, 0, 0, this.radius)
    gradient.addColorStop(0, lightenColor(this.color, 0.3))
    gradient.addColorStop(1, this.color)
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.active ? gradient : darkenColor(this.color, 0.4)
    ctx.fill()
    ctx.strokeStyle = darkenColor(this.color, 0.4)
    ctx.lineWidth = 2
    ctx.stroke()

    // spinning blades
    ctx.save()
    ctx.rotate(this.active ? this.spinAngle : 0)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = Math.max(1.5, this.radius * 0.12)
    for (let i = 0; i < 4; i++) {
      ctx.save()
      ctx.rotate((Math.PI / 2) * i)
      ctx.beginPath()
      ctx.moveTo(0, -this.radius * 0.15)
      ctx.lineTo(0, -this.radius * 0.8)
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()

    // current chevron in the facing direction
    if (this.active) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(this.radius * 0.9, -this.radius * 0.35)
      ctx.lineTo(this.radius * 1.3, 0)
      ctx.lineTo(this.radius * 0.9, this.radius * 0.35)
      ctx.stroke()
    }

    ctx.restore()
  }
}
