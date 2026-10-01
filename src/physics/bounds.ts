import type { PhysicsWorld } from './PhysicsWorld'

export interface WorldBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** Axis-aligned bounding box of every object's outline, for "fit circuit to view". */
export function computeWorldBounds(world: PhysicsWorld): WorldBounds | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  world.list().forEach((object) => {
    const outline = object.getOutline(1)
    if (!outline) return

    let halfWidth: number
    let halfHeight: number
    if (outline.kind === 'circle') {
      halfWidth = outline.radius
      halfHeight = outline.radius
    } else if (outline.kind === 'rect') {
      const extent = (Math.abs(outline.length * Math.cos(outline.angle)) + Math.abs(outline.thickness * Math.sin(outline.angle))) / 2
      const extentY = (Math.abs(outline.length * Math.sin(outline.angle)) + Math.abs(outline.thickness * Math.cos(outline.angle))) / 2
      halfWidth = extent
      halfHeight = extentY
    } else {
      halfWidth = outline.radius + outline.thickness / 2
      halfHeight = outline.radius + outline.thickness / 2
    }

    minX = Math.min(minX, outline.x - halfWidth)
    minY = Math.min(minY, outline.y - halfHeight)
    maxX = Math.max(maxX, outline.x + halfWidth)
    maxY = Math.max(maxY, outline.y + halfHeight)
  })

  if (!Number.isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}
