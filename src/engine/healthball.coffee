import * as THREE from 'three'
import { AxisX } from './axis'

export class HealthBall
  constructor: (options) ->
    @controller = options.controller
    @position = options.position
    @maxHealth = options.maxHealth
    @radius = options.radius

    @buildMeshes()

  buildMeshes: ->
    geometry = new THREE.CylinderGeometry @radius, @radius, 0.1, 16
    material = new THREE.MeshBasicMaterial()
    material.transparent = true
    material.color.setRGB(0, 25 / 255, 0)
    material.opacity = 0.1
    @outerMesh = new THREE.Mesh geometry, material
    @outerMesh.rotateAboutWorldAxis(AxisX, Math.PI / 2)
    @controller.scene.add @outerMesh

    geometry = new THREE.CylinderGeometry @radius, @radius, 0.1, 16
    material = new THREE.MeshBasicMaterial()
    material.transparent = true
    material.color.setRGB(0, 68 / 255, 0)
    material.opacity = 0.8
    @innerMesh = new THREE.Mesh geometry, material
    @innerMesh.rotateAboutWorldAxis(AxisX, Math.PI / 2)
    @controller.scene.add @innerMesh

  remove: ->
    @controller.scene.remove @innerMesh
    @controller.scene.remove @outerMesh

  update: (position, health) ->
    @outerMesh.position.set(position.x, position.y, position.z - 0.2)
    @innerMesh.position.set(position.x, position.y, position.z - 0.1)
    @innerMesh.scale.set(health / @maxHealth, health / @maxHealth, health / @maxHealth)
