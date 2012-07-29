require 'threejs_extensions'

Starfield = require './starfield'
TrailsStorage = require './trails/trails_storage'
BulletsStorage = require './bullets/bullets_storage'
LocalPlayer = require './players/local_player'
AiPlayer = require './players/ai_player'

class Engine
  VIEW_ANGLE = 45
  NEAR = 1
  FAR = 1000
  CAMERA_Z = 1000

  disposed: false

  models: [
    'models/ship_basic.js',
    'models/command_centre.js',
    'models/command_centre_inner.js',
    'models/turret.js'
    'models/turret_base.js',
    'models/mass_driver.js'
  ]

  constructor: (@config) ->
    @container = @config.container
    @setupRenderer()
    @setupScene()
    @load()

  width: ->
    window.innerWidth

  height: ->
    window.innerHeight

  setupRenderer: ->
    if window.location.hash == "#slow"
      @container.className = 'double'

      @renderer = new THREE.WebGLRenderer
      @renderer.setSize @width() / 2, @height() / 2
      @renderer.sortObjects = false
    else
      @renderer = new THREE.WebGLRenderer {
        antialias: true # smoother output
      }
      @renderer.setSize @width(), @height()

    # clear to black background
    @renderer.setClearColorHex 0x080808, 1

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
    @geometries = {}
    loader = new THREE.JSONLoader()
    for model in @models
      @loadModel loader, model

  loadModel: (loader, model) ->
    loader.load model, (geometry) =>
      geometry.computeVertexNormals()
      @geometries[model] = geometry
      if _.size(@geometries) == _.size(@models)
        @continueLoad()

  continueLoad: ->
    @universe = new Universe this
    @render()

  render: ->
    return if @disposed
    requestAnimationFrame (=> @render())

    @universe.checkCollisions()
    @universe.step()

    @light.position.set @camera.position.x, @camera.position.y, CAMERA_Z * 10
    @renderer.render @scene, @camera

    @stats.update() if @stats

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

module.exports = Engine
