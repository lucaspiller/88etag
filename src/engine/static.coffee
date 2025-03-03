export class Static
  constructor: (options) ->
    @controller = options.controller
    @universe = options.universe

    @mesh = @buildMesh()

    @position = @mesh.position
    @position.set(0, 0, 500)

    if options.position
      @position.set(options.position.x, options.position.y, @position.z)

    @controller.scene.add @mesh

  remove: ->
    @controller.scene.remove @mesh