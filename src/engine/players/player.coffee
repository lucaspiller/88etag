import * as THREE from 'three'
import { Movable } from '../movable.coffee'
import { Static } from '../static.coffee'
import { AxisX, AxisZ, AxisY } from '../axis'
import { rotateAboutObjectAxis, rotateAboutWorldAxis } from '../../threejs_extensions.ts'
import { PowerRadiusVisualizer } from '../structures/power_radius_visualizer.coffee'

BULLET_DELAY = 30

class PlayerShip extends Movable
  healthRadius: 8
  maxHealth: 1000
  radius: 10
  mass: 10
  max_speed: 2
  max_accel: 0.05

  constructor: (options) ->
    super(options)
    @parent = options.parent
    @acceleration = new THREE.Vector3 0, 0, 0
    @position.y = @parent.commandCentre.position.y - CommandCentre::radius - @radius - 1

    @rotation = Math.PI * 1.5
    rotateAboutObjectAxis(@mesh, AxisZ, @rotation)
    @bulletDelay = 0

  buildMesh: ->
    @controller.meshes['models/ship_basic.glb'].clone()

  rotateLeft: ->
    @rotationalVelocity = Math.PI / 64

  rotateRight: ->
    @rotationalVelocity = -Math.PI / 64

  forward: ->
    @acceleration.x = Math.cos(@rotation)
    @acceleration.y = Math.sin(@rotation)
    accel = @acceleration.length()
    if accel > @max_accel
      @acceleration.multiplyScalar @max_accel / accel
    @universe.trails.newShipTrail this
    rotateAboutObjectAxis(@mesh, AxisX, Math.PI / 128)

  backward: ->
    @acceleration.x = -Math.cos(@rotation)
    @acceleration.y = -Math.sin(@rotation)
    accel = @acceleration.length()
    if accel > @max_accel
      @acceleration.multiplyScalar @max_accel / accel
    @universe.trails.newShipTrail this
    rotateAboutObjectAxis(@mesh, AxisX, -Math.PI / 128)

  fire: ->
    if @bulletDelay <= 0
      @universe.bullets.newShipBullet this
      @bulletDelay = BULLET_DELAY

  step: ->
    @bulletDelay--

    @velocity.add @acceleration
    @acceleration.multiplyScalar 0
    speed = @velocity.length()
    if speed > @max_speed
      @velocity.multiplyScalar @max_speed / speed

    if Math.abs(@rotationalVelocity) > 0.01
      @rotationalVelocity *= 0.9
    else
      @rotationalVelocity = 0
    super()

  explode: ->
    if @parent.isLocal()
      @controller.startCameraTracking(@velocity.clone())
    
    super()
    @parent.respawn()

class CommandCentreInner extends Static
  rotationalVelocity: -Math.PI / 512

  constructor: (options) ->
    super(options)

  buildMesh: ->
    @controller.meshes['models/command_centre_inner.glb'].clone()

  step: ->
    rotateAboutWorldAxis(@mesh, AxisZ, @rotationalVelocity)

class CommandCentre extends Movable
  mass: 999999999999999999
  healthRadius: 25
  maxHealth: 10000
  radius: 50
  rotationalVelocity: Math.PI / 512
  powerRadius: 150

  constructor: (options) ->
    super(options)
    @parent = options.parent
    @inner = new CommandCentreInner options
    
    # Create power radius visualization
    @powerVisualizer = new PowerRadiusVisualizer {
      controller: @controller,
      position: @position,
      radius: @powerRadius
    }

  buildMesh: ->
    @controller.meshes['models/command_centre.glb'].clone()

  remove: ->
    super()
    @inner.remove()
    # Remove power radius visualization
    @powerVisualizer.remove()

  explode: ->
    @parent.remove()

  step: ->
    super()
    @inner.position.set @position.x, @position.y, @position.z
    @inner.step()
    
    # Update power radius visualization position
    @powerVisualizer.update(@position)
    
  # Check if a position is within power radius
  providesEnergyTo: (position) ->
    x = @position.x - position.x
    y = @position.y - position.y
    distance = Math.sqrt(x * x + y * y)
    return distance <= @powerRadius

class Indicator
  constructor: (options) ->
    @controller = options.controller
    @universe = options.universe
    @parent = options.parent
    @element = document.createElement 'div'
    $(@element).addClass 'indicator'
    @controller.container.appendChild @element
    [@range_x, @range_y] = @controller.screen_range(600)

  step: ->
    $(@element).addClass 'player' if @parent == @universe.player

    camera_x_min = @controller.camera_x_min(@range_x)
    camera_x_max = @controller.camera_x_max(@range_x)
    camera_y_min = @controller.camera_y_min(@range_y)
    camera_y_max = @controller.camera_y_max(@range_y)

    position = @parent.commandCentre.position
    xOff = true
    yOff = true

    if position.x < camera_x_min
      x = 0
    else if position.x > camera_x_max
      x = @controller.width()
    else
      x = (((position.x - camera_x_min) / @range_x)) * @controller.width()
      xOff = false

    if position.y < camera_y_min
      y = @controller.height()
    else if position.y > camera_y_max
      y = 0
    else
      y = (1 - ((position.y - camera_y_min) / @range_y)) * @controller.height()
      yOff = false

    if yOff || xOff
      $(@element).css({ 'top': y - 10, 'left': x - 10 })
    else
      $(@element).css({ 'top': -20, 'left': -20 })

  remove: ->
    $(@element).remove()

export class Player
  constructor: (@options) ->
    @options.parent = this
    @universe = @options.universe
    @controller = @options.controller
    @commandCentre = new CommandCentre @options
    @indicator = new Indicator @options
    @buildShip()

  buildShip: ->
    @ship = new PlayerShip @options

    if @isLocal()
      @controller.disableDeathEffect()
      @controller.stopCameraTracking()

  step: ->
    @indicator.step()
    unless @ship
      if @respawnDelay <= 0
        @buildShip()
      else
        @respawnDelay--

  respawn: ->
    if @isLocal()
      @controller.startCameraTracking(@ship.velocity.clone())
      @controller.enableDeathEffect()

    @ship = false
    @respawnDelay = 300


  remove: ->
    @commandCentre.remove()
    @indicator.remove()
    @ship.remove()
    @ship = false
    
    if @isLocal()
      @controller.stopCameraTracking()
      
    @universe.removePlayer this

  isLocal: ->
    # Overwritten in LocalPlayer class
    false
