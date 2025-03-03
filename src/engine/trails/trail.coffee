import { Movable } from '../movable.coffee'

export class Trail extends Movable
  HIDDEN_Z = 2000
  GEOMETRY = new THREE.SphereGeometry 1

  solid: false

  constructor: (options) ->
    super(options)
    @opacity_step = (@max_opacity - @min_opacity) / @max_lifetime

  buildMesh: ->
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh GEOMETRY, material

  setup: (position) ->
    @position.set position.x, position.y, position.z - 10
    @lifetime = @max_lifetime
    @alive = true
    @mesh.material.opacity = @max_opacity

  remove: ->
    @alive = false
    @position.z = HIDDEN_Z

  step: ->
    if @alive
      if @lifetime > 0
        @position.addSelf @velocity
        @mesh.material.opacity -= @opacity_step
        @lifetime--
      else
        @remove()

  handleCollision: (other) ->
    true
