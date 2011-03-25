Gt = window.Gt = {}

class Controller
  constructor: (canvas) ->
    @canvas = canvas
    @setupCanvas()
    @setupInput()
    @start()

  setupCanvas: ->
    [@canvas.width, @canvas.height] = [$(window).width() - 50, $(window).height() - 50]

  setupInput: ->
    @setupKeys()

  setupKeys: ->
    $(window).keydown (e) =>
      ship = @universe.ship
      switch e.which
        when 37       # left
          ship.rotate(-1)
        when 39       # right
          ship.rotate(+1)
        when 38       # up
          ship.thrust()

    $(window).keyup (e) =>
      switch e.which
        when 37, 39
          @universe.ship.rotate(0)

  start: ->
    @universe = new Universe { canvas: @canvas }
    @universe.start()
Gt.Controller = Controller

class Universe
  constructor: (options) ->
    @canvas = options?.canvas
    @masses = new MassStorage
    @tick = 0
    @buildShip()

  start: ->
    @setupCanvas()
    @loop()

  setupCanvas: ->
    @viewpoint = new Viewpoint @canvas
    @ctx = @canvas.getContext '2d'
    @ctx.fillStyle = 'rgb(255, 255, 255)'
    @ctx.strokeStyle = 'rgb(255, 255, 255)'

  loop: ->
    @step()
    @render()
    setTimeout (=> @loop()), 1000/24

  step: ->
    @tick += 1
    @masses.step()

  render: ->
    @viewpoint.update @ship if @ship?

    ctx = @ctx
    ctx.clearRect 0, 0, @canvas.width, @canvas.height
    ctx.save()
    @viewpoint.translate ctx
    @masses.render ctx
    ctx.restore()

  buildShip: ->
    [w, h] = [@canvas?.width, @canvas?.height]
    [x, y] = [Math.random() * w/2 + w/4, Math.random() * h/2 + h/4]

    @ship = new Ship {
      position: new Vector x, y
      rotation: -Math.PI / 2
    }
    @add @ship

  add: (mass) ->
    @masses.add mass
    mass.universe = this
    mass.tick ?= @tick

  update: (mass) ->
    existing = @masses.find(mass)
    if not existing? or existing.ntick < mass.ntick
      mass.universe = this
      @masses.update mass

  remove: (mass) ->
    @masses.remove mass

Gt.Universe = Universe

class MassStorage
  constructor: ->
    @items = {}
    @length = 0

  find: (mass) ->
    @items[@key mass]

  add: (mass) ->
    return if @find(mass)?
    @length++
    @set mass

  update: (mass) ->
    if @find(mass)?
      @set mass
    else
      @add mass

  remove: (mass) ->
    return unless @find(mass)?
    @length--
    delete @items[@key mass]

  key: (mass) ->
    mass.id

  set: (mass) ->
    @items[@key mass] = mass

  render: (ctx) ->
    mass.render ctx for id, mass of @items

  step: ->
    mass.step() for id, mass of @items

class Mass
  constructor: (options) ->
    o = options or {}
    @id = Math.random(9999999999999) # TODO
    @radius = o.radius or 1
    @position = o.position or new Vector()
    @velocity = o.velocity or new Vector()
    @acceleration = o.acceleration or new Vector()
    @rotation = o.rotation or 0
    @rotationalVelocity = o.rotationalVelocity or 0
    @lifetime = o.lifetime or 24 * 60

  remove: ->
    @universe.remove this

  solid: true
  overlaps: (other) ->
    return false unless @solid and other.solid and other != this
    diff = other.position.minus(@position).length
    diff < @radius or diff < other.radius

  step: ->
    dt = @universe.tick - @tick
    return @remove() if (@lifetime -= dt) < 0

    for t in [0...dt]
      @velocity = @velocity.plus @acceleration
      @position = @position.plus @velocity
      @acceleration = @acceleration.times 0.8 # drag
      @rotation += @rotationalVelocity

    @tick = @universe.tick

  render: (ctx) ->
    ctx.save()

    ctx.translate @position.x, @position.y
    ctx.rotate @rotation
    @_render ctx

    ctx.restore()

  _render: (ctx) ->
    # debug
    ctx.strokeStyle = 'rgb(255,0,0)'
    ctx.beginPath()
    ctx.arc 0, 0, @radius, 0, Math.PI * 2, true
    ctx.closePath()
    ctx.stroke()
Gt.Mass = Mass

class ShipTrail extends Mass
  LIFETIME: 20

  type: 'ShipTrail'
  constructor: (options) ->
    ship = options.ship
    options.radius ||= 4
    options.position ||= ship.position
    options.lifetime = @LIFETIME

    super options

  _render: (ctx) ->
    alpha = @lifetime / @LIFETIME
    ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')'
    ctx.beginPath()
    ctx.arc 0, 0, @radius, 0, Math.PI * 2, true
    ctx.closePath()
    ctx.fill()
Gt.ShipTrail = ShipTrail

class Ship extends Mass
  type: 'Ship'
  value: 1000

  constructor: (options) ->
    options ||= {}
    options.radius ||= 16
    super options

  step: ->
    if this is @universe.ship
      dt = @universe.tick - @tick
      @lifetime += dt
    super()

  _render: (ctx) ->
    ctx.beginPath()
    ctx.moveTo @radius, 0
    ctx.lineTo(@radius / -4, @radius / 2.5)
    ctx.moveTo(0, @radius * 0.32)
    ctx.lineTo(0, @radius * -0.32)
    ctx.moveTo(@radius / -4, @radius / -2.5)
    ctx.lineTo @radius, 0
    ctx.stroke()

  thrust: ->
    @universe.add new ShipTrail { ship: this }
    @acceleration = @acceleration.plus(new Vector(@rotation).times(0.15))
    @universe.update this

  rotate: (dir) ->
    if (dir > 0 && @rotationalVelocity <= 0)
      @rotationalVelocity += Math.PI / 16
    else if (dir < 0 && @rotationalVelocity >= 0)
      @rotationalVelocity -= Math.PI / 16
    else if dir == 0
      @rotationalVelocity = 0
    @universe.update this
Gt.Ship = Ship

class Viewpoint
  BUFFER: 40

  constructor: (canvas) ->
    @position = new Vector 0, 0
    [@width, @height] = [canvas.width, canvas.height]

  update: (ship) ->
    # focus on centre of ship
    @position.x = ship.position.x - (@width / 2)
    @position.y = ship.position.y - (@height / 2)

  translate: (ctx) ->
    ctx.translate(-@position.x, -@position.y)

class Vector
  # can pass either x, y coords or radians for a unit vector
  constructor: (x, y) ->
    [@x, @y] = if y? then [x, y] else [Math.cos(x), Math.sin(x)]
    @x ||= 0
    @y ||= 0
    @_zeroSmall()

  plus: (v) ->
    new Vector @x + v.x, @y + v.y

  minus: (v) ->
    new Vector @x - v.x, @y - v.y

  times: (s) ->
    new Vector @x * s, @y * s

  length: ->
    Math.sqrt @x * @x + @y * @y

  normalized: ->
    @times 1.0 / @length()

  clone: ->
    new Vector @x, @y

  _zeroSmall: ->
    @x = 0 if Math.abs(@x) < 0.01
    @y = 0 if Math.abs(@y) < 0.01
Gt.Vector = Vector

# initialize
$(document).ready ->
  Gt.c = new Gt.Controller $('canvas').get 0
