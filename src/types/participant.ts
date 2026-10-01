/**
 * A Participant is metadata a marble CAN carry so it can later represent a
 * player/character in a race, without the physics engine ever needing to
 * know about it. Physics (radius, friction, restitution, density) always
 * lives on the Marble's own body config; a Participant only supplies
 * identity/visual data (and future gameplay stats) layered on top.
 *
 * A marble with no participant renders and behaves exactly as before -
 * this is purely additive.
 */
export interface Participant {
  id: string
  name: string
  /** Data URL (or, later, a remote URL) for the avatar image. Optional. */
  image?: string
  color: string
  number?: number
  team?: string
  /** Suggested physics-ish stats a future game mode could read; never applied automatically. */
  speed?: number
  metadata?: Record<string, unknown>
}
