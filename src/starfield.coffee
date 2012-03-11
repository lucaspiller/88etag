class Starfield
  PARTICLE_COUNT = 50
  NEAR = 1
  FAR = 500

  constructor: (@controller) ->
    # find max range of screen
    @screen_range_x = Math.tan(@controller.camera.fov * Math.PI / 180) * @controller.camera.position.z * 2
    @screen_range_y = @screen_range_x / @controller.camera.aspect

    # create particles at random locations
    @particles = new THREE.Geometry()
    for p in [0..PARTICLE_COUNT]
      depthMagnitude = Math.random()
      pX = Math.random() * @screen_range_x - (@screen_range_x / 2)
      pY = Math.random() * @screen_range_y - (@screen_range_y / 2)
      pZ = depthMagnitude * FAR - NEAR

      particle = new THREE.Vertex(new THREE.Vector3(pX, pY, pZ))
      @particles.vertices.push(particle)

      # set the brightness based upon distance, closer particles are brighter
      color = new THREE.Color()
      color.setRGB(depthMagnitude * 2, depthMagnitude * 2, depthMagnitude * 2)
      @particles.colors.push(color)

    # create a really basic material
    material = new THREE.ParticleBasicMaterial({
      size: 2,
      sizeAttenuation: false,
      vertexColors: true
    })

    @particleSystem = new THREE.ParticleSystem @particles, material
    @particleSystem.sortParticles = true
    @controller.scene.add @particleSystem

  step: ->
    @camera_x_min = @controller.camera.position.x - (@screen_range_x / 2)
    @camera_x_max = @controller.camera.position.x + (@screen_range_x / 2)
    @camera_y_min = @controller.camera.position.y - (@screen_range_y / 2)
    @camera_y_max = @controller.camera.position.y + (@screen_range_y / 2)

    for particle in @particles.vertices
      if particle.position.x < @camera_x_min
        while particle.position.x < @camera_x_min
          particle.position.x += @screen_range_x
      else if particle.position.x > @camera_x_max
        while particle.position.x > @camera_x_max
          particle.position.x -= @screen_range_x

      if particle.position.y < @camera_y_min
        while particle.position.y < @camera_y_min
          particle.position.y += @screen_range_y
      else if particle.position.y > @camera_y_max
        while particle.position.y > @camera_y_max
          particle.position.y -= @screen_range_y
