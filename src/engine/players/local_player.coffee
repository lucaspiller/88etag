import { Player } from './player.coffee'
import { Turret } from '../weapons/turret.coffee'
import { MassDriver } from '../weapons/mass_driver.coffee'
import { PowerPlant } from '../structures/power_plant.coffee'

export class LocalPlayer extends Player
  step: ->
    super()
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
          when 80 # p
            @buildPowerPlant()
            @universe.keys = _.without @universe.keys, 80 # TODO hack

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

  buildPowerPlant: ->
    position = @positionFor(PowerPlant)
    overlap = @universe.anythingOverlaps(position, PowerPlant::radius)
    if overlap
      console.log('power plant would overlap', overlap)
    else
      powerPlant = new PowerPlant {
        universe: @universe,
        controller: @controller,
        position: position,
        parent: this
      }

  isLocal: ->
    true
