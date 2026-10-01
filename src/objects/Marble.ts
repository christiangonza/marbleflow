import Matter from 'matter-js'
import { PhysicsObject, generateId, type RenderQuality, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, hexToRgba, lightenColor } from '../utils/color'
import { loadImage } from './imageCache'
import type { Participant } from '../types/participant'

const MOTION_BLUR_MIN_SPEED = 3.5

// --- Physics-only config: everything the Matter body actually needs. ---
export interface MarbleOptions {
  position: { x: number; y: number }
  radius?: number
  color?: string
  friction?: number
  restitution?: number
  density?: number
  magnetic?: boolean
  id?: string
  /** Purely cosmetic/identity data - never read by the physics body. */
  participant?: Participant
}

export interface MarblePropertyPatch {
  radius?: number
  color?: string
  friction?: number
  restitution?: number
  magnetic?: boolean
  /** Density - exposed to the UI as "weight". Heavier marbles resist currents/forces more (F = ma). */
  density?: number
  /** null clears the participant and reverts to the plain marble look. */
  participant?: Participant | null
}

const PALETTE = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#c084fc', '#f472b6']
let paletteIndex = 0

export class Marble extends PhysicsObject {
  // Physics body config - this is the entire contract Matter cares about.
  radius: number
  friction: number
  restitution: number
  magnetic: boolean
  /** Density, i.e. weight for a given radius - public so water/presets can read it. */
  density: number

  // Visual/identity layer - render() reads these, physics never does.
  color: string
  participant?: Participant

  constructor(options: MarbleOptions) {
    const radius = options.radius ?? 14
    const friction = options.friction ?? 0.04
    const restitution = options.restitution ?? 0.55
    const density = options.density ?? 0.0018

    const body = Matter.Bodies.circle(options.position.x, options.position.y, radius, {
      friction,
      frictionAir: 0.0008,
      restitution,
      density,
      label: 'marble',
    })

    super(options.id ?? generateId('marble'), 'marble', body)

    this.radius = radius
    this.color = options.color ?? Marble.nextColor()
    this.friction = friction
    this.restitution = restitution
    this.magnetic = options.magnetic ?? true
    this.density = density
    this.participant = options.participant
  }

  static nextColor() {
    const color = PALETTE[paletteIndex % PALETTE.length]
    paletteIndex += 1
    return color
  }

  get mass() {
    return this.body.mass
  }

  updateProperties(patch: MarblePropertyPatch) {
    if (patch.color !== undefined) this.color = patch.color
    if (patch.magnetic !== undefined) this.magnetic = patch.magnetic
    if (patch.participant !== undefined) this.participant = patch.participant ?? undefined

    if (patch.friction !== undefined) {
      this.friction = patch.friction
      this.body.friction = patch.friction
    }
    if (patch.restitution !== undefined) {
      this.restitution = patch.restitution
      this.body.restitution = patch.restitution
    }
    if (patch.density !== undefined) {
      this.density = patch.density
      Matter.Body.setDensity(this.body, patch.density)
    }

    if (patch.radius !== undefined && patch.radius !== this.radius) {
      this.radius = patch.radius
      const position = { x: this.body.position.x, y: this.body.position.y }
      const newBody = Matter.Bodies.circle(position.x, position.y, this.radius, {
        friction: this.friction,
        frictionAir: 0.0008,
        restitution: this.restitution,
        density: this.density,
        label: 'marble',
      })
      this.setBody(newBody)
    }

    this.commitInitial()
  }

  containsPoint(x: number, y: number): boolean {
    return Math.hypot(this.body.position.x - x, this.body.position.y - y) <= this.radius
  }

  getOutline(alpha: number): SelectionOutline {
    const { x, y } = this.interpolated(alpha)
    return { kind: 'circle', x, y, radius: this.radius + 4 }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, quality: RenderQuality = 'full') {
    const { x, y } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)

    if (quality === 'full') {
      const speed = Math.hypot(this.body.velocity.x, this.body.velocity.y)
      if (speed > MOTION_BLUR_MIN_SPEED) {
        const dirX = this.body.velocity.x / speed
        const dirY = this.body.velocity.y / speed
        const trailLength = Math.min(this.radius * 2.4, speed * 1.6)

        const gradient = ctx.createLinearGradient(0, 0, -dirX * trailLength, -dirY * trailLength)
        gradient.addColorStop(0, hexToRgba(this.color, 0.32))
        gradient.addColorStop(1, hexToRgba(this.color, 0))

        ctx.save()
        ctx.strokeStyle = gradient
        ctx.lineWidth = this.radius * 1.2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-dirX * trailLength, -dirY * trailLength)
        ctx.stroke()
        ctx.restore()
      }
    }

    // contact shadow
    ctx.beginPath()
    ctx.ellipse(0, this.radius * 0.8, this.radius * 0.85, this.radius * 0.3, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.fill()

    const avatar = this.participant?.image ? loadImage(this.participant.image) : null
    const avatarReady = !!avatar && avatar.complete && avatar.naturalWidth > 0

    if (avatarReady && avatar) {
      // circular avatar texture, clipped to the marble's own radius - the
      // physics body never changes shape, only what's drawn on top of it
      ctx.save()
      ctx.beginPath()
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2)
      ctx.clip()
      const size = this.radius * 2
      ctx.drawImage(avatar, -this.radius, -this.radius, size, size)
      ctx.restore()

      ctx.lineWidth = Math.max(1.5, this.radius * 0.14)
      ctx.strokeStyle = this.participant?.color ?? this.color
      ctx.beginPath()
      ctx.arc(0, 0, this.radius - ctx.lineWidth / 2, 0, Math.PI * 2)
      ctx.stroke()

      if (this.participant?.number !== undefined) {
        const badgeRadius = this.radius * 0.42
        ctx.beginPath()
        ctx.arc(this.radius * 0.6, this.radius * 0.6, badgeRadius, 0, Math.PI * 2)
        ctx.fillStyle = this.participant.color
        ctx.fill()
        ctx.fillStyle = 'white'
        ctx.font = `bold ${Math.max(8, badgeRadius * 1.1)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(this.participant.number), this.radius * 0.6, this.radius * 0.6 + 1)
      }
    } else {
      // glossy body (the default look - unchanged when there's no participant/image)
      const gradient = ctx.createRadialGradient(
        -this.radius * 0.35,
        -this.radius * 0.35,
        this.radius * 0.15,
        0,
        0,
        this.radius,
      )
      gradient.addColorStop(0, lightenColor(this.color, 0.5))
      gradient.addColorStop(0.55, this.color)
      gradient.addColorStop(1, darkenColor(this.color, 0.35))

      ctx.beginPath()
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      ctx.lineWidth = 1
      ctx.strokeStyle = darkenColor(this.color, 0.5)
      ctx.stroke()

      // highlight
      ctx.beginPath()
      ctx.ellipse(-this.radius * 0.32, -this.radius * 0.38, this.radius * 0.28, this.radius * 0.18, -0.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.fill()
    }

    ctx.restore()
  }
}
