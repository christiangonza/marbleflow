import { StaticBeam, type StaticBeamOptions } from './StaticBeam'

export class Ramp extends StaticBeam {
  constructor(options: StaticBeamOptions) {
    super('ramp', 'madera', options)
  }
}
