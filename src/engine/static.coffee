export class Static
  constructor: (options) ->
    @controller = options.controller
    @universe = options.universe

    @mesh = @buildMesh()
    if !@mesh || !@mesh.isObject3D
      console.error("buildMesh() must return a Object3D, Mesh or Group", @mesh, this)

    @position = @mesh.position
    @position.set(0, 0, 500)

    if options.position
      @position.set(options.position.x, options.position.y, @position.z)

    @controller.scene.add @mesh

  remove: ->
    @controller.scene.remove @mesh