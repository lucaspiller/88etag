import { mainMenu, turretMenu } from './templates'

class Menu extends Backbone.View
  className: 'menu'
  width: 600
  height: 600

  left: ->
    this

  right: ->
    this

  up: ->
    this

  down: ->
    this

  render: ->
    @$el.append @template
    @$el.css 'width', @width
    @$el.css 'height', @height
    @$el.css 'left', (window.innerWidth - @width) / 2
    @$el.css 'top', (window.innerHeight - @height) / 2
    this

  dispose: ->
    @$el.remove()
    false

  switchMenu: (menuClass) ->
    menu = new menuClass
    @$el.replaceWith menu.render().el
    menu

export class GameMenu extends Menu
  template: mainMenu

  left: ->
    @switchMenu TurretMenu

class TurretMenu extends Menu
  template: turretMenu

  left: (engine) ->
    engine.universe.player.buildTurret()
    @dispose()

  right: (engine) ->
    engine.universe.player.buildMassDriver()
    @dispose()