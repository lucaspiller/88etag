class TrailsStorage
  constructor: (options) ->
    @universe = options.universe
    @controller = options.controller
    @shipTrailPool = []
    @turretBulletTrailPool = []

  addToShipTrailPool: (trail) ->
    @shipTrailPool.push trail

  addToTurretBulletTrailPool: (trail) ->
    @turretBulletTrailPool.push trail

  newShipTrail: (parent) ->
    for i in [1..2]
      trail = @shipTrailPool.pop()
      unless trail
        trail = new ShipTrail {
          controller: @controller
          universe: @universe
        }
      trail.setup parent.position

  newTurretBulletTrail: (parent) ->
    trail = @turretBulletTrailPool.pop()
    unless trail
      trail = new TurretBulletTrail {
        controller: @controller
        universe: @universe
      }
    trail.setup parent.position

class Trail extends Movable
  HIDDEN_Z = 1000

  solid: false

  constructor: (options) ->
    super options

  buildMesh: ->
    geometry = new THREE.SphereGeometry 1
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (position) ->
    @position.set position.x, position.y, position.z - 10
    @lifetime = @max_lifetime
    @alive = true

  remove: ->
    @alive = false
    @position.z = HIDDEN_Z

  step: ->
    if @alive
      if @lifetime > 0
        @position.addSelf @velocity
        @mesh.material.opacity = @lifetime / @max_lifetime
        @lifetime--
      else
        @remove()

  handleCollision: (other) ->
    true

class ShipTrail extends Trail
  max_lifetime: 30

  buildMesh: ->
    geometry = new THREE.SphereGeometry 1
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (position) ->
    super
    @velocity.set (Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4, 0
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)

  remove: ->
    super
    @universe.trails.addToShipTrailPool this

class TurretBulletTrail extends Trail
  max_lifetime: 5

  buildMesh: ->
    geometry = new THREE.SphereGeometry 1
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (position) ->
    super
    @velocity.set (Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4, 0
    @mesh.material.color.setRGB(100, 100, 100)

  remove: ->
    super
    @universe.trails.addToTurretBulletTrailPool this
