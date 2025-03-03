THREE.Mesh.prototype.rotateAboutObjectAxis = function(axis, radians) {
  var rotationMatrix;
  rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationAxis(axis.normalize(), radians);
  this.matrix.multiplySelf(rotationMatrix);
  return this.rotation.getRotationFromMatrix(this.matrix);
};

THREE.Mesh.prototype.rotateAboutWorldAxis = function(axis, radians) {
  var rotationMatrix;
  rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationAxis(axis.normalize(), radians);
  rotationMatrix.multiplySelf(this.matrix);
  this.matrix = rotationMatrix;
  return this.rotation.getRotationFromMatrix(this.matrix);
};

THREE.AxisX = new THREE.Vector3(1, 0, 0);
THREE.AxisY = new THREE.Vector3(0, 1, 0);
THREE.AxisZ = new THREE.Vector3(0, 0, 1);
