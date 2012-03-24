class Client
  constructor: ->
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
