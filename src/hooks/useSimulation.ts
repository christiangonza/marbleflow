import { useState } from 'react'
import type { PlaybackSpeed, PlaybackStatus } from '../types/editor'

/**
 * Holds only the playback intent (status/speed). The actual PhysicsWorld,
 * the render loop and the per-frame physics stepping live inside WorldCanvas
 * so that ticking the simulation never triggers a React re-render here.
 */
export function useSimulation() {
  const [status, setStatus] = useState<PlaybackStatus>('stopped')
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)

  const play = () => setStatus('playing')
  const pause = () => setStatus('paused')
  const stop = () => setStatus('stopped')

  return { status, speed, setSpeed, play, pause, stop }
}
