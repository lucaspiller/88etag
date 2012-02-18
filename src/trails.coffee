class TrailsStorage
  constructor: (options) ->
    @universe = options.universe
    @controller = options.controller
    @pool = []

  addToPool: (trail) ->
    @pool.push trail

  newShipTrail: (parent) ->
    for i in [1..2]
      trail = @pool.pop()
      unless trail
        trail = new ShipTrail {
          controller: @controller
          universe: @universe
        }
      trail.setup parent.position, parent.velocity

class ShipTrail extends Movable
  solid: false

  constructor: (options) ->
    super options

  buildMesh: ->
    geometry = new THREE.SphereGeometry 1
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (position, velocity) ->
    @position.set position.x, position.y, position.z - 10
    @velocity.set (Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4, 0
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)
    @lifetime = 40
    @alive = true

  remove: ->
    @alive = false
    @position.z = @controller.NEAR
    @universe.trails.addToPool this

  step: ->
    if @alive
      if @lifetime > 0
        @position.addSelf @velocity
        @mesh.material.opacity = @lifetime / 30
        @lifetime--
      else
        @remove()
