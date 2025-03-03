import * as THREE from 'three'

export function rotateAboutObjectAxis(mesh: THREE.Mesh, axis: THREE.Vector3, radians: number) {
  mesh.rotateOnAxis(axis, radians)
  //var rotationMatrix;
  //rotationMatrix = new THREE.Matrix4();
  //rotationMatrix.makeRotationAxis(axis.normalize(), radians);
  //mesh.matrix.multiply(rotationMatrix);
  //return mesh.rotation.setFromRotationMatrix(mesh.matrix);
};

export function rotateAboutWorldAxis(mesh: THREE.Mesh, axis: THREE.Vector3, radians: number) {
  mesh.rotateOnWorldAxis(axis, radians)
  //var rotWorldMatrix = new THREE.Matrix4();
  //rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
  
  //// Save the object's original matrix
  //var originalMatrix = mesh.matrix.clone();
  
  //// Set to the rotation matrix
  //mesh.matrix = rotWorldMatrix;
  
  //// Apply the original position/rotation/scale
  //mesh.matrix.multiply(originalMatrix);
  
  //// Update rotation from matrix
  //mesh.rotation.setFromRotationMatrix(mesh.matrix);
  
  //return mesh.rotation;
};