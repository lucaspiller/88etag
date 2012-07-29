$(document).ready ->
  unless Detector.webgl
    Detector.addGetWebGLMessage()
    return

  class IndexView extends Backbone.View
    render: ->
      playLink = $('<a/>').attr('href', '#play').text('Play')
      @$el.append(playLink)
      this

    dispose: ->
      true

  class PlayView extends Backbone.View
    render: ->
      Engine = require 'engine/engine'
      @engine = new Engine {
        container: @$el.get(0)
        aiPlayers: 1
        onEscape: =>
          router.navigate '/', true
      }
      this

    dispose: ->
      @engine.dispose()

  class Router extends Backbone.Router
    routes: {
      '': 'showIndex'
      'play': 'showPlay'
    }

    showIndex: ->
      indexView = new IndexView
      @changeView(indexView)

    showPlay: ->
      playView = new PlayView
      @changeView(playView)

    changeView: (view) ->
      if @currentView
        @currentView.dispose()

      $('body').html view.render().el
      @currentView = view

  router = new Router
  Backbone.history.start()
