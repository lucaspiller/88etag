define(function(require, exports, module){
// Generated by CoffeeScript 1.3.1
var ShipTrail, Trail,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Trail = require('./trail');

ShipTrail = (function(_super) {

  __extends(ShipTrail, _super);

  ShipTrail.name = 'ShipTrail';

  function ShipTrail() {
    return ShipTrail.__super__.constructor.apply(this, arguments);
  }

  ShipTrail.prototype.max_lifetime = 30;

  ShipTrail.prototype.max_opacity = 1;

  ShipTrail.prototype.min_opacity = 0;

  ShipTrail.prototype.buildMesh = function() {
    var geometry, material;
    geometry = new THREE.SphereGeometry(1);
    material = new THREE.MeshBasicMaterial;
    return new THREE.Mesh(geometry, material);
  };

  ShipTrail.prototype.setup = function(position) {
    ShipTrail.__super__.setup.apply(this, arguments);
    this.velocity.set((Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4, 0);
    return this.mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255);
  };

  ShipTrail.prototype.remove = function() {
    ShipTrail.__super__.remove.apply(this, arguments);
    return this.universe.trails.addToShipTrailPool(this);
  };

  return ShipTrail;

})(Trail);

module.exports = ShipTrail;

});