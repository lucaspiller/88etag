$(document).ready ->
  GameMenu =  require 'game_menu'

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
        onKeyDown: @keyDown
        onKeyUp: @keyUp
      }
      this

    dispose: ->
      @engine.dispose()

    keyDown: (key) =>
      if key == 27
        router.navigate '/', true

      if @menu
        switch key
          when 37 # left
            @menu = @menu.left(@engine)
            return false
          when 39 # right
            @menu = @menu.right(@engine)
            return false
          when 38 # up
            @menu = @menu.up(@engine)
            return false
          when 40 # down
            @menu = @menu.down(@engine)
            return false
      else
        if key == 65
          @menu = new GameMenu
          @$el.append @menu.render().el
      true

    keyUp: (key) =>
      if key == 65
        if @menu
          @menu = @menu.dispose()
      true


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
