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

class Player
  constructor: (@controller) ->
    geometry = new THREE.TorusGeometry( 1, 0.42, 16, 16 )
    material = new THREE.MeshLambertMaterial {
      color: 0xCC0000
    }
    @mesh = new THREE.Mesh geometry, material
    @mesh.position.set(0, 0, 90)
    @controller.scene.add @mesh

#  sphereMaterial);

$(document).ready ->
    unless Detector.webgl
      Detector.addGetWebGLMessage()
      return

    new Controller $('#container')
