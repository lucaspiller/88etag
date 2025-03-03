import { Bullet } from './bullet.coffee'

export class TurretBullet extends Bullet
  damage: 100
  radius: 5

  buildMesh: ->
    geometry = new THREE.CylinderGeometry(2, 1, 10, 10)
    material = new THREE.MeshBasicMaterial
    new THREE.Mesh geometry, material

  setup: (@parent) ->
    super(@parent)
    @velocity.multiplyScalar 6
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)
    @lifetime = 100

  remove: ->
    super()
    @universe.bullets.addToTurretBulletPool this

  step: ->
    super()
    if @alive
      @universe.trails.newTurretBulletTrail this