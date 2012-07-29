$(document).ready ->
  require 'templates'

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

  class Menu extends Backbone.View
    className: 'menu'
    width: 600
    height: 600

    render: ->
      @$el.append @template
      @$el.css 'width', @width
      @$el.css 'height', @height
      @$el.css 'left', (window.innerWidth - @width) / 2
      @$el.css 'top', (window.innerHeight - @height) / 2
      this

    dispose: ->
      @$el.remove()

  class MainMenu extends Menu
    template: JST['menu/main_menu']

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

      if key == 65
        unless @menu
          @menu = new MainMenu
          @$el.append @menu.render().el

      true

    keyUp: (key) =>
      if key == 65
        if @menu
          @menu.dispose()
          @menu = false

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
