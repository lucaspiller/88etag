class Player extends Movable
  buildMesh: ->
    geometry = new THREE.CubeGeometry 1, 3, 1
    material = new THREE.MeshBasicMaterial {
      color: 0x5E574B
    }
    new THREE.Mesh geometry, material
