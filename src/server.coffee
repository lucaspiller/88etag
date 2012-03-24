class Server
  constructor: ->
    @objects = []

  start: (@io) ->
    @io.sockets.on 'connection', (socket) =>
      for _, object of @objects
        socket.emit 'objectCreated', object
      socket.on 'objectCreated', (data) =>
        @io.sockets.emit 'objectCreated', data
        @objects[data.id] = data
      socket.on 'objectMoved', (data) =>
        @io.sockets.emit 'objectMoved', data
        @objects[data.id] = data
      socket.on 'objectDestroyed', (data) =>
        @io.sockets.emit 'objectDestroyed', data
        delete @objects[data.id]

if typeof exports != "undefined"
  module.exports.server = Server
