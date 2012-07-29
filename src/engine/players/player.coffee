Movable = require '../movable'

class PlayerShip extends Movable
  healthRadius: 8
  maxHealth: 1000
  radius: 10
  mass: 10
  max_speed: 2
  max_accel: 0.05

  constructor: (options) ->
    super options
    @parent = options.parent
    @acceleration = new THREE.Vector3 0, 0, 0
    @position.y = @parent.commandCentre.position.y - CommandCentre::radius - @radius - 1

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

  explode: ->
    super
    @parent.respawn()

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
    @parent = options.parent
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

  explode: ->
    @parent.remove()

  step: ->
    super
    @inner.position.set @position.x, @position.y, @position.z
    @inner.step()

class Indicator
  constructor: (options) ->
    @controller = options.controller
    @universe = options.universe
    @parent = options.parent
    @element = document.createElement 'div'
    $(@element).addClass 'indicator'
    @controller.container.appendChild @element
    [@range_x, @range_y] = @controller.screen_range(600)

  step: ->
    $(@element).addClass 'player' if @parent == @universe.player

    camera_x_min = @controller.camera_x_min(@range_x)
    camera_x_max = @controller.camera_x_max(@range_x)
    camera_y_min = @controller.camera_y_min(@range_y)
    camera_y_max = @controller.camera_y_max(@range_y)

    position = @parent.commandCentre.position
    xOff = true
    yOff = true

    if position.x < camera_x_min
      x = 0
    else if position.x > camera_x_max
      x = @controller.width()
    else
      x = (((position.x - camera_x_min) / @range_x)) * @controller.width()
      xOff = false

    if position.y < camera_y_min
      y = @controller.height()
    else if position.y > camera_y_max
      y = 0
    else
      y = (1 - ((position.y - camera_y_min) / @range_y)) * @controller.height()
      yOff = false

    if yOff || xOff
      $(@element).css({ 'top': y - 10, 'left': x - 10 })
    else
      $(@element).css({ 'top': -20, 'left': -20 })

  remove: ->
    $(@element).remove()

class Player
  constructor: (@options) ->
    options.parent = this
    @universe = options.universe
    @controller = options.controller
    @commandCentre = new CommandCentre options
    @indicator = new Indicator options
    @ship = new PlayerShip options

  step: ->
    @indicator.step()
    unless @ship
      if @respawnDelay <= 0
        @buildShip()
      else
        @respawnDelay--

  respawn: ->
    @ship = false
    @respawnDelay = 300

  remove: ->
    @commandCentre.remove()
    @indicator.remove()
    @ship.remove()
    @ship = false
    @universe.removePlayer this

module.exports = Player
