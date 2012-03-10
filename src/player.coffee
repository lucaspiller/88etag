class PlayerShip extends Movable
  healthRadius: 8
  maxHealth: 1000
  radius: 10
  mass: 10
  max_speed: 2
  max_accel: 0.05

  constructor: (options) ->
    super options
    @acceleration = new THREE.Vector3 0, 0, 0
    @commandCentre = new CommandCentre options
    @position.y = @commandCentre.position.y - @commandCentre.radius - 10

    @rotation = Math.PI * 1.5
    @mesh.rotateAboutObjectAxis(THREE.AxisZ, @rotation)
    @bulletDelay = 0

  buildMesh: ->
    material = new THREE.MeshLambertMaterial {
      ambient: 0x5E574B
      color: 0x5E574B
    }
    new THREE.Mesh @controller.geometries['models/ship_basic.js'], material

  rotateLeft: ->
    @rotationalVelocity = Math.PI / 64

  rotateRight: ->
    @rotationalVelocity = -Math.PI / 64

  forward: ->
    @acceleration.x = Math.cos(@rotation)
    @acceleration.y = Math.sin(@rotation)
    accel = @acceleration.length()
    if accel > @max_accel
      @acceleration.multiplyScalar @max_accel / accel
    @universe.trails.newShipTrail this
    @mesh.rotateAboutObjectAxis(THREE.AxisX, Math.PI / 128)

  backward: ->
    @acceleration.x = -Math.cos(@rotation)
    @acceleration.y = -Math.sin(@rotation)
    accel = @acceleration.length()
    if accel > @max_accel
      @acceleration.multiplyScalar @max_accel / accel
    @universe.trails.newShipTrail this
    @mesh.rotateAboutObjectAxis(THREE.AxisX, -Math.PI / 128)

  fire: ->
    if @bulletDelay <= 0
      @universe.bullets.newShipBullet this
      @bulletDelay = 10

  step: ->
    @commandCentre.step()

    @bulletDelay--

    @velocity.addSelf @acceleration
    @acceleration.multiplyScalar 0
    speed = @velocity.length()
    if speed > @max_speed
      @velocity.multiplyScalar @max_speed / speed

    if Math.abs(@rotationalVelocity) > 0.01
      @rotationalVelocity *= 0.9
    else
      @rotationalVelocity = 0
    super

class CommandCentreInner
  rotationalVelocity: -Math.PI / 512

  constructor: (options) ->
    @controller = options.controller
    @universe = options.universe

    @mesh = @buildMesh()
    @position = @mesh.position = new THREE.Vector3 0, 0, 500
    if options.position
      @position.x = @mesh.position.x = options.position.x
      @position.y = @mesh.position.y = options.position.y
    @controller.scene.add @mesh

  remove: ->
    @controller.scene.remove @mesh

  buildMesh: ->
    material = new THREE.MeshFaceMaterial
    new THREE.Mesh @controller.geometries['models/command_centre_inner.js'], material

  step: ->
    @mesh.rotateAboutWorldAxis(THREE.AxisZ, @rotationalVelocity)

class CommandCentre extends Movable
  mass: 999999999999999999
  healthRadius: 25
  maxHealth: 10000
  radius: 50
  rotationalVelocity: Math.PI / 512

  constructor: (options) ->
    @inner = new CommandCentreInner options
    super options

    if options.position
      @position.x = @mesh.position.x = options.position.x
      @position.y = @mesh.position.y = options.position.y

  buildMesh: ->
    material = new THREE.MeshFaceMaterial
    new THREE.Mesh @controller.geometries['models/command_centre.js'], material

  remove: ->
    super
    @inner.remove()

  step: ->
    super
    @inner.position.set @position.x, @position.y, @position.z
    @inner.step()

class Player
  constructor: (options) ->
    @universe = options.universe
    @controller = options.controller
    @ship = new PlayerShip options

  step: ->
    true

class LocalPlayer extends Player
  step: ->
    for key in @universe.keys
      switch key
        when 37 # left
          @ship.rotateLeft()
        when 39 # right
          @ship.rotateRight()
        when 38 # up
          @ship.forward()
        when 40 # down
          @ship.backward()
        when 68 # d
          @ship.fire()

    super
    @controller.camera.position.x = @ship.position.x
    @controller.camera.position.y = @ship.position.y

class AiPlayer extends Player
  constructor: (options) ->
    options.position = new THREE.Vector3 0, 0, 0
    options.position.x = -250 #(Math.random() * 1000) - 500
    options.position.y = -250 #(Math.random() * 1000) - 500
    super options
