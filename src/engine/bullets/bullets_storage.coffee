ShipBullet = require './ship_bullet'
TurretBullet = require './turret_bullet'

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

module.exports = BulletsStorage
