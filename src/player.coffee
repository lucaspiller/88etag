class Player extends Movable
  constructor: (controller) ->
    super controller
    @velocity.set Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, 0
    @rotationalVelocity = 0

  buildMesh: ->
    geometry = new THREE.CubeGeometry 1, 3, 1
    material = new THREE.MeshLambertMaterial {
      color: 0x5E574B
    }
    mesh = new THREE.Mesh geometry, material
    mesh.rotation.set Math.PI / 16, Math.PI / 4, 0
    mesh

  rotateLeft: ->
    @rotationalVelocity = Math.PI / 64

  rotateRight: ->
    @rotationalVelocity = -Math.PI / 64

  step: ->
    if Math.abs(@rotationalVelocity) > 0.01
      @rotationalVelocity *= 0.9
    else
      @rotationalVelocity = 0
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
