class MassDriver extends Movable
  AI_STEP_INTERVAL = 60
  ROTATE_ANGLE_DIFF_MAX = Math.PI / 32
  FIRE_ANGLE_DIFF_MAX = Math.PI / 8
  FIRE_MAX_DISTANCE = 1000

  radius: 32
  healthRadius: 8
  mass: 10000
  maxHealth: 1000

  constructor: (options) ->
    super options
    @parent = options.parent
    @position.x = options.position.x
    @position.y = options.position.y

    @aiStepCounter = 0
    @bulletDelay = 0
    @rotationalVelocity = Math.PI / 512

  buildMesh: ->
    material = new THREE.MeshLambertMaterial {
      ambient: 0x5B3C1D
      color: 0x5B3C1D
    }
    new THREE.Mesh @controller.geometries['models/mass_driver.js'], material

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
  #  if @aiStepCounter <= 0
  #    @aiStep()
  #    @aiStepCounter = AI_STEP_INTERVAL
  #  else
  #    @aiStepCounter--

  #  if Math.abs(@rotation - @angle) > ROTATE_ANGLE_DIFF_MAX
  #    if @rotation > @angle
  #      @rotateRight()
  #    else if @rotation < @angle
  #      @rotateLeft()
  #  else
  #    @rotateStop()

  #  @bulletDelay--
  #  @fire() if @shouldFire

  fire: ->
    if @bulletDelay <= 0
      @universe.bullets.newShipBullet this
      @bulletDelay = 50

  aiStep: ->
    @chooseTarget() unless @target
    if @target && @target.ship
      vector = @target.ship.position.clone().subSelf @position
      @angle = Math.atan2(vector.y, vector.x)
      @shouldFire = Math.abs(@rotation - @angle) <= FIRE_ANGLE_DIFF_MAX && vector.length() < FIRE_MAX_DISTANCE
    else
      @shouldFire = false

  chooseTarget: ->
    for player in @universe.players
      if player != @parent
        console.log player, @parent
        @target = player
        break
