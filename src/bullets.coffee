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
      bullet.setup parent.position, parent.rotation

class ShipBullet extends Movable
  solid: false

  constructor: (options) ->
    super options

  buildMesh: ->
    geometry = new THREE.SphereGeometry 5
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (position, rotation) ->
    @position.set position.x, position.y, position.z - 10
    @velocity.x = Math.cos rotation
    @velocity.y = Math.sin rotation
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
