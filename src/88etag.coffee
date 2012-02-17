class Controller
  VIEW_ANGLE = 45
  NEAR = 1
  FAR = 100
  CAMERA_Z = 100

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
    @light1 = new THREE.PointLight 0xffffff
    @scene.add @light1

    @light2 = new THREE.PointLight 0xffffff
    @scene.add @light2

    @light3 = new THREE.PointLight 0xffffff
    @scene.add @light3

  width: ->
    window.innerWidth

  height: ->
    window.innerHeight

  render: ->
    requestAnimationFrame (=> @render())

    @universe.step()

    @light1.position.set @camera.position.x + 100, @camera.position.y + 100, 10
    @light2.position.set @camera.position.x - 100, @camera.position.y - 100, 10
    @light3.position.set @camera.position.x, @camera.position.y, CAMERA_Z * 10
    @renderer.render @scene, @camera

    @stats.update() if @stats

class Universe
  constructor: (@controller) ->
    @starfield = new Starfield @controller
    @buildPlayer()
    @bindKeys()

  buildPlayer: ->
    @player = new LocalPlayer @controller

  bindKeys: ->
    @keys = []

    $(window).keydown (e) =>
      @keys.push e.which

    $(window).keyup (e) =>
      @keys = _.without @keys, e.which

  step: ->
    @starfield.step()
    @player.step()

class Movable
  constructor: (@controller) ->
    @mesh = @buildMesh()
    @velocity = @mesh.velocity = new THREE.Vector3 0, 0, 0
    @position = @mesh.position = new THREE.Vector3 0, 0, 90
    @controller.scene.add @mesh

  buildMesh: ->
    geometry = new THREE.CubeGeometry 1, 1, 1
    material = new THREE.MeshLambertMaterial {
      color: 0xFF0000
    }
    new THREE.Mesh geometry, material

  step: ->
    @position.addSelf @velocity

$(document).ready ->
    unless Detector.webgl
      Detector.addGetWebGLMessage()
      return

    new Controller $('#container')
