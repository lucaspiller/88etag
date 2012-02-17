class Player extends Movable
  constructor: (controller) ->
    super controller
    @velocity.set Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, 0

  buildMesh: ->
    geometry = new THREE.CubeGeometry 1, 3, 1
    material = new THREE.MeshLambertMaterial {
      color: 0x5E574B
    }
    mesh = new THREE.Mesh geometry, material
    mesh.rotation.set Math.PI / 16, Math.PI / 4, 0
    mesh

class LocalPlayer extends Player
  step: ->
    super
    @controller.camera.position.x = @position.x
    @controller.camera.position.y = @position.y
