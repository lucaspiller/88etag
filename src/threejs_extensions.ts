import * as THREE from 'three'

THREE.Mesh.prototype.rotateAboutObjectAxis = function(axis: THREE.Vector3, radians: number) {
  var rotationMatrix;
  rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationAxis(axis.normalize(), radians);
  this.matrix.multiply(rotationMatrix);
  return this.rotation.setFromRotationMatrix(this.matrix);
};

THREE.Mesh.prototype.rotateAboutWorldAxis = function(axis: THREE.Vector3, radians: number) {
  var rotationMatrix;
  rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationAxis(axis.normalize(), radians);
  rotationMatrix.multiply(this.matrix);
  this.matrix = rotationMatrix;
  return this.rotation.setFromRotationMatrix(this.matrix);
};