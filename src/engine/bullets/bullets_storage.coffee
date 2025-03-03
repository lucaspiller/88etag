import { ShipBullet } from './ship_bullet.coffee'
import { TurretBullet } from './turret_bullet.coffee'

export class BulletsStorage
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
