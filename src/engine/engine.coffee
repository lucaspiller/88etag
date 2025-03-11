import * as THREE from 'three'

import { Starfield } from './starfield.coffee'
import { TrailsStorage } from './trails/trails_storage.coffee'
import { BulletsStorage } from './bullets/bullets_storage.coffee'
import { LocalPlayer } from './players/local_player.coffee'
import { AiPlayer } from './players/ai_player.coffee'
import { PowerPlant } from './structures/power_plant.coffee'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
# Import post-processing modules
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js'

export class Engine
  VIEW_ANGLE = 45
  NEAR = 1
  FAR = 1000
  CAMERA_Z = 1000

  disposed: false

  models: [
    'models/ship_basic.glb',
    'models/command_centre.glb',
    'models/command_centre_inner.glb',
    'models/turret.glb',
    'models/turret_base.glb',
    'models/mass_driver.glb',
  ]

  constructor: (@config) ->
    @container = @config.container
    @setupRenderer()
    @setupScene()
    @setupPostProcessing()
    @load()
    
    # Camera tracking when ship explodes
    @cameraVelocity = new THREE.Vector3(0, 0, 0)
    @isTrackingLastVelocity = false
    @cameraTrackingDamping = 0.99 # Slow down factor per frame

  width: ->
    window.innerWidth

  height: ->
    window.innerHeight

  setupRenderer: ->
    console.log('THREE', THREE.REVISION)

    @renderer = new THREE.WebGLRenderer {
      antialias: true
    }
    @renderer.setSize @width(), @height()

    # clear to black background
    @renderer.setClearColor 0x0B1220, 1

    @container.appendChild @renderer.domElement

    if window.Stats
      @stats = new Stats()
      @stats.domElement.style.position = 'absolute'
      @stats.domElement.style.top = '0px'
      @container.appendChild @stats.domElement

  setupScene: ->
    @scene = new THREE.Scene()

    # add a camera
    @camera = new THREE.PerspectiveCamera VIEW_ANGLE, @width() / @height(), NEAR, FAR
    @camera.position.set 0, 0, CAMERA_Z
    @scene.add @camera

    # add light sources
    @scene.add new THREE.AmbientLight 0x999999
    @light = new THREE.PointLight 0xffffff
    @scene.add @light

  setupPostProcessing: ->
    # Create the effect composer
    @composer = new EffectComposer(@renderer)
    
    # Add the basic render pass
    renderPass = new RenderPass(@scene, @camera)
    @composer.addPass(renderPass)

  # Enable death effect (blur and ghosting)
  enableDeathEffect: ->
    return if @isDeathEffectActive

    @isDeathEffectActive = true

    # Create and add the afterimage pass (for ghosting effect)
    @afterimagePass = new AfterimagePass(1.0)
    @afterimagePass.enabled = true
    @composer.addPass(@afterimagePass)
    
    # Create and add the bloom pass (for glow/blur)
    @bloomPass = new UnrealBloomPass(
      new THREE.Vector2(@width(), @height()),
      0.1,   # strength
      0.4,   # radius
      0.85   # threshold
    )
    @bloomPass.enabled = false  # Disabled by default
    @composer.addPass(@bloomPass)

    @bloomStrengthTarget = 1.5
    
  # Disable death effect
  disableDeathEffect: ->
    return unless @isDeathEffectActive

    @isDeathEffectActive = false

    @composer.removePass(@afterimagePass)
    @composer.removePass(@bloomPass)

    @afterimagePass.dispose()
    @bloomPass.dispose()

  screen_range: (depth) ->
    range_x = Math.tan(@camera.fov * Math.PI / 180) * (@camera.position.z - depth) * 2
    range_y = range_x / @camera.aspect
    [range_x, range_y]

  camera_x_min: (range_x) ->
    @camera.position.x - (range_x) / 2

  camera_x_max: (range_x) ->
    @camera.position.x + (range_x) / 2

  camera_y_min: (range_y) ->
    @camera.position.y - (range_y) / 2

  camera_y_max: (range_y) ->
    @camera.position.y + (range_y) / 2

  load: ->
    @meshes = {}

    loader = new GLTFLoader()
    for model in @models
      await @loadModel loader, model

    @universe = new Universe this
    @render()

  loadModel: (loader, model) ->
    new Promise (resolve) =>
      loader.load model,
        (gltf) =>
          scene = gltf.scene
          @meshes[model] = scene.children[0]
          resolve()
        undefined,
        (error) =>
          console.error("Error loading model: #{model}", error)

  render: ->
    return if @disposed
    requestAnimationFrame (=> @render())

    @universe.checkCollisions()
    @universe.step()
    
    # Update camera position if tracking last velocity
    if @isTrackingLastVelocity
      @camera.position.add(@cameraVelocity)
      @cameraVelocity.multiplyScalar(@cameraTrackingDamping)
      
      # Stop tracking if velocity becomes very small
      if @cameraVelocity.lengthSq() < 0.001
        @isTrackingLastVelocity = false
        @cameraVelocity.set(0, 0, 0)

    @light.position.set @camera.position.x, @camera.position.y, CAMERA_Z * 10
    
    # Update bloom strength animation if death effect is active
    if @isDeathEffectActive and @bloomPass.strength < @bloomStrengthTarget
      @bloomPass.strength += 0.01
      
    # Use the effect composer instead of direct renderer
    @composer.render()

    @stats.update() if @stats

  # Start tracking camera along the specified velocity vector
  startCameraTracking: (velocity) ->
    @cameraVelocity.copy(velocity)
    @isTrackingLastVelocity = true
    
  # Stop camera tracking
  stopCameraTracking: ->
    @isTrackingLastVelocity = false
    @cameraVelocity.set(0, 0, 0)

  dispose: ->
    @universe.unbindKeys()
    @disposed = true

