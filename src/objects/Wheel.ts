import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, lightenColor } from '../utils/color'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { ActionTarget } from '../logic/types'

export interface WheelOptions {
  position: { x: number; y: number }
  radius: number
  spinSpeed?: number
  color?: string
  id?: string
}

const SPIN_SPEED_DEFAULT = 0.25

/** A wheel pinned in place (via a point constraint) that marbles can roll across; spins when triggered. */
export class Wheel extends PhysicsObject implements ActionTarget {
  radius: number
  color: string
  spinSpeed: number

  private pin: Matter.Constraint
  private spinning = false

  constructor(options: WheelOptions) {
    const body = Matter.Bodies.circle(options.position.x, options.position.y, options.radius, {
      friction: 0.6,
      label: 'wheel',
    })

    super(options.id ?? generateId('wheel'), 'wheel', body)

    this.radius = options.radius
    this.color = options.color ?? '#a3a3a3'
    this.spinSpeed = options.spinSpeed ?? SPIN_SPEED_DEFAULT
    this.pin = Matter.Constraint.create({ pointA: { x: options.position.x, y: options.position.y }, bodyB: body, length: 0, stiffness: 1 })
  }

  onAddedToWorld(world: PhysicsWorld) {
    Matter.World.add(world.engine.world, this.pin)
  }

  onRemovedFromWorld(world: PhysicsWorld) {
    Matter.World.remove(world.engine.world, this.pin)
  }

  receiveAction() {
    this.spinning = !this.spinning
  }

  /** The pin constraint has its own fixed anchor point, so moving the wheel must drag it along too. */
  moveTo(x: number, y: number) {
    super.moveTo(x, y)
    this.pin.pointA = { x, y }
  }

  updateProperties(patch: { color?: string; spinSpeed?: number }) {
    if (patch.color !== undefined) this.color = patch.color
    if (patch.spinSpeed !== undefined) this.spinSpeed = patch.spinSpeed
  }

  /** The pin constraint references the body directly, so swapping it just means pointing it at the new one. */
  updateGeometry(patch: { radius?: number }) {
    if (patch.radius === undefined || patch.radius === this.radius) return
    this.radius = patch.radius
    const position = { x: this.body.position.x, y: this.body.position.y }
    const newBody = Matter.Bodies.circle(position.x, position.y, this.radius, { friction: 0.6, label: 'wheel' })
    this.setBody(newBody)
    this.pin.bodyB = newBody
    this.commitInitial()
  }

  tick() {
    if (this.spinning) {
      Matter.Body.setAngularVelocity(this.body, this.spinSpeed)
    }
  }

  reset() {
    super.reset()
    this.spinning = false
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

    const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.2, 0, 0, this.radius)
    gradient.addColorStop(0, lightenColor(this.color, 0.25))
    gradient.addColorStop(1, this.color)
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.strokeStyle = darkenColor(this.color, 0.4)
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.strokeStyle = darkenColor(this.color, 0.3)
    ctx.lineWidth = Math.max(1.5, this.radius * 0.1)
    for (let i = 0; i < 4; i++) {
      ctx.save()
      ctx.rotate((Math.PI / 2) * i)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -this.radius * 0.85)
      ctx.stroke()
      ctx.restore()
    }

    ctx.restore()
  }
}
