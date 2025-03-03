import { Trail } from './trail.coffee'

export class TurretBulletTrail extends Trail
  max_lifetime: 5
  max_opacity: 0.5
  min_opacity: 0

  setup: (position) ->
    super(position)
    @velocity.set (Math.random() - 0.5) / 2, (Math.random() - 0.5) / 2, 0
    @mesh.material.color.setRGB(100, 100, 100)

  remove: ->
    super()
    @universe.trails.addToTurretBulletTrailPool this
