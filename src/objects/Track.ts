import { StaticBeam, type StaticBeamOptions } from './StaticBeam'

export class Track extends StaticBeam {
  constructor(options: StaticBeamOptions) {
    super('track', 'metal', options)
  }
}
