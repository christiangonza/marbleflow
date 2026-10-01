import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, lightenColor } from '../utils/color'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { ActionTarget } from '../logic/types'
import { Marble } from './Marble'

export type MagnetPolarity = 'attract' | 'repel'

export interface MagnetOptions {
  position: { x: number; y: number }
  radius?: number
  strength?: number
  polarity?: MagnetPolarity
  color?: string
  id?: string
}

/** Pulls (or pushes) nearby magnetic marbles. Active by default; a connection can toggle it off/on. */
export class Magnet extends PhysicsObject implements ActionTarget {
  radius: number
  strength: number
  polarity: MagnetPolarity
  color: string
  active = true

  constructor(options: MagnetOptions) {
    const radius = options.radius ?? 90
    const body = Matter.Bodies.circle(options.position.x, options.position.y, 16, {
      isStatic: true,
      isSensor: true,
      label: 'magnet',
    })

    super(options.id ?? generateId('magnet'), 'magnet', body)

    this.radius = radius
    this.strength = options.strength ?? 0.0008
    this.polarity = options.polarity ?? 'attract'
    this.color = options.color ?? '#c084fc'
  }

  receiveAction() {
    this.active = !this.active
  }

  updateProperties(patch: { radius?: number; strength?: number; polarity?: MagnetPolarity; color?: string }) {
    if (patch.radius !== undefined) this.radius = patch.radius
    if (patch.strength !== undefined) this.strength = patch.strength
    if (patch.polarity !== undefined) this.polarity = patch.polarity
    if (patch.color !== undefined) this.color = patch.color
  }

  tick(_deltaMs: number, world: PhysicsWorld) {
    if (!this.active) return

    world.list().forEach((object) => {
      if (!(object instanceof Marble) || !object.magnetic) return
      const dx = this.body.position.x - object.body.position.x
      const dy = this.body.position.y - object.body.position.y
      const distance = Math.hypot(dx, dy)
      if (distance > this.radius || distance < 1) return

      const falloff = 1 - distance / this.radius
      const direction = this.polarity === 'attract' ? 1 : -1
      const magnitude = this.strength * falloff * direction
      Matter.Body.applyForce(object.body, object.body.position, { x: (dx / distance) * magnitude, y: (dy / distance) * magnitude })
    })
  }

  containsPoint(x: number, y: number): boolean {
    return Math.hypot(this.body.position.x - x, this.body.position.y - y) <= 16
  }

  getOutline(alpha: number): SelectionOutline {
    const { x, y } = this.interpolated(alpha)
    return { kind: 'circle', x, y, radius: 20 }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, quality: RenderQuality = 'full') {
    const { x, y } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)

    if (this.active && quality === 'full') {
      const fieldColor = this.polarity === 'attract' ? 'rgba(192, 132, 252, 0.28)' : 'rgba(248, 113, 113, 0.22)'
      ctx.strokeStyle = fieldColor
      ctx.lineWidth = 1.5
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath()
        ctx.arc(0, 0, (this.radius / 3) * i, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 16)
    gradient.addColorStop(0, lightenColor(this.color, 0.3))
    gradient.addColorStop(1, this.color)
    ctx.beginPath()
    ctx.arc(0, 0, 16, 0, Math.PI * 2)
    ctx.fillStyle = this.active ? gradient : darkenColor(this.color, 0.5)
    ctx.fill()
    ctx.strokeStyle = darkenColor(this.color, 0.4)
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = 'white'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.polarity === 'attract' ? '+' : '−', 0, 0)

    ctx.restore()
  }
}
