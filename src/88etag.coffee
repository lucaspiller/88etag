class Controller
  VIEW_ANGLE = 45
  NEAR = 1
  FAR = 1000
  CAMERA_Z = 1000

  models: [
    'models/ship_basic.js'
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

  width: ->
    window.innerWidth

  height: ->
    window.innerHeight

  load: ->
    @geometries = {}
    loader = new THREE.JSONLoader()
    for model in @models
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
    @buildPlayer()
    @bindKeys()

  buildPlayer: ->
    @player = new LocalPlayer {
      controller: @controller,
      universe: this
    }

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

  checkCollisions: ->
    for m1 in @masses
      if m1.solid
        for m2 in @masses
          if m2.solid and m1.mass < m2.mass and m1.overlaps m2
            m1.handleCollision m2
    true

class HealthBall
  constructor: (options) ->
    @controller = options.controller
    @position = options.position
    @healthMax = options.healthMax
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

  update: (position, health) ->
    @outerMesh.position.set(position.x, position.y, position.z - 0.2)
    @innerMesh.position.set(position.x, position.y, position.z - 0.1)
    @innerMesh.scale.set(health / @healthMax, health / @healthMax, 1)

class Movable
  healthMax: 100
  healthRadius: 10
  mass: 1
  solid: true
  radius: 10
  rotationalVelocity: 0

  constructor: (options) ->
    @controller = options.controller
    @universe = options.universe

    @mesh = @buildMesh()
    @mesh.rotateAboutWorldAxis THREE.AxisZ, 0.001 # hack to fix a bug in ThreeJS?
    @controller.scene.add @mesh

    @velocity = @mesh.velocity = new THREE.Vector3 0, 0, 0
    @position = @mesh.position = new THREE.Vector3 0, 0, 500
    @rotation = 0
    @health = @healthMax

    @universe.masses.push this

    if @solid
      @healthBall = new HealthBall {
        controller: @controller
        position: @position
        healthMax: @healthMax
        radius: @healthRadius
      }

  buildMesh: ->
    geometry = new THREE.CubeGeometry 10, 10, 10
    material = new THREE.MeshLambertMaterial {
      ambient: 0xFF0000
      color: 0xFF0000
    }
    new THREE.Mesh geometry, material

  step: ->
    # magical force to stop large objects
    if @mass >= 1000
      @velocity.multiplyScalar(0.99)
    @position.addSelf @velocity
    if Math.abs(@rotationalVelocity) > 0
      @mesh.rotateAboutWorldAxis(THREE.AxisZ, @rotationalVelocity)
      @rotation = (@rotation + @rotationalVelocity) % (Math.PI * 2)

    if @solid
      @healthBall.update @position, @health

  overlaps: (other) ->
    return false if other == this
    diff = @position.clone().subSelf(other.position).length()
    diff < (other.radius + @radius)

  handleCollision: (other) ->
    x = @position.clone().subSelf(other.position).normalize()
    v1 = @velocity.clone()
    x1 = x.dot(v1)
    v1x = x.clone().multiplyScalar(x1)
    v1y = v1.clone().subSelf(v1x)
    m1 = @mass

    x = x.multiplyScalar(-1)
    v2 = other.velocity.clone()
    x2 = x.dot(v2)
    v2x = x.clone().multiplyScalar(x2)
    v2y = v2.clone().subSelf(v2x)
    m2 = other.mass

    @velocity = v1x.clone().multiplyScalar((m1 - m2) / (m1 + m2)).addSelf(v2x.multiplyScalar((2 * m2) / (m1 + m2)).addSelf(v1y)).multiplyScalar(0.75)
    @acceleration = new THREE.Vector3 0, 0, 0

    if other.mass < 1000
      other.velocity = v1x.clone().multiplyScalar((2 * m1) / (m1 + m2)).addSelf(v2x.multiplyScalar((m2 - m1) / (m1 + m2)).addSelf(v2y)).multiplyScalar(0.75)
      other.acceleration = new THREE.Vector3 0, 0, 0

    # check that both velocities aren't zero, if so set the
    # velocity of the object with the smallest mass to be the normal
    if @velocity.length() == 0 and other.velocity.length() == 0
      if m1 < m2
        @velocity = x.clone().multiplyScalar -1
      else
        other.velocity = x.clone().multiplyScalar 1

    # make sure the objects are no longer touching,
    # otherwise hack away until they aren't
    while @overlaps other
      @position.addSelf(@velocity)
      other.position.addSelf(other.velocity)

$(document).ready ->
    unless Detector.webgl
      Detector.addGetWebGLMessage()
      return

    new Controller $('#container')
