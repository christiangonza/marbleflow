import { ArcTrack, type ArcTrackOptions } from './ArcTrack'

export type CurveOptions = Omit<ArcTrackOptions, 'color'> & { color?: string }

export class Curve extends ArcTrack {
  constructor(options: CurveOptions) {
    super('curve', { color: '#38bdf8', ...options })
  }
}
