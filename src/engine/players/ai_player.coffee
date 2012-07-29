Player = require './player'

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

module.exports = AiPlayer
