import * as THREE from 'three'
import { Movable } from '../movable.coffee'
import { AxisZ } from '../axis'
import { rotateAboutObjectAxis } from '../../threejs_extensions'

# Define colors for active/inactive states
MASS_DRIVER_ACTIVE_COLOR = new THREE.Color(1, 1, 1)  # White (no tint)
MASS_DRIVER_INACTIVE_COLOR = new THREE.Color(0.3, 0.3, 0.4)  # Bluish-gray tint

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
    @isPowered = false
    @rotationEnabled = false
    @originalMaterials = {}
    
    # Apply material modifications to show power state
    @setupMaterials()

  buildMesh: ->
    @controller.meshes['models/mass_driver.glb'].clone()
    
  setupMaterials: ->
    # Store original materials and prepare for color changes
    @mesh.traverse (child) =>
      if child.isMesh && child.material
        if Array.isArray(child.material)
          @originalMaterials[child.id] = []
          child.material = child.material.map (mat, index) =>
            newMat = mat.clone()
            @originalMaterials[child.id][index] = { 
              color: newMat.color.clone() 
            }
            return newMat
        else
          newMat = child.material.clone()
          @originalMaterials[child.id] = { 
            color: newMat.color.clone() 
          }
          child.material = newMat
    
    # Set initial appearance based on power state
    @updateMaterialAppearance(false)

  updatePowerState: ->
    # Check if mass driver is powered
    wasPowered = @isPowered
    @isPowered = @universe.isPowered(@position)
    
    # Update appearance if power state changed
    if wasPowered != @isPowered
      @updateMaterialAppearance(@isPowered)

    # Enable/disable rotation based on power state
    @rotationEnabled = @isPowered

  updateMaterialAppearance: (isPowered) ->
    # Update materials based on power state
    tintColor = if isPowered then MASS_DRIVER_ACTIVE_COLOR else MASS_DRIVER_INACTIVE_COLOR
    
    # Apply tint to all materials
    @mesh.traverse (child) =>
      if child.isMesh && child.material && @originalMaterials[child.id]
        if Array.isArray(child.material)
          child.material.forEach (mat, index) =>
            if @originalMaterials[child.id][index]
              originalColor = @originalMaterials[child.id][index].color
              if isPowered
                # Restore original color
                mat.color.copy(originalColor)
              else
                # Apply tint by multiplying colors
                mat.color.copy(originalColor).multiply(tintColor)
        else
          originalColor = @originalMaterials[child.id].color
          if isPowered
            # Restore original color
            child.material.color.copy(originalColor)
          else
            # Apply tint by multiplying colors
            child.material.color.copy(originalColor).multiply(tintColor)

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

      @fireDelay--
      @fire() if @shouldFire
    else
      # When not powered, clear target
      @target = null
      @shouldFire = false

  fire: ->
    if @fireDelay <= 0 && @isPowered
      vector = @target.position.clone().sub @position
      @angle = Math.atan2(vector.y, vector.x)
      if vector.length() < FIRE_MAX_DISTANCE
        @target.velocity.multiplyScalar(0).add(vector)
        @fireDelay = 60
        new MassDriverBeam {
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

class MassDriverBeam extends Movable
  solid: false
  mass: 0

  buildMesh: (options) ->
    material = new THREE.MeshBasicMaterial
    material.color.setRGB(91 / 255, 60 / 255, 29 / 255)
    material.transparent = true
    material.opacity = 0.9
    geometry = new THREE.BoxGeometry options.vector.length(), 2, 2
    new THREE.Mesh geometry, material

  constructor: (options) ->
    super(options)

    @vector = options.vector
    @parent = options.parent

    @position.copy(@parent.position)
    
    @rotation = Math.atan2(@vector.y, @vector.x)
    rotateAboutObjectAxis(@mesh, AxisZ, @rotation)
    
    @position.add(@vector.clone().normalize().multiplyScalar(@vector.length() / 2))

    @lifetime = 10

  step: ->
    if @lifetime > 0
      @lifetime--
    else
      @remove()

  handleCollision: (other) ->
    true
