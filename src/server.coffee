class Server
  start: (@io) ->
    console.log 'Server started, yay!'

if typeof exports != "undefined"
  module.exports.server = Server
