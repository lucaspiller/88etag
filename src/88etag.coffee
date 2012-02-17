class Controller
  VIEW_ANGLE = 45
  NEAR = 1
  FAR = 1000
  CAMERA_Z = 1000

  constructor: (@container) ->
    @setupRenderer()
    @setupScene()
    @universe = new Universe this
    @render()

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
    @trails = new TrailsContainer {
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

class Movable
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

    @universe.masses.push this

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

class ShipTrail extends Movable
  solid: false

  constructor: (options) ->
    super options

  buildMesh: ->
    geometry = new THREE.SphereGeometry 1
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (position, velocity) ->
    @position.set position.x, position.y, position.z - 10
    @velocity.set (Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4, 0
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)
    @lifetime = 40
    @alive = true

  remove: ->
    @alive = false
    @position.z = @controller.NEAR
    @universe.trails.addToPool this

  step: ->
    if @alive
      if @lifetime > 0
        @position.addSelf @velocity
        @mesh.material.opacity = @lifetime / 30
        @lifetime--
      else
        @remove()

class TrailsContainer
  constructor: (options) ->
    @universe = options.universe
    @controller = options.controller
    @pool = []

  addToPool: (trail) ->
    @pool.push trail

  newShipTrail: (parent) ->
    for i in [1..2]
      trail = @pool.pop()
      unless trail
        trail = new ShipTrail {
          controller: @controller
          universe: @universe
        }
      trail.setup parent.position, parent.velocity

$(document).ready ->
    unless Detector.webgl
      Detector.addGetWebGLMessage()
      return

    new Controller $('#container')
