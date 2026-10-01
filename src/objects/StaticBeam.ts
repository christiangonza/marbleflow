import Matter from 'matter-js'
import { PhysicsObject, generateId, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, lightenColor } from '../utils/color'
import { roundRect } from '../utils/canvasShapes'
import { MATERIAL_PRESETS } from './materials'
import type { MaterialKind } from '../types/editor'

export interface StaticBeamOptions {
  position: { x: number; y: number }
  length: number
  thickness: number
  angle?: number
  friction?: number
  color?: string
  material?: MaterialKind
  id?: string
}

export interface StaticBeamGeometryPatch {
  length?: number
  thickness?: number
  angle?: number
  friction?: number
  color?: string
  material?: MaterialKind
}

/**
 * Shared base for straight, static track pieces (Track, Ramp, and the wall
 * pieces of Tube reuse this pattern). New straight piece types just extend
 * this with their own defaults.
 */
export abstract class StaticBeam extends PhysicsObject {
  length: number
  thickness: number
  friction: number
  color: string
  material: MaterialKind

  constructor(type: string, defaultMaterial: MaterialKind, options: StaticBeamOptions) {
    const material = options.material ?? defaultMaterial
    const preset = MATERIAL_PRESETS[material]
    const friction = options.friction ?? preset.friction
    const color = options.color ?? preset.color

    const body = Matter.Bodies.rectangle(options.position.x, options.position.y, options.length, options.thickness, {
      isStatic: true,
      angle: options.angle ?? 0,
      friction,
      chamfer: { radius: Math.min(6, options.thickness / 2) },
      label: type,
    })

    super(options.id ?? generateId(type), type, body)

    this.length = options.length
    this.thickness = options.thickness
    this.friction = friction
    this.color = color
    this.material = material
  }

  /** Rebuilds the Matter body (length/thickness/friction/material can't be mutated in place). */
  updateGeometry(patch: StaticBeamGeometryPatch) {
    const position = { x: this.body.position.x, y: this.body.position.y }
    const angle = patch.angle ?? this.body.angle

    if (patch.material) {
      const preset = MATERIAL_PRESETS[patch.material]
      this.material = patch.material
      this.friction = patch.friction ?? preset.friction
      this.color = patch.color ?? preset.color
    } else {
      if (patch.friction !== undefined) this.friction = patch.friction
      if (patch.color !== undefined) this.color = patch.color
    }

    this.length = patch.length ?? this.length
    this.thickness = patch.thickness ?? this.thickness

    const newBody = Matter.Bodies.rectangle(position.x, position.y, this.length, this.thickness, {
      isStatic: true,
      angle,
      friction: this.friction,
      chamfer: { radius: Math.min(6, this.thickness / 2) },
      label: this.type,
    })

    this.setBody(newBody)
    this.commitInitial()
  }

  containsPoint(x: number, y: number): boolean {
    const { position, angle } = this.body
    const dx = x - position.x
    const dy = y - position.y
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    const localX = dx * cos - dy * sin
    const localY = dx * sin + dy * cos
    return Math.abs(localX) <= this.length / 2 && Math.abs(localY) <= this.thickness / 2
  }

  getOutline(alpha: number): SelectionOutline {
    const { x, y, angle } = this.interpolated(alpha)
    return { kind: 'rect', x, y, angle, length: this.length, thickness: this.thickness }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number) {
    const { x, y, angle } = this.interpolated(alpha)
    const isNeon = this.material === 'neon'
    const radius = Math.min(6, this.thickness / 2)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    if (isNeon) {
      ctx.shadowColor = this.color
      ctx.shadowBlur = 16
    }

    const gradient = ctx.createLinearGradient(0, -this.thickness / 2, 0, this.thickness / 2)
    gradient.addColorStop(0, lightenColor(this.color, 0.25))
    gradient.addColorStop(1, this.color)

    ctx.fillStyle = gradient
    ctx.strokeStyle = darkenColor(this.color, 0.45)
    ctx.lineWidth = 1.5

    roundRect(ctx, -this.length / 2, -this.thickness / 2, this.length, this.thickness, radius)
    ctx.fill()
    ctx.stroke()

    ctx.shadowBlur = 0
    this.renderMaterialDetail(ctx)

    ctx.restore()
  }

  /** Small per-material flourishes so pieces read as more than plain rectangles. */
  private renderMaterialDetail(ctx: CanvasRenderingContext2D) {
    const halfLength = this.length / 2
    const halfThickness = this.thickness / 2

    if (this.material === 'madera') {
      ctx.strokeStyle = darkenColor(this.color, 0.3)
      ctx.lineWidth = 1
      const grainCount = Math.max(2, Math.floor(this.length / 42))
      for (let i = 1; i < grainCount; i++) {
        const gx = -halfLength + (this.length / grainCount) * i
        ctx.beginPath()
        ctx.moveTo(gx, -halfThickness + 2)
        ctx.lineTo(gx, halfThickness - 2)
        ctx.stroke()
      }
    } else if (this.material === 'metal') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.fillRect(-halfLength + 4, -halfThickness + 2, this.length - 8, Math.max(1, this.thickness * 0.18))

      const rivetCount = Math.max(2, Math.floor(this.length / 55))
      ctx.fillStyle = darkenColor(this.color, 0.5)
      for (let i = 0; i < rivetCount; i++) {
        const rx = -halfLength + (this.length / (rivetCount - 1 || 1)) * i
        ctx.beginPath()
        ctx.arc(rx, 0, Math.min(2.2, this.thickness * 0.14), 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (this.material === 'plastico') {
      const glossGradient = ctx.createLinearGradient(0, -halfThickness, 0, 0)
      glossGradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
      glossGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = glossGradient
      roundRect(ctx, -halfLength + 3, -halfThickness + 2, this.length - 6, this.thickness * 0.4, 3)
      ctx.fill()
    } else if (this.material === 'neon') {
      ctx.strokeStyle = lightenColor(this.color, 0.6)
      ctx.lineWidth = Math.max(1, this.thickness * 0.16)
      ctx.beginPath()
      ctx.moveTo(-halfLength + 6, 0)
      ctx.lineTo(halfLength - 6, 0)
      ctx.stroke()
    }
  }
}
