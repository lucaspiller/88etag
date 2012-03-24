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
        @connected = true
        callback()
    @socket.on 'connect_failed', () ->
      alert 'Unable to connect to server!'
    @socket.on 'objectCreated', (data) =>
      if data.clientId != @id
        object = new Movable {
          controller: @controller,
          universe: @universe,
          local: false
        }
        object.position.x = data.position.x
        object.position.y = data.position.y
        object.velocity.x = data.velocity.x
        object.velocity.y = data.velocity.y
        @objects[data.id] = object
    @socket.on 'objectMoved', (data) =>
      if data.clientId != @id
        object = @objects[data.id]
        object.position.x = data.position.x
        object.position.y = data.position.y
        object.velocity.x = data.velocity.x
        object.velocity.y = data.velocity.y
    @socket.on 'objectDestroyed', (data) =>
      if data.clientId != @id
        delete @objects[data.id]

  objectCreated: (object) ->
    if object.solid
      object.lastSendStep = @controller.localStep
      @socket.emit 'objectCreated', @serialize(object)

  objectMoved: (object) ->
    if object.solid
      if (@controller.localStep - object.lastSendStep) > SEND_INTERVAL
        object.lastSendStep = @controller.localStep
        @socket.emit 'objectMoved', @serialize(object)

  objectDestroyed: (object) ->
    if object.solid
      object.lastSendStep = @controller.localStep
      @socket.emit 'objectDestroyed', @serialize(object)

  serialize: (object) ->
    {
      clientId: @id,
      id: object.id,
      type: object.type
      position: {
        x: object.position.x,
        y: object.position.y
      },
      velocity: {
        x: object.velocity.x,
        y: object.velocity.y
      }
    }
