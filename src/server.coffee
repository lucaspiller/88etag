class Server
  constructor: ->
    @objects = []

  start: (@io) ->
    @io.sockets.on 'connection', (socket) =>
      clientId = undefined
      for _, object of @objects
        socket.emit 'objectCreated', object

      socket.on 'clientId', (data) =>
        clientId = data

      socket.on 'objectCreated', (data) =>
        @io.sockets.emit 'objectCreated', data
        @objects[data.id] = data

      socket.on 'objectMoved', (data) =>
        if @objects[data.id]
          @io.sockets.emit 'objectMoved', data
          @objects[data.id] = data

      socket.on 'objectDestroyed', (data) =>
        @io.sockets.emit 'objectDestroyed', data
        delete @objects[data.id]

      socket.on 'disconnect', () =>
        if clientId
          for _, object of @objects
            if object.clientId == clientId
              @io.sockets.emit 'objectDestroyed', object
              delete @objects[object.id]

if typeof exports != "undefined"
  module.exports.server = Server
