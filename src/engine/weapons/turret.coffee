import * as THREE from 'three'
import { Movable } from '../movable.coffee'
import { Static } from '../static.coffee'

class TurretBase extends Static
  buildMesh: ->
    material = @controller.materials['models/turret_base.js']
    new THREE.Mesh @controller.geometries['models/turret_base.js'], material

export class Turret extends Movable
  AI_STEP_INTERVAL = 30
  ROTATE_ANGLE_DIFF_MAX = Math.PI / 32
  FIRE_ANGLE_DIFF_MAX = Math.PI / 8
  FIRE_MAX_DISTANCE = 1000
  TARGETTING_MAX_DISTANCE = 3000

  radius: 20
  healthRadius: 8
  mass: 50
  maxHealth: 1000

  constructor: (options) ->
    super(options)
    @base = new TurretBase options
    @parent = options.parent

    @aiStepCounter = 0
    @bulletDelay = 0

  buildMesh: ->
    material = @controller.materials['models/turret.js']
    new THREE.Mesh @controller.geometries['models/turret.js'], material

  rotateLeft: ->
    @rotationalVelocity = Math.PI / 64

  rotateRight: ->
    @rotationalVelocity = -Math.PI / 64

  rotateStop: ->
    @rotationalVelocity = 0

  remove: ->
    super()
    @base.remove()

  step: ->
    super()
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
    if @target && @target.alive
      vector = @target.position.clone().sub @position
      @angle = Math.atan2(vector.y, vector.x)
      @shouldFire = Math.abs(@rotation - @angle) <= FIRE_ANGLE_DIFF_MAX && vector.length() < FIRE_MAX_DISTANCE
    else
      @shouldFire = false

  chooseTarget: ->
    for player in @universe.players
      if player != @parent && player.ship
        vector = player.ship.position.clone().sub @position
        if vector.length() < TARGETTING_MAX_DISTANCE
          @target = player.ship
          break
