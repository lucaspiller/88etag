class Player extends Movable
  constructor: (controller) ->
    super controller
    @max_speed = 0.5
    @max_accel = 0.01
    @acceleration = new THREE.Vector3 0, 0, 0

  buildMesh: ->
    geometry = new THREE.CubeGeometry 3, 1, 1
    material = new THREE.MeshLambertMaterial {
      color: 0x5E574B
    }
    new THREE.Mesh geometry, material

  rotateLeft: ->
    @rotationalVelocity = Math.PI / 64

  rotateRight: ->
    @rotationalVelocity = -Math.PI / 64

  forward: ->
    @acceleration.x = Math.cos(@rotation)
    @acceleration.y = Math.sin(@rotation)
    accel = @acceleration.length()
    if accel > @max_accel
      @acceleration.multiplyScalar @max_accel / accel

  backward: ->
    @acceleration.x = -Math.cos(@rotation)
    @acceleration.y = -Math.sin(@rotation)
    accel = @acceleration.length()
    if accel > @max_accel
      @acceleration.multiplyScalar @max_accel / accel

  step: ->
    @velocity.addSelf @acceleration
    @acceleration.multiplyScalar 0
    speed = @velocity.length()
    if speed > @max_speed
      @velocity.multiplyScalar @max_speed / speed

    if Math.abs(@rotationalVelocity) > 0.01
      @rotationalVelocity *= 0.9
    else
      @rotationalVelocity = 0
    @mesh.rotateAboutObjectAxis(THREE.AxisX, Math.PI / 128)
    super

class LocalPlayer extends Player
  step: ->
    for key in @universe.keys
      switch key
        when 37 # left
          @rotateLeft()
        when 39 # right
          @rotateRight()
        when 38 # up
          @forward()
        when 40 # down
          @backward()

    super
    @controller.camera.position.x = @position.x
    @controller.camera.position.y = @position.y
