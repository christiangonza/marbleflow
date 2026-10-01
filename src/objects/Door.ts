import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, lightenColor } from '../utils/color'
import { roundRect } from '../utils/canvasShapes'
import { EventBus } from '../logic/EventBus'
import type { EventSource, ActionTarget } from '../logic/types'

export interface DoorOptions {
  position: { x: number; y: number }
  width: number
  height: number
  angle?: number
  color?: string
  autoCloseMs?: number
  id?: string
}

/**
 * A gate that blocks marbles when closed and lets them through when open.
 * Implements both roles: an ActionTarget (something else opens it) and an
 * EventSource (DOOR_OPEN/DOOR_CLOSE can themselves feed another connection).
 */
export class Door extends PhysicsObject implements EventSource, ActionTarget {
  readonly primaryEvent = 'DOOR_OPEN'

  width: number
  height: number
  color: string
  autoCloseMs: number

  private bus = new EventBus()
  private isOpen = false
  private closeCountdown: number | null = null
  private visualProgress = 0

  constructor(options: DoorOptions) {
    const body = Matter.Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, {
      isStatic: true,
      angle: options.angle ?? 0,
      label: 'door',
    })

    super(options.id ?? generateId('door'), 'door', body)

    this.width = options.width
    this.height = options.height
    this.color = options.color ?? '#ef4444'
    this.autoCloseMs = options.autoCloseMs ?? 2000
  }

  on(type: string, handler: (payload?: unknown) => void) {
    return this.bus.on(type, handler)
  }

  receiveAction(action: string) {
    if (action === 'CLOSE') {
      this.close()
    } else {
      this.open()
    }
  }

  private open() {
    if (!this.isOpen) {
      this.isOpen = true
      this.body.isSensor = true
      this.bus.emit('DOOR_OPEN')
    }
    this.closeCountdown = this.autoCloseMs
  }

  private close() {
    if (this.isOpen) this.bus.emit('DOOR_CLOSE')
    this.isOpen = false
    this.body.isSensor = false
    this.closeCountdown = null
  }

  updateProperties(patch: { width?: number; height?: number; color?: string; autoCloseMs?: number }) {
    if (patch.color !== undefined) this.color = patch.color
    if (patch.autoCloseMs !== undefined) this.autoCloseMs = patch.autoCloseMs

    if (patch.width !== undefined || patch.height !== undefined) {
      this.width = patch.width ?? this.width
      this.height = patch.height ?? this.height
      const position = { x: this.body.position.x, y: this.body.position.y }
      const angle = this.body.angle
      const newBody = Matter.Bodies.rectangle(position.x, position.y, this.width, this.height, {
        isStatic: true,
        isSensor: this.isOpen,
        angle,
        label: 'door',
      })
      this.setBody(newBody)
    }

    this.commitInitial()
  }

  tick(deltaMs: number) {
    if (this.closeCountdown !== null) {
      this.closeCountdown -= deltaMs
      if (this.closeCountdown <= 0) this.close()
    }
    const target = this.isOpen ? 1 : 0
    this.visualProgress += (target - this.visualProgress) * Math.min(1, deltaMs / 150)
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

  render(ctx: CanvasRenderingContext2D, alpha: number, _quality?: RenderQuality) {
    const { x, y, angle } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    // frame
    ctx.strokeStyle = darkenColor(this.color, 0.5)
    ctx.lineWidth = 2
    roundRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 3)
    ctx.stroke()

    // panel slides up into the frame as it opens
    const liftHeight = this.height * this.visualProgress
    const panelHeight = this.height - liftHeight
    if (panelHeight > 0.5) {
      const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2)
      gradient.addColorStop(0, lightenColor(this.color, 0.25))
      gradient.addColorStop(1, this.color)
      ctx.fillStyle = gradient
      roundRect(ctx, -this.width / 2, this.height / 2 - panelHeight, this.width, panelHeight, 2)
      ctx.fill()
    }

    ctx.restore()
  }
}
