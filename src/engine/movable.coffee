import * as THREE from 'three'
import { HealthBall } from './healthball.coffee'
import { AxisZ, AxisY, AxisX } from './axis'
import { rotateAboutWorldAxis } from '../threejs_extensions'

export class Movable
  COEF_OF_RESTITUTION: 0.75

  maxHealth: 100
  healthRadius: 10
  mass: 1
  solid: true
  radius: 10
  rotationalVelocity: 0
  alive: true

  constructor: (options) ->
    @controller = options.controller
    @universe = options.universe

    @mesh = @buildMesh(options)
    if !@mesh || !@mesh.isObject3D
      console.error("buildMesh() must return a Object3D, Mesh or Group", @mesh, this)

    @controller.scene.add @mesh

    @velocity = new THREE.Vector3 0, 0, 0

    @position = @mesh.position
    @position.set(0, 0, 500)

    if options.position
      @position.set(options.position.x, options.position.y, @position.z)

    @rotation = 0
    @health = @maxHealth

    @universe.masses.push this

    if @solid
      @healthBall = new HealthBall {
        controller: @controller
        position: @position
        maxHealth: @maxHealth
        radius: @healthRadius
      }

  buildMesh: ->
    geometry = new THREE.CubeGeometry 10, 10, 10
    material = new THREE.MeshLambertMaterial {
      color: 0xFF0000
    }
    new THREE.Mesh geometry, material

  explode: ->
    @alive = false
    @remove()

  remove: ->
    @controller.scene.remove @mesh
    @universe.masses = _.without @universe.masses, this
    if @solid
      @healthBall.remove()

  step: ->
    # magical force to stop 'stationary' objects
    @velocity.multiplyScalar(0.99)
    @position.add @velocity

    if Math.abs(@rotationalVelocity) > 0
      rotateAboutWorldAxis(@mesh, AxisZ, @rotationalVelocity)
      @rotation = (@rotation + @rotationalVelocity) % (Math.PI * 2)

    if @solid
      @healthBall.update @position, @health

  overlaps: (other) ->
    return false if other == this
    @overlapsPosition(other.position, other.radius)

  overlapsPosition: (position, radius) ->
    x = @position.x - position.x
    y = @position.y - position.y
    max = (radius + @radius)
    if x < max && y < max
      diff = Math.sqrt(x * x + y * y)
      diff <= max
    else
      false

  handleCollision: (other) ->
    return unless @solid and other.solid

    # reverse objects so they are no longer colliding (hopefully)
    @position.sub(@velocity)
    other.position.sub(other.velocity)

    # calculate elastic collision response
    # source http://www.themcclungs.net/physics/download/H/Momentum/ElasticCollisions.pdf
    v1i = @velocity
    v2i = other.velocity
    m1 = @mass
    m2 = other.mass

    @velocity = v1i.clone().multiplyScalar((m1 - m2) / (m2 + m1)).add(
      v2i.clone().multiplyScalar((2 * m2) / (m2 + m1))).multiplyScalar(@COEF_OF_RESTITUTION)

    other.velocity = v1i.clone().multiplyScalar((2 * m1) / (m2 + m1)).add(
      v2i.clone().multiplyScalar((m2 - m1) / (m2 + m1))).multiplyScalar(@COEF_OF_RESTITUTION)

    # check that both velocities aren't zero, if they are set the
    # velocity of the object with the smallest mass to be the normal
    if @velocity.length() == 0 and other.velocity.length() == 0
      @velocity = @position.clone().sub(other.position).normalize()

    # make sure the objects are no longer touching,
    # otherwise hack away until they aren't
    times = 0
    if @overlaps other
      oldVelocity = @velocity.clone()
      while @overlaps other
        times += 1
        @position.add(@velocity)
        other.position.add(other.velocity)
        if times == 100
          @velocity.x = Math.random() - 0.5
          @velocity.y = Math.random() - 0.5
      @velocity = oldVelocity
