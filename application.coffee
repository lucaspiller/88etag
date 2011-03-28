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
      @universe.keyDown e.which

    $(window).keyup (e) =>
      @universe.keyUp e.which

  start: ->
    @universe = new Universe { canvas: @canvas }
    @universe.start()
Gt.Controller = Controller

class Universe
  LOOP_TARGET = 1000/24

  constructor: (options) ->
    @canvas = options?.canvas
    @masses = new MassStorage
    @starfield = new Starfield
    @keys = []
    @tick = 0
    @buildPlayer()

  start: ->
    @setupCanvas()
    @starfield.generate @viewpoint
    @loop()

  setupCanvas: ->
    @viewpoint = new Viewpoint @canvas
    @ctx = @canvas.getContext '2d'
    @ctx.fillStyle = 'rgb(255, 255, 255)'
    @ctx.strokeStyle = 'rgb(255, 255, 255)'

  loop: ->
    start = new Date().getTime()
    @checkInput()
    @checkCollisions()
    @step()
    @render()
    time = new Date().getTime() - start
    delay = @LOOP_TARGET - time
    if delay < 0
      console.log 'Frame took ' + time + 'ms'
      delay = 0

    setTimeout (=> @loop()), delay

  keyDown: (key) ->
    @keys.push key

  keyUp: (key) ->
    @keys = _.without @keys, key

    # stop ship rotation
    switch key
      when 37, 39
        @ship.rotate(0)

  checkInput: ->
    for key in @keys
      switch key
        when 37       # left
          @ship.rotate(-1)
        when 39       # right
          @ship.rotate(+1)
        when 38       # up
          @ship.forward()
        when 40
          @ship.backward()

  step: ->
    @tick += 1
    @masses.step()

  render: ->
    @viewpoint.update @ship if @ship?

    ctx = @ctx
    ctx.clearRect 0, 0, @canvas.width, @canvas.height
    ctx.save()
    @starfield.render ctx, @viewpoint
    @viewpoint.translate ctx
    @masses.render ctx
    ctx.restore()

  buildPlayer: ->
    [w, h] = [@canvas?.width, @canvas?.height]
    [x, y] = [Math.random() * w/2 + w/4, Math.random() * h/2 + h/4]

    @commandCentre = new CommandCentre {
      position: new Vector x, y
    }
    @add @commandCentre
    @buildShip()

  buildShip: ->
    x = @commandCentre.position.x
    y = @commandCentre.position.y + @commandCentre.radius

    @ship = new Ship {
      position: new Vector x, y
      rotation: Math.PI / 2
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

  checkCollisions: ->
    for id, m1 of @masses.items
      for id, m2 of @masses.items
        if m1.overlaps m2
          m1.handleCollision m2
Gt.Universe = Universe

class Star
  STAR_RADIUS: 1.5

  constructor: (options) ->
    @position = options.position
    @alpha = options.alpha

  render: (ctx, viewpoint, MULT) ->
    ctx.save()

    x = @position.x - (viewpoint.position.x / (@position.z + 1))
    y = @position.y - (viewpoint.position.y / (@position.z + 1))

    # wrap stars
    x -= Math.floor(x / (viewpoint.width * MULT)) * (viewpoint.width * MULT)
    y -= Math.floor(y / (viewpoint.height * MULT)) * (viewpoint.height * MULT)

    if y > viewpoint.height
      y = y - viewpoint.height
    else if y < 0
      y = y + viewpoint.height

    ctx.translate x, y

    alpha = (1 - @position.z) / 2
    ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')'

    ctx.beginPath()
    ctx.arc 0, 0, @STAR_RADIUS, 0, Math.PI * 2, true
    ctx.closePath()
    ctx.fill()

    ctx.restore()
Gt.Star = Star

class Starfield
  NUM_STARS: 100
  MULT: 2

  constructor: ->
    @stars = []

  generate: (viewpoint) ->
    for i in [1..@NUM_STARS]
      @stars.push new Star {
        position: new Vector(
          Math.random() * viewpoint.width * @MULT,
          Math.random() * viewpoint.height * @MULT,
          Math.random()
        )
      }

  render: (ctx, viewpoint) ->
    ctx.save()
    ctx.translate 0, 0

    @stars[star].render ctx, viewpoint, @MULT for star of @stars

    ctx.restore()
Gt.Starfield = Starfield

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
    highestLayer = 0
    for id, mass of @items
      if mass.layer > highestLayer
        highestLayer = mass.layer

    for i in [0..highestLayer]
      for id, mass of @items
        if mass.layer == i
          mass.render ctx

  step: ->
    mass.step() for id, mass of @items

class Mass
  type: 'Unknown'
  mass: 1

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
    @layer = o.layer or 0

  remove: ->
    @universe.remove this

  solid: true
  overlaps: (other) ->
    return false unless @solid and other.solid and other != this
    diff = other.position.minus(@position).length()
    diff < (other.radius + @radius)

  handleCollision: (other) ->
    x = @position.minus(other.position).normalized()
    v1 = @velocity
    x1 = x.dotProduct(v1)
    v1x = x.times(x1)
    v1y = v1.minus(v1x)
    m1 = @mass

    x = x.times(-1)
    v2 = other.velocity
    x2 = x.dotProduct(v2)
    v2x = x.times(x2)
    v2y = v2.minus(v2x)
    m2 = other.mass

    @velocity = v1x.times((m1 - m2) / (m1 + m2)).plus(v2x.times((2 * m2) / (m1 + m2)).plus(v1y))
    @velocity._zeroSmall()
    @acceleration = new Vector 0, 0

    other.velocity = v1x.times((2 * m1) / (m1 + m2)).plus(v2x.times((m2 - m1) / (m1 + m2)).plus(v2y))
    other.velocity._zeroSmall()
    other.acceleration = new Vector 0, 0

    # check that both velocities aren't zero, if so set the
    # velocity of the object with the smallest mass to be the normal
    if @velocity.length() == 0 and other.velocity.length() == 0
      if m1 < m2
        @velocity = x.times -1
      else
        other.velocity = x.times 1

    # make sure the objects are no longer touching, otherwise
    # hack away until they aren't
    while @overlaps other
      @position = @position.plus(@velocity)
      other.position = other.position.plus(other.velocity)

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
  LIFETIME: 40

  type: 'ShipTrail'
  solid: false
  constructor: (options) ->
    ship = options.ship
    options.radius ||= 2
    options.position ||= ship.position
    options.velocity ||= new Vector (Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4
    options.lifetime = @LIFETIME

    super options

  _render: (ctx) ->
    alpha = @lifetime / @LIFETIME
    ctx.fillStyle = 'rgba(89,163,89,' + alpha + ')'
    ctx.beginPath()
    ctx.arc 0, 0, @radius, 0, Math.PI * 2, true
    ctx.closePath()
    ctx.fill()
Gt.ShipTrail = ShipTrail

class Ship extends Mass
  type: 'Ship'
  value: 1000
  mass: 10

  constructor: (options) ->
    options ||= {}
    options.radius ||= 10
    options.layer = 2
    @max_speed = 3
    @max_accel = 0.03
    @trailDelay = 0
    super options

  _render: (ctx) ->
    ctx.fillStyle = 'rgb(0,68,0)'
    ctx.beginPath()
    ctx.arc 0, 0, @radius, 0, Math.PI * 2, true
    ctx.closePath()
    ctx.fill()

    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgb(94,87,75)'
    ctx.beginPath()
    ctx.moveTo -1.5 * @radius, -1.2 * @radius
    ctx.lineTo @radius * 1.4, -0.8 * @radius
    ctx.moveTo -1.5 * @radius, @radius * -0.4
    ctx.lineTo @radius * 1.5, @radius * -0.4
    ctx.moveTo -1.5 * @radius, @radius * 0.4
    ctx.lineTo @radius * 1.5, @radius * 0.4
    ctx.moveTo -1.5 * @radius, 1.2 * @radius
    ctx.lineTo @radius * 1.4, 0.8 * @radius
    ctx.closePath()
    ctx.stroke()

  forward: ->
    @thrust @acceleration.plus(new Vector(@rotation).times(@max_accel))

  backward: ->
    @thrust @acceleration.minus(new Vector(@rotation).times(@max_accel))

  thrust: (accel) ->
    if @trailDelay <= 0
      @universe.add new ShipTrail { ship: this }
      @trailDelay = 1
    @acceleration = accel
    @universe.update this

  step: ->
    dt = @universe.tick - @tick
    if this is @universe.ship
      @lifetime += dt
    return @remove() if (@lifetime -= dt) < 0

    for t in [0...dt]
      newVelocity = @velocity.plus @acceleration
      if newVelocity.length() < @max_speed
        @velocity = newVelocity
      else
        @velocity = newVelocity.times (@max_speed / newVelocity.length())

      @position = @position.plus @velocity
      @acceleration = @acceleration.times 0.8 # drag
      @rotation += @rotationalVelocity

    @trailDelay -= dt
    @tick = @universe.tick

  rotate: (dir) ->
    if (dir > 0 && @rotationalVelocity <= 0)
      @rotationalVelocity += Math.PI / 64
    else if (dir < 0 && @rotationalVelocity >= 0)
      @rotationalVelocity -= Math.PI / 64
    else if dir == 0
      @rotationalVelocity = 0
    @universe.update this
Gt.Ship = Ship

class CommandCentre extends Mass
  type: 'CommandCentre'
  mass: Infinity

  constructor: (options) ->
    options ||= {}
    options.radius ||= 80
    options.rotationalVelocity ||= Math.PI / 512
    options.layer = 1
    super options

  step: ->
    dt = @universe.tick - @tick
    @lifetime += dt
    super

  _render: (ctx) ->
    # outer ring
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgb(96, 97, 90)'
    ctx.beginPath()
    ctx.arc 0, 0, @radius, 0, Math.PI * 2, true
    ctx.closePath()
    ctx.stroke()

    # main sections
    ctx.strokeStyle = 'rgb(254, 235, 202)'
    for i in [1..4]
      ctx.strokeRect @radius / 2, -5, @radius / 2, 10
      ctx.strokeRect @radius, -20, 2, 40
      ctx.rotate Math.PI / 2

    # inner sections
    ctx.rotate -2*@rotation
    ctx.rotate Math.PI / 8
    for i in [1..8]
      ctx.strokeRect (@radius / 2) * 1.5, -15, 2, 30
      ctx.rotate Math.PI / 4

    # health bar
    ctx.fillStyle = 'rgb(0, 25, 0)'
    ctx.beginPath()
    ctx.arc 0, 0, @radius / 2, 0, Math.PI * 2, true
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'rgb(0,68,0)'
    ctx.beginPath()
    ctx.arc 0, 0, (@radius / 2) * 0.9, 0, Math.PI * 2, true
    ctx.closePath()
    ctx.fill()

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
  constructor: (x, y, z) ->
    [@x, @y] = if y? then [x, y] else [Math.cos(x), Math.sin(x)]
    @z = if z? then z else 0
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

  dotProduct: (other) ->
    (@x * other.x) + (@y * other.y)# + (@z * other.z)

  clone: ->
    new Vector @x, @y, @z

  _zeroSmall: ->
    @x = 0 if Math.abs(@x) < 0.01
    @y = 0 if Math.abs(@y) < 0.01
    @z = 0 if Math.abs(@z) < 0.01
Gt.Vector = Vector

# initialize
$(document).ready ->
  Gt.c = new Gt.Controller $('canvas').get 0
