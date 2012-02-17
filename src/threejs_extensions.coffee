THREE.Mesh.prototype.rotateAboutObjectAxis = (axis, radians) ->
  rotationMatrix = new THREE.Matrix4()
  rotationMatrix.setRotationAxis axis.normalize(), radians
  @matrix.multiplySelf rotationMatrix
  @rotation.setRotationFromMatrix @matrix

THREE.Mesh.prototype.rotateAboutWorldAxis = (axis, radians) ->
  rotationMatrix = new THREE.Matrix4()
  rotationMatrix.setRotationAxis axis.normalize(), radians
  rotationMatrix.multiplySelf @matrix
  @matrix = rotationMatrix
  @rotation.setRotationFromMatrix @matrix
