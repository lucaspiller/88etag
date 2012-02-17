class Player extends Movable
  radius: 20
  mass: 1
  max_speed: 2
  max_accel: 0.05

  constructor: (options) ->
    super options
    @acceleration = new THREE.Vector3 0, 0, 0
    @commandCentre = new CommandCentre options
    @position.y = @commandCentre.position.y - @commandCentre.radius

    @rotation = Math.PI * 1.5
    @mesh.rotateAboutObjectAxis(THREE.AxisZ, @rotation)

  buildMesh: ->
    geometry = new THREE.CubeGeometry 20, 15, 15
    material = new THREE.MeshLambertMaterial {
      ambient: 0x5E574B
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
    @universe.trails.newShipTrail this
    @mesh.rotateAboutObjectAxis(THREE.AxisX, Math.PI / 128)

  backward: ->
    @acceleration.x = -Math.cos(@rotation)
    @acceleration.y = -Math.sin(@rotation)
    accel = @acceleration.length()
    if accel > @max_accel
      @acceleration.multiplyScalar @max_accel / accel
    @universe.trails.newShipTrail this
    @mesh.rotateAboutObjectAxis(THREE.AxisX, -Math.PI / 128)

  step: ->
    @commandCentre.step()

    @velocity.addSelf @acceleration
    @acceleration.multiplyScalar 0
    speed = @velocity.length()
    if speed > @max_speed
      @velocity.multiplyScalar @max_speed / speed

    if Math.abs(@rotationalVelocity) > 0.01
      @rotationalVelocity *= 0.9
    else
      @rotationalVelocity = 0
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

class CommandCentre extends Movable
  mass: 999999999999999999
  radius: 40
  rotationalVelocity: Math.PI / 512

  constructor: (options) ->
    super options

  buildMesh: ->
    geometry = new THREE.TorusGeometry 50, 3, 40, 40, Math.PI * 2
    material = new THREE.MeshLambertMaterial {
      ambient: 0x606162
      color: 0x606162
    }
    new THREE.Mesh geometry, material
