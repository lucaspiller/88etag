class MeshFactory
  constructor: (@controller) ->
    true

  turretBase: ->
    material = new THREE.MeshFaceMaterial
    geometry = @controller.geometries['models/turret_base.js']
    for material in geometry.materials
      material.shading = THREE.FlatShading
    @buildMesh(material, geometry)

  turret: ->
    material = new THREE.MeshFaceMaterial
    geometry = @controller.geometries['models/turret.js']
    for material in geometry.materials
      material.shading = THREE.FlatShading
    @buildMesh(material, geometry)

  massDriver: ->
    material = new THREE.MeshLambertMaterial {
      ambient: 0x5B3C1D
      color: 0x5B3C1D
    }
    geometry = @controller.geometries['models/mass_driver.js']
    @buildMesh(material, geometry)

  playerShip: ->
    material = new THREE.MeshLambertMaterial {
      ambient: 0x5E574B
      color: 0x5E574B
    }
    geometry = @controller.geometries['models/ship_basic.js']
    @buildMesh(material, geometry)

  commandCentreInner: ->
    material = new THREE.MeshFaceMaterial
    geometry = @controller.geometries['models/command_centre_inner.js']
    @buildMesh(material, geometry)

  commandCentre: ->
    material = new THREE.MeshFaceMaterial
    geometry = @controller.geometries['models/command_centre.js']
    @buildMesh(material, geometry)

  buildMesh: (material, geometry) ->
    new THREE.Mesh geometry, material
