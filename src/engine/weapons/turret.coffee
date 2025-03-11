import * as THREE from 'three'
import { Movable } from '../movable.coffee'
import { Static } from '../static.coffee'

TURRET_ACTIVE_OPACITY = 1.0
TURRET_INACTIVE_OPACITY = 0.2

class TurretBase extends Static
  buildMesh: ->
    @controller.meshes['models/turret_base.glb'].clone()

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
    @isPowered = false
    
    # Apply material modifications to show power state
    @setupMaterials()

  buildMesh: ->
    @controller.meshes['models/turret.glb'].clone()
    
  setupMaterials: ->
    # Apply material modifications to both turret and base
    @mesh.traverse (child) =>
      if child.isMesh && child.material
        # Store original material for reference
        if Array.isArray(child.material)
          child.material = child.material.map (mat) =>
            newMat = mat.clone()
            newMat.transparent = true
            newMat.opacity = TURRET_INACTIVE_OPACITY
            return newMat
        else
          child.material = child.material.clone()
          child.material.transparent = true
          child.material.opacity = TURRET_INACTIVE_OPACITY
    
    # Do the same for base
    @base.mesh.traverse (child) =>
      if child.isMesh && child.material
        if Array.isArray(child.material)
          child.material = child.material.map (mat) =>
            newMat = mat.clone()
            newMat.transparent = true
            newMat.opacity = TURRET_INACTIVE_OPACITY
            return newMat
        else
          child.material = child.material.clone()
          child.material.transparent = true
          child.material.opacity = TURRET_INACTIVE_OPACITY

  rotateLeft: ->
    @rotationalVelocity = Math.PI / 64

  rotateRight: ->
    @rotationalVelocity = -Math.PI / 64

  rotateStop: ->
    @rotationalVelocity = 0

  remove: ->
    super()
    @base.remove()

  updatePowerState: ->
    # Check if turret is powered
    @isPowered = @universe.isPowered(@position)
    
    # Update materials based on power state
    opacity = if @isPowered then TURRET_ACTIVE_OPACITY else TURRET_INACTIVE_OPACITY
    
    # Update turret materials
    @mesh.traverse (child) =>
      if child.isMesh && child.material
        if Array.isArray(child.material)
          child.material.forEach (mat) -> mat.opacity = opacity
        else
          child.material.opacity = opacity
    
    # Update base materials
    @base.mesh.traverse (child) =>
      if child.isMesh && child.material
        if Array.isArray(child.material)
          child.material.forEach (mat) -> mat.opacity = opacity
        else
          child.material.opacity = opacity

  step: ->
    super()
    
    # Update power state
    @updatePowerState()
    
    # Only perform AI and targeting if powered
    if @isPowered
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
    else
      # When not powered, clear target and stop rotation
      @target = null
      @shouldFire = false
      @rotateStop()

    @base.position.set @position.x, @position.y, @position.z

  fire: ->
    if @bulletDelay <= 0 && @isPowered
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
