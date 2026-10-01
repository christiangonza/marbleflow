import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, lightenColor } from '../utils/color'
import { roundRect } from '../utils/canvasShapes'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { ActionTarget } from '../logic/types'

export interface PistonOptions {
  position: { x: number; y: number }
  width: number
  height: number
  angle?: number
  force?: number
  color?: string
  id?: string
}

const EXTEND_MS = 140
const RETRACT_MS = 220

/** A block that punches forward along its own axis, shoving nearby marbles. */
export class Piston extends PhysicsObject implements ActionTarget {
  width: number
  height: number
  force: number
  color: string

  private phase: 'idle' | 'extending' | 'retracting' = 'idle'
  private phaseElapsed = 0
  private hasFired = false
  private extension = 0

  constructor(options: PistonOptions) {
    const body = Matter.Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, {
      isStatic: true,
      angle: options.angle ?? 0,
      label: 'piston',
    })

    super(options.id ?? generateId('piston'), 'piston', body)

    this.width = options.width
    this.height = options.height
    this.force = options.force ?? 0.02
    this.color = options.color ?? '#94a3b8'
  }

  receiveAction() {
    this.phase = 'extending'
    this.phaseElapsed = 0
    this.hasFired = false
  }

  updateProperties(patch: { width?: number; height?: number; color?: string; force?: number }) {
    if (patch.color !== undefined) this.color = patch.color
    if (patch.force !== undefined) this.force = patch.force

    if (patch.width !== undefined || patch.height !== undefined) {
      this.width = patch.width ?? this.width
      this.height = patch.height ?? this.height
      const position = { x: this.body.position.x, y: this.body.position.y }
      const angle = this.body.angle
      const newBody = Matter.Bodies.rectangle(position.x, position.y, this.width, this.height, {
        isStatic: true,
        angle,
        label: 'piston',
      })
      this.setBody(newBody)
    }

    this.commitInitial()
  }

  tick(deltaMs: number, world: PhysicsWorld) {
    if (this.phase === 'idle') return

    this.phaseElapsed += deltaMs
    const duration = this.phase === 'extending' ? EXTEND_MS : RETRACT_MS

    if (this.phase === 'extending') {
      this.extension = Math.min(1, this.phaseElapsed / duration)
      if (!this.hasFired && this.extension > 0.5) {
        this.hasFired = true
        this.pushNearbyMarbles(world)
      }
      if (this.extension >= 1) {
        this.phase = 'retracting'
        this.phaseElapsed = 0
      }
    } else {
      this.extension = 1 - Math.min(1, this.phaseElapsed / duration)
      if (this.extension <= 0) {
        this.extension = 0
        this.phase = 'idle'
      }
    }
  }

  private pushNearbyMarbles(world: PhysicsWorld) {
    const angle = this.body.angle
    const forwardX = Math.cos(angle)
    const forwardY = Math.sin(angle)
    const reach = this.width * 1.3

    world.list().forEach((object) => {
      if (object.type !== 'marble') return
      const dx = object.body.position.x - this.body.position.x
      const dy = object.body.position.y - this.body.position.y
      const along = dx * forwardX + dy * forwardY
      const across = -dx * forwardY + dy * forwardX
      if (along < 0 || along > reach || Math.abs(across) > this.height) return
      Matter.Body.applyForce(object.body, object.body.position, { x: forwardX * this.force, y: forwardY * this.force })
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

  render(ctx: CanvasRenderingContext2D, alpha: number, _quality?: RenderQuality) {
    const { x, y, angle } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    // base housing
    ctx.fillStyle = darkenColor(this.color, 0.35)
    roundRect(ctx, -this.width / 2, -this.height / 2, this.width * 0.4, this.height, 3)
    ctx.fill()

    // extending ram
    const ramLength = this.width * 0.6
    const ramOffset = -this.width / 2 + this.width * 0.4 + ramLength * this.extension
    const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2)
    gradient.addColorStop(0, lightenColor(this.color, 0.3))
    gradient.addColorStop(1, this.color)
    ctx.fillStyle = gradient
    ctx.strokeStyle = darkenColor(this.color, 0.5)
    ctx.lineWidth = 1.5
    roundRect(ctx, ramOffset - this.height * 0.35, -this.height * 0.35, this.height * 0.7, this.height * 0.7, 2)
    ctx.fill()
    ctx.stroke()

    ctx.restore()
  }
}
