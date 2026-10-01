import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor } from '../utils/color'
import { EventBus } from '../logic/EventBus'
import type { ActionTarget, EventSource } from '../logic/types'

export interface TimerOptions {
  position: { x: number; y: number }
  radius?: number
  durationMs?: number
  color?: string
  id?: string
}

/** Counts down and fires TIMER_FINISHED. Auto-starts when played, and a TRIGGER restarts it early. */
export class Timer extends PhysicsObject implements EventSource, ActionTarget {
  readonly primaryEvent = 'TIMER_FINISHED'

  radius: number
  durationMs: number
  color: string
  private remaining: number
  private bus = new EventBus()

  constructor(options: TimerOptions) {
    const radius = options.radius ?? 22
    const body = Matter.Bodies.circle(options.position.x, options.position.y, radius, {
      isStatic: true,
      isSensor: true,
      label: 'timer',
    })

    super(options.id ?? generateId('timer'), 'timer', body)

    this.radius = radius
    this.durationMs = options.durationMs ?? 3000
    this.color = options.color ?? '#2dd4bf'
    this.remaining = this.durationMs
  }

  on(type: string, handler: (payload?: unknown) => void) {
    return this.bus.on(type, handler)
  }

  receiveAction() {
    this.remaining = this.durationMs
  }

  updateProperties(patch: { durationMs?: number; color?: string }) {
    if (patch.durationMs !== undefined) this.durationMs = patch.durationMs
    if (patch.color !== undefined) this.color = patch.color
  }

  updateGeometry(patch: { radius?: number }) {
    if (patch.radius === undefined || patch.radius === this.radius) return
    this.radius = patch.radius
    const position = { x: this.body.position.x, y: this.body.position.y }
    const newBody = Matter.Bodies.circle(position.x, position.y, this.radius, {
      isStatic: true,
      isSensor: true,
      label: 'timer',
    })
    this.setBody(newBody)
    this.commitInitial()
  }

  tick(deltaMs: number) {
    this.remaining -= deltaMs
    if (this.remaining <= 0) {
      this.bus.emit('TIMER_FINISHED')
      this.remaining = this.durationMs
    }
  }

  reset() {
    super.reset()
    this.remaining = this.durationMs
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
    const progress = 1 - Math.max(0, this.remaining) / this.durationMs

    ctx.save()
    ctx.translate(x, y)

    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)'
    ctx.fill()
    ctx.strokeStyle = darkenColor(this.color, 0.3)
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, this.radius - 3, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
    ctx.closePath()
    ctx.fillStyle = this.color
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.font = `bold ${Math.max(10, this.radius * 0.5)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((Math.max(0, this.remaining) / 1000).toFixed(1), 0, 0)

    ctx.restore()
  }
}
