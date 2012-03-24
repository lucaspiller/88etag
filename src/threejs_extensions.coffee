THREE.Mesh.prototype.rotateAboutObjectAxis = (axis, radians) ->
  rotationMatrix = new THREE.Matrix4()
  rotationMatrix.setRotationAxis axis.normalize(), radians
  @matrix.multiplySelf rotationMatrix
  @rotation.getRotationFromMatrix @matrix

THREE.Mesh.prototype.rotateAboutWorldAxis = (axis, radians) ->
  rotationMatrix = new THREE.Matrix4()
  rotationMatrix.setRotationAxis axis.normalize(), radians
  rotationMatrix.multiplySelf @matrix
  @matrix = rotationMatrix
  @rotation.getRotationFromMatrix @matrix

THREE.AxisX = new THREE.Vector3(1, 0, 0)
THREE.AxisY = new THREE.Vector3(0, 1, 0)
THREE.AxisZ = new THREE.Vector3(0, 0, 1)
