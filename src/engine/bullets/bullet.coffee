import { Movable } from '../movable.coffee'

export class Bullet extends Movable
  HIDDEN_Z = 2000

  solid: false
  mass: 0

  constructor: (options) ->
    super(options)

  setup: (@parent) ->
    @position.set @parent.position.x, @parent.position.y, @parent.position.z - 10
    @rotation = @parent.rotation - (Math.PI * 1.5)
    @mesh.rotateAboutObjectAxis(THREE.AxisZ, @rotation)
    @velocity.x = Math.cos @parent.rotation
    @velocity.y = Math.sin @parent.rotation
    @alive = true

  remove: ->
    @alive = false
    @position.z = HIDDEN_Z
    @mesh.rotateAboutObjectAxis(THREE.AxisZ, -@rotation)

  step: ->
    if @alive
      if @lifetime > 0
        @position.addSelf @velocity
        @lifetime--
      else
        @remove()

  handleCollision: (other) ->
    return unless other.solid
    return if other == @parent
    other.health -= @damage
    if other.health <= 0
      other.explode()
    @remove()
