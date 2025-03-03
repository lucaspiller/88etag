import * as THREE from 'three'
import { Bullet } from './bullet.coffee'

export class ShipBullet extends Bullet
  damage: 100
  radius: 5

  buildMesh: ->
    geometry = new THREE.SphereGeometry 5
    material = new THREE.MeshBasicMaterial
    material.transparent = true
    material.opacity = 0.9
    new THREE.Mesh geometry, material

  setup: (@parent) ->
    super(@parent)
    @velocity.multiplyScalar 6
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)
    @lifetime = 100

  remove: ->
    super()
    @universe.bullets.addToShipBulletPool this