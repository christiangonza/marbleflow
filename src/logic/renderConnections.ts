import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { LogicNetwork } from './LogicNetwork'

/** Draws a line + arrowhead for every active connection, in world space. */
export function renderConnections(ctx: CanvasRenderingContext2D, network: LogicNetwork, world: PhysicsWorld) {
  const connections = network.list()
  if (connections.length === 0) return

  ctx.save()
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.75)'
  ctx.fillStyle = 'rgba(167, 139, 250, 0.9)'
  ctx.lineWidth = 2

  connections.forEach(({ sourceId, targetId }) => {
    const source = world.get(sourceId)
    const target = world.get(targetId)
    if (!source || !target) return

    const a = source.body.position
    const b = target.body.position

    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()

    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    const headLength = 9
    const midX = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2
    ctx.beginPath()
    ctx.moveTo(midX + Math.cos(angle) * headLength, midY + Math.sin(angle) * headLength)
    ctx.lineTo(midX - Math.cos(angle - 0.45) * headLength, midY - Math.sin(angle - 0.45) * headLength)
    ctx.lineTo(midX - Math.cos(angle + 0.45) * headLength, midY - Math.sin(angle + 0.45) * headLength)
    ctx.closePath()
    ctx.fill()
  })

  ctx.restore()
}
