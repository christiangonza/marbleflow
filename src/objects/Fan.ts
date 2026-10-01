import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor } from '../utils/color'
import { roundRect } from '../utils/canvasShapes'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { ActionTarget } from '../logic/types'

export interface FanOptions {
  position: { x: number; y: number }
  width: number
  height: number
  angle?: number
  strength?: number
  color?: string
  id?: string
}

/** Blows a directional force on marbles in a cone in front of it while active. */
export class Fan extends PhysicsObject implements ActionTarget {
  width: number
  height: number
  strength: number
  color: string

  private blowing = false
  private bladeAngle = 0

  constructor(options: FanOptions) {
    const body = Matter.Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, {
      isStatic: true,
      isSensor: true,
      angle: options.angle ?? 0,
      label: 'fan',
    })

    super(options.id ?? generateId('fan'), 'fan', body)

    this.width = options.width
    this.height = options.height
    this.strength = options.strength ?? 0.0006
    this.color = options.color ?? '#38bdf8'
  }

  receiveAction() {
    this.blowing = !this.blowing
  }

  updateProperties(patch: { width?: number; height?: number; color?: string; strength?: number }) {
    if (patch.color !== undefined) this.color = patch.color
    if (patch.strength !== undefined) this.strength = patch.strength

    if (patch.width !== undefined || patch.height !== undefined) {
      this.width = patch.width ?? this.width
      this.height = patch.height ?? this.height
      const position = { x: this.body.position.x, y: this.body.position.y }
      const angle = this.body.angle
      const newBody = Matter.Bodies.rectangle(position.x, position.y, this.width, this.height, {
        isStatic: true,
        isSensor: true,
        angle,
        label: 'fan',
      })
      this.setBody(newBody)
    }

    this.commitInitial()
  }

  tick(deltaMs: number, world: PhysicsWorld) {
    if (!this.blowing) return
    this.bladeAngle += deltaMs * 0.02

    const angle = this.body.angle
    const forwardX = Math.cos(angle)
    const forwardY = Math.sin(angle)
    const reach = this.height * 4

    world.list().forEach((object) => {
      if (object.type !== 'marble') return
      const dx = object.body.position.x - this.body.position.x
      const dy = object.body.position.y - this.body.position.y
      const along = dx * forwardX + dy * forwardY
      const across = -dx * forwardY + dy * forwardX
      if (along < 0 || along > reach) return
      const spread = this.width / 2 + along * 0.4
      if (Math.abs(across) > spread) return

      const falloff = 1 - along / reach
      Matter.Body.applyForce(object.body, object.body.position, {
        x: forwardX * this.strength * falloff,
        y: forwardY * this.strength * falloff,
      })
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

    ctx.fillStyle = darkenColor(this.color, 0.3)
    roundRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 4)
    ctx.fill()

    // spinning blades
    ctx.save()
    ctx.rotate(this.blowing ? this.bladeAngle : 0)
    ctx.strokeStyle = this.color
    ctx.lineWidth = 2
    const bladeRadius = Math.min(this.width, this.height) * 0.35
    for (let i = 0; i < 3; i++) {
      ctx.save()
      ctx.rotate((Math.PI * 2 * i) / 3)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -bladeRadius)
      ctx.stroke()
      ctx.restore()
    }
    ctx.beginPath()
    ctx.arc(0, 0, bladeRadius * 0.25, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.restore()

    // airflow hint lines when active (skipped under reduced quality)
    if (this.blowing && quality === 'full') {
      ctx.strokeStyle = 'rgba(148, 197, 253, 0.4)'
      ctx.lineWidth = 1.5
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath()
        ctx.moveTo(this.width / 2, i * (this.height / 3))
        ctx.lineTo(this.width / 2 + this.height * 1.4, i * (this.height / 3))
        ctx.stroke()
      }
    }

    ctx.restore()
  }
}
