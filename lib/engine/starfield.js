define(function(require, exports, module){
// Generated by CoffeeScript 1.3.1
var Starfield;

Starfield = (function() {
  var FAR, NEAR, PARTICLE_COUNT;

  Starfield.name = 'Starfield';

  PARTICLE_COUNT = 50;

  NEAR = 1;

  FAR = 500;

  function Starfield(controller) {
    var color, depthMagnitude, material, p, pX, pY, pZ, particle, _i, _ref;
    this.controller = controller;
    _ref = this.controller.screen_range(0), this.screen_range_x = _ref[0], this.screen_range_y = _ref[1];
    this.particles = new THREE.Geometry();
    for (p = _i = 0; 0 <= PARTICLE_COUNT ? _i <= PARTICLE_COUNT : _i >= PARTICLE_COUNT; p = 0 <= PARTICLE_COUNT ? ++_i : --_i) {
      depthMagnitude = Math.random();
      pX = Math.random() * this.screen_range_x - (this.screen_range_x / 2);
      pY = Math.random() * this.screen_range_y - (this.screen_range_y / 2);
      pZ = depthMagnitude * FAR - NEAR;
      particle = new THREE.Vector3(pX, pY, pZ);
      this.particles.vertices.push(particle);
      color = new THREE.Color();
      color.setRGB(depthMagnitude * 2, depthMagnitude * 2, depthMagnitude * 2);
      this.particles.colors.push(color);
    }
    material = new THREE.ParticleBasicMaterial({
      size: 2,
      sizeAttenuation: false,
      vertexColors: true
    });
    this.particleSystem = new THREE.ParticleSystem(this.particles, material);
    this.particleSystem.sortParticles = true;
    this.controller.scene.add(this.particleSystem);
  }

  Starfield.prototype.step = function() {
    var particle, _i, _len, _ref, _results;
    this.camera_x_min = this.controller.camera_x_min(this.screen_range_x);
    this.camera_x_max = this.controller.camera_x_max(this.screen_range_x);
    this.camera_y_min = this.controller.camera_y_min(this.screen_range_y);
    this.camera_y_max = this.controller.camera_y_max(this.screen_range_y);
    _ref = this.particles.vertices;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      particle = _ref[_i];
      if (particle.x < this.camera_x_min) {
        while (particle.x < this.camera_x_min) {
          particle.x += this.screen_range_x;
        }
      } else if (particle.x > this.camera_x_max) {
        while (particle.x > this.camera_x_max) {
          particle.x -= this.screen_range_x;
        }
      }
      if (particle.y < this.camera_y_min) {
        _results.push((function() {
          var _results1;
          _results1 = [];
          while (particle.y < this.camera_y_min) {
            _results1.push(particle.y += this.screen_range_y);
          }
          return _results1;
        }).call(this));
      } else if (particle.y > this.camera_y_max) {
        _results.push((function() {
          var _results1;
          _results1 = [];
          while (particle.y > this.camera_y_max) {
            _results1.push(particle.y -= this.screen_range_y);
          }
          return _results1;
        }).call(this));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  return Starfield;

})();

module.exports = Starfield;

});
