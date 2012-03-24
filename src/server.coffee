class Server
  constructor: ->
    @objects = []

  start: (@io) ->
    @io.sockets.on 'connection', (socket) =>
      socket.on 'objectCreated', (data) =>
        @io.emit 'objectCreated', data
        @objects[data.id] = data
      socket.on 'objectMoved', (data) =>
        @io.emit 'objectMoved', data
        @objects[data.id] = data
      socket.on 'objectDestroyed', (data) =>
        @io.emit 'objectDestroyed', data
        delete @objects[data.id]

if typeof exports != "undefined"
  module.exports.server = Server
