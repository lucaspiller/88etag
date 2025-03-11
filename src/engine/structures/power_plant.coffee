import * as THREE from 'three'
import { Movable } from '../movable.coffee'
import { PowerRadiusVisualizer } from './power_radius_visualizer.coffee'
import { rotateAboutWorldAxis } from '../../threejs_extensions'
import { AxisX } from '../axis'

export class PowerPlant extends Movable
  radius: 25
  healthRadius: 10
  mass: 500
  maxHealth: 1500
  powerRadius: 200
  
  constructor: (options) ->
    super(options)
    @parent = options.parent
    
    # Create power radius visualization
    @powerVisualizer = new PowerRadiusVisualizer {
      controller: @controller,
      position: @position,
      radius: @powerRadius
    }
    
  buildMesh: ->
    # Create a group to hold all the parts
    group = new THREE.Group()
    
    # Create the main body (yellow tube)
    bodyPoints = [
        new THREE.Vector2(10, -4),
        new THREE.Vector2(18, -4),
        new THREE.Vector2(18, 4),
        new THREE.Vector2(10, 4)
    ]

    bodyGeometry = new THREE.LatheGeometry(bodyPoints, 16)
    bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x999900,
      side: THREE.DoubleSide
      wireframe: false
    })
    body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    rotateAboutWorldAxis(body, AxisX, Math.PI / 2)
    group.add(body)
    
    # Create the rings
    ringPoints = [
        new THREE.Vector2(24, -1),
        new THREE.Vector2(26, -1),
        new THREE.Vector2(26, 1),
        new THREE.Vector2(24, 1)
    ]
    ringGeometry = new THREE.LatheGeometry(ringPoints, 32)
    ringMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    @ring1 = new THREE.Mesh(ringGeometry, ringMaterial)
    @ring1.rotation.z = Math.PI / 4
    @ring1.rotation.x = Math.PI / 2
    group.add(@ring1)
    
    @ring2 = new THREE.Mesh(ringGeometry, ringMaterial)
    @ring2.rotation.z = Math.PI / 4
    @ring2.rotation.y = Math.PI / 2
    group.add(@ring2)
    
    return group
    
  step: ->
    super()
    
    # Rotate the rings
    @ring1.rotation.x += 0.01
    @ring1.rotation.y += 0.002
    @ring2.rotation.y -= 0.015
    @ring2.rotation.x -= 0.002
    
    # Update power radius visualization position
    @powerVisualizer.update(@position)
    
  remove: ->
    super()
    # Remove power radius visualization
    @powerVisualizer.remove()
    
  # Check if a position is within power radius
  providesEnergyTo: (position) ->
    x = @position.x - position.x
    y = @position.y - position.y
    distance = Math.sqrt(x * x + y * y)
    return distance <= @powerRadius 