class Universe
  constructor: (@controller) ->
    @starfield = new Starfield @controller
    @trails = new TrailsStorage {
      controller: @controller,
      universe: this
    }
    @bullets = new BulletsStorage {
      controller: @controller,
      universe: this
    }
    @masses = []
    @players = []
    @buildPlayer()
    @bindKeys()

  buildPlayer: ->
    @player = new LocalPlayer {
      controller: @controller,
      universe: this
    }
    @players.push @player

    @controller.config.aiPlayers ?= 0
    for i in [1..@controller.config.aiPlayers]
      ai = new AiPlayer {
        controller: @controller,
        universe: this
      }
      @players.push ai

  removePlayer: (player) ->
    delete @players[player]

    if player == @player
      @gameOver()

  gameOver: ->
    if @controller.config.onGameOver
      @controller.config.onGameOver()

  bindKeys: ->
    @keys = []
    $(window).bind('keydown', @keydown)
    $(window).bind('keyup', @keyup)

  unbindKeys: ->
    $(window).unbind('keydown', @keydown)
    $(window).unbind('keyup', @keyup)

  keydown: (e) =>
    if @controller.config.onKeyDown
      unless @controller.config.onKeyDown(e.which)
        return false

    @keys.push e.which
    @keys = _.uniq @keys

  keyup: (e) =>
    if @controller.config.onKeyUp
      @controller.config.onKeyUp(e.which)
    @keys = _.without @keys, e.which

  step: ->
    @starfield.step()
    mass.step() for mass in @masses
    player.step() for player in @players

  checkCollisions: ->
    for m1 in @masses
      if m1.alive
        for m2 in @masses
          if m2.alive
            if m1.mass <= m2.mass and m1.overlaps m2
              m1.handleCollision m2
    true

  anythingOverlaps: (position, radius) ->
    for m1 in @masses
      if m1.alive && m1.solid
        if m1.overlapsPosition(position, radius)
          return m1
    false

  # Add a method to check if a position is powered by any power source
  isPowered: (position) ->
    # Check if any power plant provides energy to this position
    for mass in @masses
      if mass.alive && (mass.providesEnergyTo? && typeof mass.providesEnergyTo == 'function')
        if mass.providesEnergyTo(position)
          return true
    return false

  # Get all power sources in the universe
  getPowerSources: ->
    sources = []
    for mass in @masses
      if mass.alive && (mass.providesEnergyTo? && typeof mass.providesEnergyTo == 'function')
        sources.push(mass)
    return sources
