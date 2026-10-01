import { ArcTrack, type ArcTrackOptions } from './ArcTrack'

export type LoopOptions = Omit<ArcTrackOptions, 'color' | 'startAngle' | 'endAngle'> & {
  color?: string
}

export class Loop extends ArcTrack {
  constructor(options: LoopOptions) {
    super('loop', {
      startAngle: 0,
      endAngle: Math.PI * 2,
      segments: options.segments ?? 24,
      color: '#a855f7',
      ...options,
    })
  }
}
