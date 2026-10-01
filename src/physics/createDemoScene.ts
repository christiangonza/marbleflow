import { Marble } from '../objects/Marble'
import { Ramp } from '../objects/Ramp'
import { Track } from '../objects/Track'
import { PhysicsWorld } from './PhysicsWorld'

/** Ground + a small ramp + a handful of marbles, so play immediately shows something. */
export function createDemoWorld(): PhysicsWorld {
  const world = new PhysicsWorld()

  world.add(new Track({ position: { x: 40, y: 260 }, length: 640, thickness: 24 }))
  world.add(new Ramp({ position: { x: -140, y: 150 }, length: 280, thickness: 18, angle: -0.32 }))

  const marbleStarts = [
    { x: -230, y: -180 },
    { x: -195, y: -220 },
    { x: -160, y: -150 },
    { x: -240, y: -100 },
  ]

  marbleStarts.forEach((position) => {
    world.add(new Marble({ position, radius: 13 }))
  })

  return world
}
