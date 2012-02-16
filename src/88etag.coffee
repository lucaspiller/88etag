$(document).ready ->
    unless Detector.webgl
      Detector.addGetWebGLMessage()
      return

    # TODO setup
