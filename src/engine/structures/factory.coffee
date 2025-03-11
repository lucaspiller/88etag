import * as THREE from 'three'
import { Movable } from '../movable.coffee'
import { rotateAboutWorldAxis } from '../../threejs_extensions'
import { AxisX, AxisY } from '../axis'

OUTER_RING_COLOR_ACTIVE = 0xFF6600
OUTER_RING_COLOR_INACTIVE = 0x331100

INNER_RING_COLOR_ACTIVE = 0xFFFFFF
INNER_RING_COLOR_INACTIVE = 0x666666

export class Factory extends Movable
  radius: 25
  healthRadius: 10
  mass: 400
  maxHealth: 1200
  resourceGenerationRate: 5  # Resources generated per second when powered
  resourceGenerationInterval: 1000  # Generate resources every second
  
  constructor: (options) ->
    super(options)
    @parent = options.parent
    @resourceTimer = 0
    @bobHeight = 0
    @bobDirection = 1
    
  buildMesh: ->
    # Create a group to hold all the parts
    group = new THREE.Group()
    
    # Create the white ring
    innerRingPoints = [
        new THREE.Vector2(11, -2),
        new THREE.Vector2(18, -2),
        new THREE.Vector2(18, 2),
        new THREE.Vector2(11, 2)
    ]
    ringGeometry = new THREE.LatheGeometry(innerRingPoints, 16)
    @innerRingMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    innerRing = new THREE.Mesh(ringGeometry, @innerRingMaterial)
    rotateAboutWorldAxis(innerRing, AxisX, Math.PI / 2)
    group.add(innerRing)
    
    # Create the orange ring (resource generator)
    outerRingPoints = [
        new THREE.Vector2(20, -5),
        new THREE.Vector2(23, -5),
        new THREE.Vector2(23, 5),
        new THREE.Vector2(20, 5)
    ]
    outerRingGeometry = new THREE.LatheGeometry(outerRingPoints, 16)
    @outerRingMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x000000,
      side: THREE.DoubleSide
      wireframe: false
    })
    @outerRing = new THREE.Mesh(outerRingGeometry, @outerRingMaterial)
    rotateAboutWorldAxis(@outerRing, AxisX, Math.PI / 2)
    group.add(@outerRing)
    
    return group
    
  step: ->
    super()
    
    # Check if factory is powered
    isPowered = @universe.isPowered(@position)
    
    # If powered, bob the orange ring up and down and generate resources
    if isPowered
      # Bob the orange ring up and down
      @bobHeight += 0.05 * @bobDirection
      if @bobHeight > 2
        @bobDirection = -1
      else if @bobHeight < -2
        @bobDirection = 1
      
      @outerRing.position.y = @bobHeight
      @outerRingMaterial.color.set(OUTER_RING_COLOR_ACTIVE)
      @innerRingMaterial.color.set(INNER_RING_COLOR_ACTIVE)

      # Generate resources on interval
      @resourceTimer += 1
      if @resourceTimer >= @resourceGenerationInterval / 60  # Assuming 60 FPS
        @generateResources()
        @resourceTimer = 0
    else
      @outerRingMaterial.color.set(OUTER_RING_COLOR_INACTIVE)
      @innerRingMaterial.color.set(INNER_RING_COLOR_INACTIVE)
      
  generateResources: ->
    # Check if player has a resources property, if not create it
    if !@parent.resources?
      @parent.resources = 0
      
    # Add resources to the player
    @parent.resources += @resourceGenerationRate
    console.log("Factory generated #{@resourceGenerationRate} resources. Total: #{@parent.resources}") 