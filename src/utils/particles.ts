/**
 * Tiny procedural effects layer: impact debris and placement/settle "pulse"
 * rings. Lives entirely outside React - just a module-level array updated
 * and drawn once per animation frame from the canvas render loop, so it
 * never causes a re-render no matter how many effects are on screen.
 */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Pulse {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  maxLife: number
  color: string
}

const MAX_PARTICLES = 140

let particles: Particle[] = []
let pulses: Pulse[] = []

export function spawnImpactBurst(x: number, y: number, color: string, intensity: number, reduced: boolean) {
  const count = reduced ? 2 : Math.round(3 + intensity * 5)
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) break
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
    const speed = (0.6 + Math.random() * 1.4) * (0.6 + intensity)
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.6,
      life: 0,
      maxLife: 260 + Math.random() * 180,
      color,
      size: 1.4 + Math.random() * 1.8,
    })
  }
}

export function spawnPulse(x: number, y: number, maxRadius: number, color: string) {
  pulses.push({ x, y, radius: 0, maxRadius, life: 0, maxLife: 260, color })
}

export function updateEffects(deltaMs: number) {
  particles = particles.filter((particle) => {
    particle.life += deltaMs
    if (particle.life >= particle.maxLife) return false
    particle.x += particle.vx
    particle.y += particle.vy
    particle.vy += 0.05
    return true
  })

  pulses = pulses.filter((pulse) => {
    pulse.life += deltaMs
    if (pulse.life >= pulse.maxLife) return false
    pulse.radius = pulse.maxRadius * (pulse.life / pulse.maxLife)
    return true
  })
}

export function renderEffects(ctx: CanvasRenderingContext2D) {
  particles.forEach((particle) => {
    const t = particle.life / particle.maxLife
    ctx.globalAlpha = 1 - t
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size * (1 - t * 0.5), 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1

  pulses.forEach((pulse) => {
    const t = pulse.life / pulse.maxLife
    ctx.save()
    ctx.globalAlpha = 1 - t
    ctx.strokeStyle = pulse.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  })
}
