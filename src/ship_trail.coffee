Trail = require 'trail'

class ShipTrail extends Trail
  max_lifetime: 30
  max_opacity: 1
  min_opacity: 0

  buildMesh: ->
    geometry = new THREE.SphereGeometry 1
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (position) ->
    super
    @velocity.set (Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4, 0
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)

  remove: ->
    super
    @universe.trails.addToShipTrailPool this

module.exports = ShipTrail
