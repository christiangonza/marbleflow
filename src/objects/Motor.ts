import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, lightenColor } from '../utils/color'
import { EventBus } from '../logic/EventBus'
import type { ActionTarget, EventSource } from '../logic/types'

export interface MotorOptions {
  position: { x: number; y: number }
  radius?: number
  color?: string
  id?: string
}

/**
 * A logic relay: something triggers it, it starts running and relays
 * MOTOR_START so a Wheel/Fan/etc wired downstream reacts - the motor itself
 * has no idea what it's driving, it just passes the signal on.
 */
export class Motor extends PhysicsObject implements EventSource, ActionTarget {
  readonly primaryEvent = 'MOTOR_START'

  radius: number
  color: string
  private running = false
  private spinAngle = 0
  private bus = new EventBus()

  constructor(options: MotorOptions) {
    const radius = options.radius ?? 20
    const body = Matter.Bodies.circle(options.position.x, options.position.y, radius, {
      isStatic: true,
      isSensor: true,
      label: 'motor',
    })

    super(options.id ?? generateId('motor'), 'motor', body)

    this.radius = radius
    this.color = options.color ?? '#f43f5e'
  }

  on(type: string, handler: (payload?: unknown) => void) {
    return this.bus.on(type, handler)
  }

  receiveAction() {
    this.running = !this.running
    this.bus.emit(this.running ? 'MOTOR_START' : 'MOTOR_STOP')
  }

  updateProperties(patch: { color?: string }) {
    if (patch.color !== undefined) this.color = patch.color
  }

  updateGeometry(patch: { radius?: number }) {
    if (patch.radius === undefined || patch.radius === this.radius) return
    this.radius = patch.radius
    const position = { x: this.body.position.x, y: this.body.position.y }
    const newBody = Matter.Bodies.circle(position.x, position.y, this.radius, {
      isStatic: true,
      isSensor: true,
      label: 'motor',
    })
    this.setBody(newBody)
    this.commitInitial()
  }

  tick(deltaMs: number) {
    if (this.running) this.spinAngle += deltaMs * 0.01
  }

  containsPoint(x: number, y: number): boolean {
    return Math.hypot(this.body.position.x - x, this.body.position.y - y) <= this.radius
  }

  getOutline(alpha: number): SelectionOutline {
    const { x, y } = this.interpolated(alpha)
    return { kind: 'circle', x, y, radius: this.radius + 4 }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, _quality?: RenderQuality) {
    const { x, y } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)

    const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.1, 0, 0, this.radius)
    gradient.addColorStop(0, lightenColor(this.color, 0.3))
    gradient.addColorStop(1, this.color)
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.strokeStyle = darkenColor(this.color, 0.4)
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.rotate(this.running ? this.spinAngle : 0)
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.lineWidth = 2
    const teeth = 6
    for (let i = 0; i < teeth; i++) {
      ctx.save()
      ctx.rotate((Math.PI * 2 * i) / teeth)
      ctx.beginPath()
      ctx.moveTo(0, -this.radius * 0.35)
      ctx.lineTo(0, -this.radius * 0.7)
      ctx.stroke()
      ctx.restore()
    }
    ctx.beginPath()
    ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fill()

    ctx.restore()
  }
}
