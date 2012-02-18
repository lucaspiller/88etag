class BulletsStorage
  constructor: (options) ->
    @universe = options.universe
    @controller = options.controller
    @pool = []

  addToPool: (bullet) ->
    @pool.push bullet

  newShipBullet: (parent) ->
    for i in [1..2]
      bullet = @pool.pop()
      unless bullet
        bullet = new ShipBullet {
          controller: @controller
          universe: @universe
        }
      bullet.setup parent

class ShipBullet extends Movable
  solid: false
  damage: 100
  radius: 5
  mass: 0

  constructor: (options) ->
    super options

  buildMesh: ->
    geometry = new THREE.SphereGeometry 5
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (@parent) ->
    @position.set @parent.position.x, @parent.position.y, @parent.position.z - 10
    @velocity.x = Math.cos @parent.rotation
    @velocity.y = Math.sin @parent.rotation
    @velocity.multiplyScalar 6
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)
    @lifetime = 100
    @alive = true

  remove: ->
    @alive = false
    @position.z = @controller.NEAR
    @universe.bullets.addToPool this

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

