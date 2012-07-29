ShipTrail = require './ship_trail'
TurretBulletTrail = require './turret_bullet_trail'

class TrailsStorage
  constructor: (options) ->
    @universe = options.universe
    @controller = options.controller
    @shipTrailPool = []
    @turretBulletTrailPool = []

  addToShipTrailPool: (trail) ->
    @shipTrailPool.push trail

  addToTurretBulletTrailPool: (trail) ->
    @turretBulletTrailPool.push trail

  newShipTrail: (parent) ->
    for i in [1..2]
      trail = @shipTrailPool.pop()
      unless trail
        trail = new ShipTrail {
          controller: @controller
          universe: @universe
        }
      trail.setup parent.position

  newTurretBulletTrail: (parent) ->
    trail = @turretBulletTrailPool.pop()
    unless trail
      trail = new TurretBulletTrail {
        controller: @controller
        universe: @universe
      }
    trail.setup parent.position

module.exports = TrailsStorage
