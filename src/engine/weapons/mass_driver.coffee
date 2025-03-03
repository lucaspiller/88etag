import * as THREE from 'three'
import { Movable } from '../movable.coffee'
import { AxisZ } from '../axis'

export class MassDriver extends Movable
  AI_STEP_INTERVAL = 60
  FIRE_MAX_DISTANCE = 300

  radius: 32
  healthRadius: 8
  mass: 250
  maxHealth: 1000

  constructor: (options) ->
    super(options)
    @parent = options.parent

    @aiStepCounter = 0
    @fireDelay = 60
    @rotationalVelocity = Math.PI / 512

  buildMesh: ->
    material = new THREE.MeshLambertMaterial {
      color: 0x5B3C1D
    }
    new THREE.Mesh @controller.geometries['models/mass_driver.js'], material

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

    @fireDelay--
    @fire() if @shouldFire

  fire: ->
    if @fireDelay <= 0
      vector = @target.position.clone().sub @position
      @angle = Math.atan2(vector.y, vector.x)
      if vector.length() < FIRE_MAX_DISTANCE
        @target.velocity.multiplyScalar(0).add(vector)
        @fireDelay = 60
        new MassDriverFire {
          controller: @controller
          universe: @universe,
          vector: vector,
          parent: this
        }

  aiStep: ->
    @chooseTarget() unless @target
    if @target && @target.alive
      @shouldFire = true
    else
      @shouldFire = false

  chooseTarget: ->
    for player in @universe.players
      if player != @parent && player.ship
        vector = player.ship.position.clone().sub @position
        if vector.length() < FIRE_MAX_DISTANCE
          @target = player.ship
          break

class MassDriverFire extends Movable
  solid: false
  mass: 0

  buildMesh: ->
    material = new THREE.MeshBasicMaterial
    material.color.setRGB(91 / 255, 60 / 255, 29 / 255)
    material.transparent = true
    material.opacity = 0.9
    geometry = new THREE.CubeGeometry @vector.length(), 2, 2
    new THREE.Mesh geometry, material

  constructor: (options) ->
    super(options)
    @vector = options.vector
    @parent = options.parent

    @rotation = Math.atan2(@vector.y, @vector.x)
    @mesh.rotateAboutObjectAxis(AxisZ, @rotation)
    @position.add @vector.multiplyScalar(0.5)

    @lifetime = 10

  step: ->
    if @lifetime > 0
      @lifetime--
    else
      @remove()

  handleCollision: (other) ->
    true
