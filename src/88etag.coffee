$(document).ready ->
  unless Detector.webgl
    Detector.addGetWebGLMessage()
    return

  Engine = require 'engine'
  new Engine {
    container: document.getElementById 'container'
    aiPlayers: 1
  }
