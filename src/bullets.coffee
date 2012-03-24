class BulletsStorage
  constructor: (options) ->
    @universe = options.universe
    @controller = options.controller
    @shipBulletPool = []
    @turretBulletPool = []

  addToShipBulletPool: (bullet) ->
    @shipBulletPool.push bullet

  addToTurretBulletPool: (bullet) ->
    @turretBulletPool.push bullet

  newShipBullet: (parent) ->
    bullet = @shipBulletPool.pop()
    unless bullet
      bullet = new ShipBullet {
        controller: @controller
        universe: @universe
      }
    bullet.setup parent

  newTurretBullet: (parent) ->
    bullet = @turretBulletPool.pop()
    unless bullet
      bullet = new TurretBullet {
        controller: @controller
        universe: @universe
      }
    bullet.setup parent

class Bullet extends Movable
  HIDDEN_Z = 2000

  solid: false
  mass: 0

  constructor: (options) ->
    super options

  setup: (@parent) ->
    @position.set @parent.position.x, @parent.position.y, @parent.position.z - 10
    @rotation = @parent.rotation - (Math.PI * 1.5)
    @mesh.rotateAboutObjectAxis(THREE.AxisZ, @rotation)
    @velocity.x = Math.cos @parent.rotation
    @velocity.y = Math.sin @parent.rotation
    @alive = true

  remove: ->
    @controller.client.objectDestroyed this
    @alive = false
    @position.z = HIDDEN_Z
    @mesh.rotateAboutObjectAxis(THREE.AxisZ, -@rotation)

  step: ->
    if @alive
      if @lifetime > 0
        @position.addSelf @velocity
        @lifetime--
      else
        @remove()

  handleCollision: (other) ->
    return unless other.solid
    return if other == @parent
    other.health -= @damage
    if other.health <= 0
      other.explode()
    @remove()

class ShipBullet extends Bullet
  type: 'shipBullet'
  damage: 100
  radius: 5

  setup: (@parent) ->
    super
    @velocity.multiplyScalar 6
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)
    @lifetime = 100
    @controller.client.objectCreated this

  remove: ->
    super
    @universe.bullets.addToShipBulletPool this

class TurretBullet extends Bullet
  type: 'turretBullet'
  damage: 100
  radius: 5

  setup: (@parent) ->
    super
    @velocity.multiplyScalar 6
    @mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255)
    @lifetime = 100
    @controller.client.objectCreated this

  remove: ->
    super
    @universe.bullets.addToTurretBulletPool this

  step: ->
    super
    if @alive
      @universe.trails.newTurretBulletTrail this
