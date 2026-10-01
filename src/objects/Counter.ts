import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor } from '../utils/color'
import { EventBus } from '../logic/EventBus'
import type { ActionTarget, EventSource } from '../logic/types'

export interface CounterOptions {
  position: { x: number; y: number }
  radius?: number
  target?: number
  color?: string
  id?: string
}

/** Increments on every TRIGGER it receives; fires COUNTER_REACHED (and resets) at the target count. */
export class Counter extends PhysicsObject implements EventSource, ActionTarget {
  readonly primaryEvent = 'COUNTER_REACHED'

  radius: number
  target: number
  color: string
  private count = 0
  private bus = new EventBus()

  constructor(options: CounterOptions) {
    const radius = options.radius ?? 22
    const body = Matter.Bodies.circle(options.position.x, options.position.y, radius, {
      isStatic: true,
      isSensor: true,
      label: 'counter',
    })

    super(options.id ?? generateId('counter'), 'counter', body)

    this.radius = radius
    this.target = options.target ?? 5
    this.color = options.color ?? '#fb923c'
  }

  on(type: string, handler: (payload?: unknown) => void) {
    return this.bus.on(type, handler)
  }

  receiveAction() {
    this.count += 1
    if (this.count >= this.target) {
      this.count = 0
      this.bus.emit('COUNTER_REACHED')
    }
  }

  updateProperties(patch: { target?: number; color?: string }) {
    if (patch.target !== undefined) this.target = patch.target
    if (patch.color !== undefined) this.color = patch.color
  }

  updateGeometry(patch: { radius?: number }) {
    if (patch.radius === undefined || patch.radius === this.radius) return
    this.radius = patch.radius
    const position = { x: this.body.position.x, y: this.body.position.y }
    const newBody = Matter.Bodies.circle(position.x, position.y, this.radius, {
      isStatic: true,
      isSensor: true,
      label: 'counter',
    })
    this.setBody(newBody)
    this.commitInitial()
  }

  reset() {
    super.reset()
    this.count = 0
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
    const progress = this.count / this.target

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
    ctx.fillText(`${this.count}/${this.target}`, 0, 0)

    ctx.restore()
  }
}
