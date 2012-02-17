class Player extends Movable
  constructor: (controller) ->
    super controller

  buildMesh: ->
    geometry = new THREE.CubeGeometry 1, 3, 1
    material = new THREE.MeshLambertMaterial {
      color: 0x5E574B
    }
    new THREE.Mesh geometry, material

  rotateLeft: ->
    @rotationalVelocity = Math.PI / 64

  rotateRight: ->
    @rotationalVelocity = -Math.PI / 64

  step: ->
    if Math.abs(@rotationalVelocity) > 0.01
      @rotationalVelocity *= 0.9
    else
      @rotationalVelocity = 0
    @mesh.rotateAboutObjectAxis(THREE.AxisY, Math.PI / 128)
    super

class LocalPlayer extends Player
  step: ->
    for key in @universe.keys
      switch key
        when 37 # left
          @rotateLeft()
        when 39 # right
          @rotateRight()

    super
    @controller.camera.position.x = @position.x
    @controller.camera.position.y = @position.y
