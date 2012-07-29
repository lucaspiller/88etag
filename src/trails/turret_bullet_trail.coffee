Trail = require 'trails/trail'

class TurretBulletTrail extends Trail
  max_lifetime: 5
  max_opacity: 0.5
  min_opacity: 0

  buildMesh: ->
    geometry = new THREE.SphereGeometry 1
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (position) ->
    super
    @velocity.set (Math.random() - 0.5) / 2, (Math.random() - 0.5) / 2, 0
    @mesh.material.color.setRGB(100, 100, 100)

  remove: ->
    super
    @universe.trails.addToTurretBulletTrailPool this

module.exports = Trail
