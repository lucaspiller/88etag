class Client
  SEND_INTERVAL = 60

  constructor: (@controller) ->
    @connected = false

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

  objectCreated: (object) ->
    if object.solid
      object.lastSendStep = @controller.localStep
      @socket.emit 'objectCreated', @serialize(object)

  objectDestroyed: (object) ->
    if object.solid
      object.lastSendStep = @controller.localStep
      @socket.emit 'objectDestroyed', @serialize(object)

  objectMoved: (object) ->
    if object.solid
      if (@controller.localStep - object.lastSendStep) > SEND_INTERVAL
        object.lastSendStep = @controller.localStep
        @socket.emit 'objectMoved', @serialize(object)

  serialize: (object) ->
    {
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
