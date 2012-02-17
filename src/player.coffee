class Player
  constructor: (@controller) ->
    geometry = new THREE.TorusGeometry(1, 0.42, 16, 16)
    material = new THREE.MeshLambertMaterial {
      color: 0xCC0000
    }
    @mesh = new THREE.Mesh geometry, material
    @mesh.position.set(0, 0, 90)
    @controller.scene.add @mesh
