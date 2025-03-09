import * as THREE from 'three'

export class Starfield
  PARTICLE_COUNT = 2000
  # These should align with the camera settings in engine.coffee
  CAMERA_Z = 1000
  NEAR = 800
  FAR = 1000

  constructor: (@controller) ->
    [@screen_range_x, @screen_range_y] = @controller.screen_range(0)

    # Create buffer geometry directly instead of using THREE.Geometry
    bufferGeometry = new THREE.BufferGeometry()
    
    # Arrays to store position and color data
    positions = new Float32Array((PARTICLE_COUNT + 1) * 3)
    colors = new Float32Array((PARTICLE_COUNT + 1) * 3)
    sizes = new Float32Array(PARTICLE_COUNT + 1)
    
    # Fill arrays with random star data
    for p in [0..PARTICLE_COUNT]
      depthMagnitude = Math.random()
      pX = Math.random() * @screen_range_x
      pY = Math.random() * @screen_range_y
      
      # Correctly place stars in the camera's view frustum
      # Distribute stars between NEAR and FAR clipping planes (from z=999 to z=0)
      # This places stars just in front of camera down to the far clipping plane
      pZ = CAMERA_Z - (NEAR + depthMagnitude * (FAR - NEAR))
      
      # Set position
      positions[p * 3] = pX
      positions[p * 3 + 1] = pY
      positions[p * 3 + 2] = pZ
      
      # Set color based on depth - brighter stars are closer (higher z value)
      # Stars close to camera (z near 999) should be brightest
      # Stars far from camera (z near 0) should be dimmest
      normalizedDepth = (pZ - (CAMERA_Z - FAR)) / (FAR - NEAR)  # 1.0 = closest, 0.0 = farthest
      brightness = normalizedDepth * 0.5 # Use normal value, shader will enhance it
      
      # Add more prominent color variation to stars
      starType = Math.random()
      if starType < 0.6  # Blue-white stars (majority)
        colors[p * 3] = brightness * 0.7     # R (much less)
        colors[p * 3 + 1] = brightness * 0.9  # G (less)
        colors[p * 3 + 2] = brightness * 1.0  # B (enhanced)
      else if starType < 0.85  # White stars
        colors[p * 3] = brightness * 1.1     # R (enhanced)
        colors[p * 3 + 1] = brightness * 1.1  # G (enhanced)
        colors[p * 3 + 2] = brightness * 1.1  # B (enhanced)
      else if starType < 0.95  # Yellow stars
        colors[p * 3] = brightness * 1.1     # R (enhanced)
        colors[p * 3 + 1] = brightness * 1.1  # G (enhanced)
        colors[p * 3 + 2] = brightness * 0.9  # B (much less)
      else  # Red stars (few)
        colors[p * 3] = brightness * 1.0    # R (strongly enhanced)
        colors[p * 3 + 1] = brightness * 0.6  # G (much less)
        colors[p * 3 + 2] = brightness * 0.6  # B (much less)
      
      # Add some variation in sizes - make a few stars larger
      sizeFactor = Math.random()
      if sizeFactor > 0.98  # 2% of stars are larger
        sizes[p] = 1.5
      else if sizeFactor > 0.9  # 8% of stars are medium
        sizes[p] = 1.2
      else  # 90% of stars are normal size
        sizes[p] = 0.8
      
      # Also store vertices in geometry for step function
      if !@particles
        @particles = { vertices: [] }
      
      @particles.vertices.push(new THREE.Vector3(pX, pY, pZ))
    
    # Add attributes to buffer geometry
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    bufferGeometry.setAttribute('vertexColor', new THREE.BufferAttribute(colors, 3))
    bufferGeometry.setAttribute('starSize', new THREE.BufferAttribute(sizes, 1))
    
    # Create a custom shader material for circular points
    vertexShader = """
    attribute vec3 vertexColor;
    attribute float starSize;
    varying vec3 vColor;
    uniform float size;
    void main() {
      vColor = vertexColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * starSize;
      gl_Position = projectionMatrix * mvPosition;
    }
    """
    
    fragmentShader = """
    varying vec3 vColor;
    
    void main() {
      // Calculate distance from center
      vec2 center = vec2(0.5, 0.5);
      float r = distance(gl_PointCoord, center);
      
      // Discard pixels outside circle
      if (r > 0.5) {
        discard;
      }
      
      // Create star-like glow effect
      float falloff = 1.0 - r * 1.8;
      falloff = pow(max(falloff, 0.0), 1.5);
      
      // Boost the colors to make them more visible and apply the glow
      vec3 finalColor = vColor * 4.0 * falloff;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
    """
    
    material = new THREE.ShaderMaterial({
      uniforms: {
        size: { value: 5 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending
    })

    @particleSystem = new THREE.Points(bufferGeometry, material)
    @particleSystem.sortParticles = true
    @controller.scene.add @particleSystem

  step: ->
    @camera_x_min = @controller.camera_x_min(@screen_range_x)
    @camera_x_max = @controller.camera_x_max(@screen_range_x)
    @camera_y_min = @controller.camera_y_min(@screen_range_y)
    @camera_y_max = @controller.camera_y_max(@screen_range_y)
    
    needsUpdate = false
    
    for i, particle of @particles.vertices
      originalX = particle.x
      originalY = particle.y
      
      if particle.x < @camera_x_min
        while particle.x < @camera_x_min
          particle.x += @screen_range_x
      else if particle.x > @camera_x_max
        while particle.x > @camera_x_max
          particle.x -= @screen_range_x

      if particle.y < @camera_y_min
        while particle.y < @camera_y_min
          particle.y += @screen_range_y
      else if particle.y > @camera_y_max
        while particle.y > @camera_y_max
          particle.y -= @screen_range_y
          
      # If particle position changed, update the buffer
      if originalX != particle.x || originalY != particle.y
        positions = @particleSystem.geometry.attributes.position.array
        positions[i * 3] = particle.x
        positions[i * 3 + 1] = particle.y
        needsUpdate = true
    
    # Only update if needed
    if needsUpdate
      @particleSystem.geometry.attributes.position.needsUpdate = true
