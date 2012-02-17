class Controller
  VIEW_ANGLE = 45
  NEAR = 1
  FAR = 100
  CAMERA_Z = 100

  constructor: (@container) ->
    @setupRenderer()
    @setupScene()
    new Universe this
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

    # add a light source
    @light = new THREE.PointLight 0xffffff
    @light.position.set 0, 0, CAMERA_Z * 10
    @scene.add @light

  width: ->
    window.innerWidth

  height: ->
    window.innerHeight

  render: ->
    requestAnimationFrame (=> @render())
    @_render()
    if @stats
      @stats.update()

  _render: ->
    @renderer.render @scene, @camera

class Universe
  constructor: (@controller) ->
    @buildPlayer()

  buildPlayer: ->
    new Player @controller

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

$(document).ready ->
    unless Detector.webgl
      Detector.addGetWebGLMessage()
      return

    new Controller $('#container')
