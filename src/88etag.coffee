import './threejs_extensions'
import { GameMenu } from './game_menu.coffee'
import { gameOver as gameOverTemplate } from './templates'
import { Engine } from './engine/engine.coffee'

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

  class GameOverView extends Backbone.View
    className: 'game_over'
    template: gameOverTemplate

    render: ->
      @$el.append @template
      this

    dispose: ->
      @$el.remove()

  class PlayView extends Backbone.View
    reset: ->
      @dispose()
      @$el.html('')
      @render()

    render: ->
      @engine = new Engine {
        container: @$el.get(0)
        aiPlayers: 1
        onKeyDown: @keyDown
        onKeyUp: @keyUp
        onGameOver: @gameOver
      }
      this

    dispose: ->
      @engine.dispose()
      @engine = false
      @menu.dispose() if @menu
      @menu = false
      @gameOverView.dispose() if @gameOverView
      @gameOverView = false

    keyDown: (key) =>
      if key == 27
        router.navigate '', true
        return

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
      if @gameOverView
        if key == 32
          @reset()
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

    gameOver: =>
      @gameOverView = new GameOverView
      @$el.append @gameOverView.render().el

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
