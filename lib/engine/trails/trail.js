define(function(require, exports, module){
// Generated by CoffeeScript 1.3.1
var Movable, Trail,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Movable = require('../movable');

Trail = (function(_super) {
  var HIDDEN_Z;

  __extends(Trail, _super);

  Trail.name = 'Trail';

  HIDDEN_Z = 2000;

  Trail.prototype.solid = false;

  function Trail(options) {
    this.opacity_step = (this.max_opacity - this.min_opacity) / this.max_lifetime;
    Trail.__super__.constructor.call(this, options);
  }

  Trail.prototype.buildMesh = function() {
    var geometry, material;
    geometry = new THREE.SphereGeometry(1);
    material = new THREE.MeshBasicMaterial;
    return new THREE.Mesh(geometry, material);
  };

  Trail.prototype.setup = function(position) {
    this.position.set(position.x, position.y, position.z - 10);
    this.lifetime = this.max_lifetime;
    this.alive = true;
    return this.mesh.material.opacity = this.max_opacity;
  };

  Trail.prototype.remove = function() {
    this.alive = false;
    return this.position.z = HIDDEN_Z;
  };

  Trail.prototype.step = function() {
    if (this.alive) {
      if (this.lifetime > 0) {
        this.position.addSelf(this.velocity);
        this.mesh.material.opacity -= this.opacity_step;
        return this.lifetime--;
      } else {
        return this.remove();
      }
    }
  };

  Trail.prototype.handleCollision = function(other) {
    return true;
  };

  return Trail;

})(Movable);

module.exports = Trail;

});