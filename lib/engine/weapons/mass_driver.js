define(function(require, exports, module){
// Generated by CoffeeScript 1.3.1
var MassDriver, MassDriverFire, Movable,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Movable = require('../movable');

MassDriver = (function(_super) {
  var AI_STEP_INTERVAL, FIRE_MAX_DISTANCE;

  __extends(MassDriver, _super);

  MassDriver.name = 'MassDriver';

  AI_STEP_INTERVAL = 60;

  FIRE_MAX_DISTANCE = 300;

  MassDriver.prototype.radius = 32;

  MassDriver.prototype.healthRadius = 8;

  MassDriver.prototype.mass = 250;

  MassDriver.prototype.maxHealth = 1000;

  function MassDriver(options) {
    MassDriver.__super__.constructor.call(this, options);
    this.parent = options.parent;
    this.position.x = options.position.x;
    this.position.y = options.position.y;
    this.aiStepCounter = 0;
    this.fireDelay = 60;
    this.rotationalVelocity = Math.PI / 512;
  }

  MassDriver.prototype.buildMesh = function() {
    var material;
    material = new THREE.MeshLambertMaterial({
      ambient: 0x5B3C1D,
      color: 0x5B3C1D
    });
    return new THREE.Mesh(this.controller.geometries['models/mass_driver.js'], material);
  };

  MassDriver.prototype.remove = function() {
    MassDriver.__super__.remove.apply(this, arguments);
    return this.base.remove();
  };

  MassDriver.prototype.step = function() {
    MassDriver.__super__.step.apply(this, arguments);
    if (this.aiStepCounter <= 0) {
      this.aiStep();
      this.aiStepCounter = AI_STEP_INTERVAL;
    } else {
      this.aiStepCounter--;
    }
    this.fireDelay--;
    if (this.shouldFire) {
      return this.fire();
    }
  };

  MassDriver.prototype.fire = function() {
    var vector;
    if (this.fireDelay <= 0) {
      vector = this.target.position.clone().subSelf(this.position);
      this.angle = Math.atan2(vector.y, vector.x);
      if (vector.length() < FIRE_MAX_DISTANCE) {
        this.target.velocity.multiplyScalar(0).addSelf(vector);
        this.fireDelay = 60;
        return new MassDriverFire({
          controller: this.controller,
          universe: this.universe,
          vector: vector,
          parent: this
        });
      }
    }
  };

  MassDriver.prototype.aiStep = function() {
    if (!this.target) {
      this.chooseTarget();
    }
    if (this.target && this.target.alive) {
      return this.shouldFire = true;
    } else {
      return this.shouldFire = false;
    }
  };

  MassDriver.prototype.chooseTarget = function() {
    var player, vector, _i, _len, _ref, _results;
    _ref = this.universe.players;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      player = _ref[_i];
      if (player !== this.parent && player.ship) {
        vector = player.ship.position.clone().subSelf(this.position);
        if (vector.length() < FIRE_MAX_DISTANCE) {
          this.target = player.ship;
          break;
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  return MassDriver;

})(Movable);

MassDriverFire = (function(_super) {

  __extends(MassDriverFire, _super);

  MassDriverFire.name = 'MassDriverFire';

  MassDriverFire.prototype.solid = false;

  MassDriverFire.prototype.mass = 0;

  MassDriverFire.prototype.buildMesh = function() {
    var geometry, material;
    material = new THREE.MeshBasicMaterial;
    material.color.setRGB(91 / 255, 60 / 255, 29 / 255);
    geometry = new THREE.CubeGeometry(this.vector.length(), 2, 2);
    return new THREE.Mesh(geometry, material);
  };

  function MassDriverFire(options) {
    this.vector = options.vector;
    this.parent = options.parent;
    MassDriverFire.__super__.constructor.call(this, options);
    this.position.set(this.parent.position.x, this.parent.position.y, this.parent.position.z - 10);
    this.rotation = Math.atan2(this.vector.y, this.vector.x);
    this.mesh.rotateAboutObjectAxis(THREE.AxisZ, this.rotation);
    this.position.addSelf(this.vector.multiplyScalar(0.5));
    this.lifetime = 10;
  }

  MassDriverFire.prototype.step = function() {
    if (this.lifetime > 0) {
      return this.lifetime--;
    } else {
      return this.remove();
    }
  };

  MassDriverFire.prototype.handleCollision = function(other) {
    return true;
  };

  return MassDriverFire;

})(Movable);

module.exports = MassDriver;

});
