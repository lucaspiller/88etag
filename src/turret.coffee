class TurretBase
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
    @controller.meshFactory.turretBase()

class Turret extends Movable
  AI_STEP_INTERVAL = 30
  ROTATE_ANGLE_DIFF_MAX = Math.PI / 32
  FIRE_ANGLE_DIFF_MAX = Math.PI / 8
  FIRE_MAX_DISTANCE = 1000
  TARGETTING_MAX_DISTANCE = 3000

  type: 'turret'
  radius: 20
  healthRadius: 8
  mass: 50
  maxHealth: 1000

  constructor: (options) ->
    @base = new TurretBase options
    super options
    @parent = options.parent
    @position.x = options.position.x
    @position.y = options.position.y

    @aiStepCounter = 0
    @bulletDelay = 0

  rotateLeft: ->
    @rotationalVelocity = Math.PI / 64

  rotateRight: ->
    @rotationalVelocity = -Math.PI / 64

  rotateStop: ->
    @rotationalVelocity = 0

  remove: ->
    super
    @base.remove()

  step: ->
    super
    if @aiStepCounter <= 0
      @aiStep()
      @aiStepCounter = AI_STEP_INTERVAL
    else
      @aiStepCounter--

    if Math.abs(@rotation - @angle) > ROTATE_ANGLE_DIFF_MAX
      if @rotation > @angle
        @rotateRight()
      else if @rotation < @angle
        @rotateLeft()
    else
      @rotateStop()

    @bulletDelay--
    @fire() if @shouldFire

    @base.position.set @position.x, @position.y, @position.z

  fire: ->
    if @bulletDelay <= 0
      @universe.bullets.newTurretBullet this
      @bulletDelay = 150

  aiStep: ->
    @chooseTarget() unless @target
    if @target
      vector = @target.position.clone().subSelf @position
      @angle = Math.atan2(vector.y, vector.x)
      @shouldFire = Math.abs(@rotation - @angle) <= FIRE_ANGLE_DIFF_MAX && vector.length() < FIRE_MAX_DISTANCE
    else
      @shouldFire = false

  chooseTarget: ->
    for player in @universe.players
      if player != @parent && player.ship
        vector = player.ship.position.clone().subSelf @position
        if vector.length() < TARGETTING_MAX_DISTANCE
          @target = player.ship
          break
