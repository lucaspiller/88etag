class MassDriver extends Movable
  AI_STEP_INTERVAL = 60
  FIRE_MAX_DISTANCE = 300

  type: 'massDriver'
  radius: 32
  healthRadius: 8
  mass: 250
  maxHealth: 1000

  constructor: (options) ->
    super options
    @parent = options.parent

    @aiStepCounter = 0
    @fireDelay = 60
    @rotationalVelocity = Math.PI / 512

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

    @fireDelay--
    @fire() if @shouldFire

  fire: ->
    if @fireDelay <= 0
      vector = @target.position.clone().subSelf @position
      @angle = Math.atan2(vector.y, vector.x)
      if vector.length() < FIRE_MAX_DISTANCE
        @target.velocity.multiplyScalar(0).addSelf(vector)
        @fireDelay = 60
        new MassDriverFire {
          controller: @controller
          universe: @universe,
          vector: vector,
          parent: this
        }

  aiStep: ->
    @chooseTarget() unless @target
    if @target
      @shouldFire = true
    else
      @shouldFire = false

  chooseTarget: ->
    for player in @universe.players
      if player != @parent && player.ship
        vector = player.ship.position.clone().subSelf @position
        if vector.length() < FIRE_MAX_DISTANCE
          @target = player.ship
          break

class MassDriverFire extends Movable
  type: 'massDriverFire'
  solid: false
  mass: 0

  buildMesh: ->
    material = new THREE.MeshBasicMaterial
    material.color.setRGB(91 / 255, 60 / 255, 29 / 255)
    geometry = new THREE.CubeGeometry @vector.length(), 2, 2
    new THREE.Mesh geometry, material

  constructor: (options) ->
    @vector = options.vector
    @parent = options.parent
    super options
    @position.set @parent.position.x, @parent.position.y, @parent.position.z - 10
    @rotation = Math.atan2(@vector.y, @vector.x)
    @mesh.rotateAboutObjectAxis(THREE.AxisZ, @rotation)
    @position.addSelf @vector.multiplyScalar(0.5)
    @lifetime = 10

  step: ->
    if @lifetime > 0
      @lifetime--
    else
      @remove()

  handleCollision: (other) ->
    true
