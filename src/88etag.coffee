class Controller
  VIEW_ANGLE = 45
  NEAR = 1
  FAR = 1000
  CAMERA_Z = 1000

  models: [
    'models/ship_basic.js',
    'models/command_centre.js',
    'models/command_centre_inner.js',
    'models/turret.js'
    'models/turret_base.js',
    'models/mass_driver.js'
  ]

  constructor: (@container) ->
    @setupRenderer()
    @setupScene()
    @load()

  width: ->
    window.innerWidth

  height: ->
    window.innerHeight

  setupRenderer: ->
    @renderer = new THREE.WebGLRenderer {
      antialias: true # smoother output
    }

    # clear to black background
    @renderer.setClearColorHex 0x080808, 1
    @renderer.setSize @width(), @height()
    @container.append @renderer.domElement

    if Stats
      @stats = new Stats()
      @stats.domElement.style.position = 'absolute'
      @stats.domElement.style.top = '0px'
      container.appendChild @stats.domElement

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

  width: ->
    window.innerWidth

  height: ->
    window.innerHeight

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
    requestAnimationFrame (=> @render())

    @universe.checkCollisions()
    @universe.step()

    @light.position.set @camera.position.x, @camera.position.y, CAMERA_Z * 10
    @renderer.render @scene, @camera

    @stats.update() if @stats

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

    ai = new AiPlayer {
      controller: @controller,
      universe: this
    }
    @players.push ai

  bindKeys: ->
    @keys = []

    $(window).keydown (e) =>
      @keys.push e.which
      @keys = _.uniq @keys

    $(window).keyup (e) =>
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

class HealthBall
  constructor: (options) ->
    @controller = options.controller
    @position = options.position
    @maxHealth = options.maxHealth
    @radius = options.radius

    @buildMeshes()

  buildMeshes: ->
    geometry = new THREE.CylinderGeometry @radius, @radius, 0.1, 16
    material = new THREE.MeshPhongMaterial()
    material.color.setRGB(0, 25 / 255, 0)
    material.opacity = 0.3
    @outerMesh = new THREE.Mesh geometry, material
    @outerMesh.rotateAboutWorldAxis(THREE.AxisX, Math.PI / 2)
    @controller.scene.add @outerMesh

    geometry = new THREE.CylinderGeometry @radius, @radius, 0.1, 16
    material = new THREE.MeshBasicMaterial()
    material.color.setRGB(0, 68 / 255, 0)
    material.opacity = 0.8
    @innerMesh = new THREE.Mesh geometry, material
    @innerMesh.rotateAboutWorldAxis(THREE.AxisX, Math.PI / 2)
    @controller.scene.add @innerMesh

  remove: ->
    @controller.scene.remove @innerMesh
    @controller.scene.remove @outerMesh

  update: (position, health) ->
    @outerMesh.position.set(position.x, position.y, position.z - 0.2)
    @innerMesh.position.set(position.x, position.y, position.z - 0.1)
    @innerMesh.scale.set(health / @maxHealth, health / @maxHealth, health / @maxHealth)

class Movable
  maxHealth: 100
  healthRadius: 10
  mass: 1
  solid: true
  radius: 10
  rotationalVelocity: 0
  alive: true

  constructor: (options) ->
    @controller = options.controller
    @universe = options.universe

    @mesh = @buildMesh()
    @mesh.rotateAboutWorldAxis THREE.AxisZ, 0.001 # hack to fix a bug in ThreeJS?
    @controller.scene.add @mesh

    @velocity = @mesh.velocity = new THREE.Vector3 0, 0, 0
    @position = @mesh.position = new THREE.Vector3 0, 0, 500
    @rotation = 0
    @health = @maxHealth

    @universe.masses.push this

    if @solid
      @healthBall = new HealthBall {
        controller: @controller
        position: @position
        maxHealth: @maxHealth
        radius: @healthRadius
      }

  buildMesh: ->
    geometry = new THREE.CubeGeometry 10, 10, 10
    material = new THREE.MeshLambertMaterial {
      ambient: 0xFF0000
      color: 0xFF0000
    }
    new THREE.Mesh geometry, material

  explode: ->
    @remove()

  remove: ->
    @controller.scene.remove @mesh
    @universe.masses = _.without @universe.masses, this
    if @solid
      @healthBall.remove()

  step: ->
    # magical force to stop 'stationary' objects
    @velocity.multiplyScalar(0.99)
    @position.addSelf @velocity
    if Math.abs(@rotationalVelocity) > 0
      @mesh.rotateAboutWorldAxis(THREE.AxisZ, @rotationalVelocity)
      @rotation = (@rotation + @rotationalVelocity) % (Math.PI * 2)

    if @solid
      @healthBall.update @position, @health

  overlaps: (other) ->
    return false if other == this
    x = @position.x - other.position.x
    y = @position.y - other.position.y
    max = (other.radius + @radius)
    if x < max && y < max
      diff = Math.sqrt( x * x + y * y )
      diff < max
    else
      false

  handleCollision: (other) ->
    return unless @solid and other.solid

    # calculate elastic collision response
    # source http://www.themcclungs.net/physics/download/H/Momentum/ElasticCollisions.pdf
    v1i = @velocity
    v2i = other.velocity
    m1 = @mass
    m2 = other.mass

    @velocity = v1i.clone().multiplyScalar((m1 - m2) / (m2 + m1)).addSelf(
      v2i.clone().multiplyScalar((2 * m2) / (m2 + m1))).multiplyScalar(0.75)

    other.velocity = v1i.clone().multiplyScalar((2 * m1) / (m2 + m1)).addSelf(
      v2i.clone().multiplyScalar((m2 - m1) / (m2 + m1))).multiplyScalar(0.75)

    # make sure the objects are no longer touching,
    # otherwise hack away until they aren't
    if @overlaps other
      @velocity.x += Math.random() - 0.5
      @velocity.y += Math.random() - 0.5
      while @overlaps other
        @position.addSelf(@velocity)
        other.position.addSelf(other.velocity)

$(document).ready ->
    unless Detector.webgl
      Detector.addGetWebGLMessage()
      return

    new Controller $('#container')
