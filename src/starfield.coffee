class Starfield
  PARTICLE_COUNT = 100
  NEAR = 1
  FAR = 500

  constructor: (@controller) ->
    # find max range of screen
    @screen_range_x = Math.tan(@controller.camera.fov * Math.PI / 180 * 0.5) * @controller.camera.position.z * 2
    @screen_range_y = @screen_range_x * @controller.camera.aspect

    # create particles at random locations
    @particles = new THREE.Geometry()
    for p in [0..PARTICLE_COUNT]
      depthMagnitude = Math.random()
      pX = Math.random() * (2 * @screen_range_x) - @screen_range_x
      pY = Math.random() * (2 * @screen_range_y) - @screen_range_y
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
      if particle.position.x - @controller.camera.position.x < -@screen_range_x
        particle.position.x = @controller.camera.position.x + @screen_range_x
      else if particle.position.x - @controller.camera.position.x > @screen_range_x
        particle.position.x = @controller.camera.position.x - @screen_range_x

      if particle.position.y - @controller.camera.position.y < -@screen_range_y
        particle.position.y = @controller.camera.position.y + @screen_range_y
      else if particle.position.y - @controller.camera.position.y > @screen_range_y
        particle.position.y = @controller.camera.position.y - @screen_range_y
