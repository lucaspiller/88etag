import * as THREE from 'three'
import { AxisX } from '../axis'
import { rotateAboutWorldAxis } from '../../threejs_extensions'

export class PowerRadiusVisualizer
  constructor: (options) ->
    @controller = options.controller
    @position = options.position
    @radius = options.radius

    @buildMesh()

  buildMesh: ->
    geometry = new THREE.CylinderGeometry @radius, @radius, 0.1, 64
    material = new THREE.MeshBasicMaterial({ 
      color: 0x0022AA, 
      transparent: true, 
      opacity: 0.15,
      side: THREE.DoubleSide
    })

    @mesh = new THREE.Mesh geometry, material
    rotateAboutWorldAxis(@mesh, AxisX, Math.PI / 2)
    @controller.scene.add @mesh

  remove: ->
    @controller.scene.remove(@mesh)

  update: (position) ->
    @mesh.position.set(position.x, position.y, position.z - 0.2) 