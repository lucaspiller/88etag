Player = require './player'
Turret = require '../weapons/turret'
MassDriver = require '../weapons/mass_driver'

class LocalPlayer extends Player
  step: ->
    super
    if @ship
      for key in @universe.keys
        switch key
          when 37 # left
            @ship.rotateLeft()
          when 39 # right
            @ship.rotateRight()
          when 38 # up
            @ship.forward()
          when 40 # down
            @ship.backward()
          when 68 # d
            @ship.fire()
          when 81 # q
            @buildTurret()
            @universe.keys = _.without @universe.keys, 81 # TODO hack
          when 87 # w
            @buildMassDriver()
            @universe.keys = _.without @universe.keys, 87 # TODO hack

      @controller.camera.position.x = @ship.position.x
      @controller.camera.position.y = @ship.position.y

  positionFor: (type) ->
    position = @ship.position.clone()
    position.x += Math.sin((Math.PI / 2) - @ship.rotation) * (type::radius + (@ship.radius * 2))
    position.y += Math.cos((Math.PI / 2) - @ship.rotation) * (type::radius + (@ship.radius * 2))
    position

  buildTurret: ->
    position = @positionFor(Turret)
    overlap = @universe.anythingOverlaps(position, Turret::radius)
    if overlap
      console.log('turret would overlap', overlap)
    else
      turret = new Turret {
        universe: @universe,
        controller: @controller,
        position: position,
        parent: this
      }

  buildMassDriver: ->
    position = @positionFor(MassDriver)
    overlap = @universe.anythingOverlaps(position, MassDriver::radius)
    if overlap
      console.log('mass driver would overlap', overlap)
    else
      massdriver = new MassDriver {
        universe: @universe,
        controller: @controller,
        position: position,
        parent: this
      }

module.exports = LocalPlayer
