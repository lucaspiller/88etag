class Client
  SEND_INTERVAL = 10

  constructor: (@controller) ->
    @connected = false
    @id = Math.random() # TODO
    @objects = []

  connect: (host, callback) ->
    @socket = io.connect host
    @socket.on 'connect', () =>
      if @connected
        # reconnected, just reload the page for now
        window.location = window.location
      else
        @socket.emit 'clientId', @id
        @connected = true
        callback()
    @socket.on 'connect_failed', () ->
      alert 'Unable to connect to server!'
    @socket.on 'objectCreated', (data) =>
      if data.clientId != @id
        if @objects[data.id]
          object = @objects[data.id]
          object.remove()
          delete object

        object = new Movable {
          controller: @controller,
          universe: @universe,
          local: false,
          type: data.type
        }
        object.solid = data.solid
        object.position.x = data.position.x
        object.position.y = data.position.y
        object.velocity.x = data.velocity.x
        object.velocity.y = data.velocity.y
        object.setRotation data.rotation
        object.rotationalVelocity = data.rotationalVelocity
        @objects[data.id] = object
    @socket.on 'objectMoved', (data) =>
      if data.clientId != @id
        object = @objects[data.id]
        object.position.x = data.position.x
        object.position.y = data.position.y
        object.velocity.x = data.velocity.x
        object.velocity.y = data.velocity.y
        object.setRotation data.rotation
        object.rotationalVelocity = data.rotationalVelocity
    @socket.on 'objectDestroyed', (data) =>
      if data.clientId != @id
        object = @objects[data.id]
        object.remove()
        delete object

  objectCreated: (object) ->
    if object.collidable
      object.lastSendStep = @controller.localStep
      @socket.emit 'objectCreated', @serialize(object)

  objectMoved: (object) ->
    if object.collidable
      if (@controller.localStep - object.lastSendStep) > SEND_INTERVAL
        object.lastSendStep = @controller.localStep
        @socket.emit 'objectMoved', @serialize(object)

  objectDestroyed: (object) ->
    if object.collidable
      object.lastSendStep = @controller.localStep
      @socket.emit 'objectDestroyed', @serialize(object)

  serialize: (object) ->
    {
      clientId: @id,
      id: object.id,
      type: object.type,
      solid: object.solid,
      rotation: object.rotation,
      rotationalVelocity: object.rotationalVelocity,
      position: {
        x: object.position.x,
        y: object.position.y
      },
      velocity: {
        x: object.velocity.x,
        y: object.velocity.y
      }
    }
