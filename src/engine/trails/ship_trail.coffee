import { Trail } from './trail.coffee'

export class ShipTrail extends Trail
  max_lifetime: 30
  max_opacity: 1
  min_opacity: 0

  setup: (position) ->
    super(position)
    @velocity.set (Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4, 0
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)

  remove: ->
    super()
    @universe.trails.addToShipTrailPool this
