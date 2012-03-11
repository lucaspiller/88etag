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
    @position.y = @parent.commandCentre.position.y - @parent.commandCentre.radius - 10

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

    if @parent.commandCentre
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

class Player
  constructor: (@options) ->
    options.parent = this
    @universe = options.universe
    @controller = options.controller
    @commandCentre = new CommandCentre options
    @indicator = new Indicator {
      controller: @controller,
      universe: @universe,
      parent: this
    }
    @buildShip()

  buildShip: ->
    @ship = new PlayerShip @options

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

class LocalPlayer extends Player
  step: ->
    super
    if @ship
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
          when 81 # q
            @buildTurret()
            @universe.keys = _.without @universe.keys, 81 # TODO hack
          when 87 # w
            @buildMassDriver()
            @universe.keys = _.without @universe.keys, 87 # TODO hack

      @controller.camera.position.x = @ship.position.x
      @controller.camera.position.y = @ship.position.y

  buildTurret: ->
    turret = new Turret {
      universe: @universe,
      controller: @controller,
      position: @ship.position.clone(),
      parent: this
    }

  buildMassDriver: ->
    massdriver = new MassDriver {
      universe: @universe,
      controller: @controller,
      position: @ship.position.clone(),
      parent: this
    }

class AiPlayer extends Player
  AI_STEP_INTERVAL = 5
  ROTATE_ANGLE_DIFF_MAX = Math.PI / 16
  FIRE_ANGLE_DIFF_MAX = Math.PI / 8
  FIRE_MAX_DISTANCE = 1000

  constructor: (options) ->
    options.position = new THREE.Vector3 0, 0, 0
    options.position.x = (Math.random() * 10000) - 5000
    options.position.y = (Math.random() * 10000) - 5000
    super options

    @aiStepCounter = 0
    @angle = 0

  step: ->
    super
    if @ship
      if @aiStepCounter <= 0
        @aiStep()
        @aiStepCounter = AI_STEP_INTERVAL
      else
        @aiStepCounter--

        if Math.abs(@ship.rotation - @angle) > ROTATE_ANGLE_DIFF_MAX
          if @ship.rotation > @angle
            @ship.rotateRight()
          else if @ship.rotation < @angle
            @ship.rotateLeft()
        @ship.forward()
        @ship.fire() if @fire

  aiStep: ->
    @chooseTarget() unless @target
    if @target && @target.ship
      vector = @target.ship.position.clone().subSelf @ship.position
      @angle = Math.atan2(vector.y, vector.x)
      @fire = Math.abs(@ship.rotation - @angle) <= FIRE_ANGLE_DIFF_MAX && vector.length() < FIRE_MAX_DISTANCE
    else
      @fire = false

  chooseTarget: ->
    for player in @universe.players
      if player != this
        @target = player
        break
