class Starfield
  PARTICLE_COUNT = 50
  NEAR = 1
  FAR = 500

  constructor: (@controller) ->
    # create particles at random locations
    @particles = new THREE.Geometry()
    for p in [0..PARTICLE_COUNT]
      depthMagnitude = Math.random()
      pX = Math.random() * @controller.screen_range_x - (@controller.screen_range_x / 2)
      pY = Math.random() * @controller.screen_range_y - (@controller.screen_range_y / 2)
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
    for particle in @particles.vertices
      if particle.position.x < @controller.camera_x_min
        while particle.position.x < @controller.camera_x_min
          particle.position.x += @controller.screen_range_x
      else if particle.position.x > @controller.camera_x_max
        while particle.position.x > @controller.camera_x_max
          particle.position.x -= @controller.screen_range_x

      if particle.position.y < @controller.camera_y_min
        while particle.position.y < @controller.camera_y_min
          particle.position.y += @controller.screen_range_y
      else if particle.position.y > @controller.camera_y_max
        while particle.position.y > @controller.camera_y_max
          particle.position.y -= @controller.screen_range_y
