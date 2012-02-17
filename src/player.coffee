class Player extends Movable
  constructor: (controller) ->
    super controller
    @velocity.set Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, 0

  buildMesh: ->
    geometry = new THREE.CubeGeometry 1, 3, 1
    material = new THREE.MeshBasicMaterial {
      color: 0x5E574B
    }
    new THREE.Mesh geometry, material

class LocalPlayer extends Player
  step: ->
    super
    @controller.camera.position.x = @position.x
    @controller.camera.position.y = @position.y
