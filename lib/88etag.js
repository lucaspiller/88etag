(function() {
  var BulletsStorage, CommandCentre, Controller, HealthBall, LocalPlayer, Movable, Player, ShipBullet, ShipTrail, Starfield, TrailsStorage, Universe,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Controller = (function() {
    var CAMERA_Z, FAR, NEAR, VIEW_ANGLE;

    VIEW_ANGLE = 45;

    NEAR = 1;

    FAR = 1000;

    CAMERA_Z = 1000;

    Controller.prototype.models = ['models/ship_basic.js'];

    function Controller(container) {
      this.container = container;
      this.setupRenderer();
      this.setupScene();
      this.load();
    }

    Controller.prototype.width = function() {
      return window.innerWidth;
    };

    Controller.prototype.height = function() {
      return window.innerHeight;
    };

    Controller.prototype.setupRenderer = function() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true
      });
      this.renderer.setClearColorHex(0x080808, 1);
      this.renderer.setSize(this.width(), this.height());
      this.container.append(this.renderer.domElement);
      if (Stats) {
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        return container.appendChild(this.stats.domElement);
      }
    };

    Controller.prototype.setupScene = function() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, this.width() / this.height(), NEAR, FAR);
      this.camera.position.set(0, 0, CAMERA_Z);
      this.scene.add(this.camera);
      this.scene.add(new THREE.AmbientLight(0x999999));
      this.light = new THREE.PointLight(0xffffff);
      return this.scene.add(this.light);
    };

    Controller.prototype.width = function() {
      return window.innerWidth;
    };

    Controller.prototype.height = function() {
      return window.innerHeight;
    };

    Controller.prototype.load = function() {
      var loader, model, _i, _len, _ref, _results,
        _this = this;
      this.geometries = {};
      loader = new THREE.JSONLoader();
      _ref = this.models;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        _results.push(loader.load(model, function(geometry) {
          geometry.computeVertexNormals();
          _this.geometries[model] = geometry;
          if (_.size(_this.geometries) === _.size(_this.models)) {
            return _this.continueLoad();
          }
        }));
      }
      return _results;
    };

    Controller.prototype.continueLoad = function() {
      this.universe = new Universe(this);
      return this.render();
    };

    Controller.prototype.render = function() {
      var _this = this;
      requestAnimationFrame((function() {
        return _this.render();
      }));
      this.universe.checkCollisions();
      this.universe.step();
      this.light.position.set(this.camera.position.x, this.camera.position.y, CAMERA_Z * 10);
      this.renderer.render(this.scene, this.camera);
      if (this.stats) return this.stats.update();
    };

    return Controller;

  })();

  Universe = (function() {

    function Universe(controller) {
      this.controller = controller;
      this.starfield = new Starfield(this.controller);
      this.trails = new TrailsStorage({
        controller: this.controller,
        universe: this
      });
      this.bullets = new BulletsStorage({
        controller: this.controller,
        universe: this
      });
      this.masses = [];
      this.buildPlayer();
      this.bindKeys();
    }

    Universe.prototype.buildPlayer = function() {
      return this.player = new LocalPlayer({
        controller: this.controller,
        universe: this
      });
    };

    Universe.prototype.bindKeys = function() {
      var _this = this;
      this.keys = [];
      $(window).keydown(function(e) {
        _this.keys.push(e.which);
        return _this.keys = _.uniq(_this.keys);
      });
      return $(window).keyup(function(e) {
        return _this.keys = _.without(_this.keys, e.which);
      });
    };

    Universe.prototype.step = function() {
      var mass, _i, _len, _ref, _results;
      this.starfield.step();
      _ref = this.masses;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        mass = _ref[_i];
        _results.push(mass.step());
      }
      return _results;
    };

    Universe.prototype.checkCollisions = function() {
      var m1, m2, _i, _j, _len, _len2, _ref, _ref2;
      _ref = this.masses;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        m1 = _ref[_i];
        _ref2 = this.masses;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          m2 = _ref2[_j];
          if (m2.solid && m1.mass < m2.mass && m1.overlaps(m2)) {
            m1.handleCollision(m2);
          }
        }
      }
      return true;
    };

    return Universe;

  })();

  HealthBall = (function() {

    function HealthBall(options) {
      this.controller = options.controller;
      this.position = options.position;
      this.maxHealth = options.maxHealth;
      this.radius = options.radius;
      this.buildMeshes();
    }

    HealthBall.prototype.buildMeshes = function() {
      var geometry, material;
      geometry = new THREE.CylinderGeometry(this.radius, this.radius, 0.1, 16);
      material = new THREE.MeshPhongMaterial();
      material.color.setRGB(0, 25 / 255, 0);
      material.opacity = 0.3;
      this.outerMesh = new THREE.Mesh(geometry, material);
      this.outerMesh.rotateAboutWorldAxis(THREE.AxisX, Math.PI / 2);
      this.controller.scene.add(this.outerMesh);
      geometry = new THREE.CylinderGeometry(this.radius, this.radius, 0.1, 16);
      material = new THREE.MeshBasicMaterial();
      material.color.setRGB(0, 68 / 255, 0);
      material.opacity = 0.8;
      this.innerMesh = new THREE.Mesh(geometry, material);
      this.innerMesh.rotateAboutWorldAxis(THREE.AxisX, Math.PI / 2);
      return this.controller.scene.add(this.innerMesh);
    };

    HealthBall.prototype.remove = function() {
      this.controller.scene.remove(this.innerMesh);
      return this.controller.scene.remove(this.outerMesh);
    };

    HealthBall.prototype.update = function(position, health) {
      this.outerMesh.position.set(position.x, position.y, position.z - 0.2);
      this.innerMesh.position.set(position.x, position.y, position.z - 0.1);
      return this.innerMesh.scale.set(health / this.maxHealth, health / this.maxHealth, health / this.maxHealth);
    };

    return HealthBall;

  })();

  Movable = (function() {

    Movable.prototype.maxHealth = 100;

    Movable.prototype.healthRadius = 10;

    Movable.prototype.mass = 1;

    Movable.prototype.solid = true;

    Movable.prototype.radius = 10;

    Movable.prototype.rotationalVelocity = 0;

    function Movable(options) {
      this.controller = options.controller;
      this.universe = options.universe;
      this.mesh = this.buildMesh();
      this.mesh.rotateAboutWorldAxis(THREE.AxisZ, 0.001);
      this.controller.scene.add(this.mesh);
      this.velocity = this.mesh.velocity = new THREE.Vector3(0, 0, 0);
      this.position = this.mesh.position = new THREE.Vector3(0, 0, 500);
      this.rotation = 0;
      this.health = this.maxHealth;
      this.universe.masses.push(this);
      if (this.solid) {
        this.healthBall = new HealthBall({
          controller: this.controller,
          position: this.position,
          maxHealth: this.maxHealth,
          radius: this.healthRadius
        });
      }
    }

    Movable.prototype.buildMesh = function() {
      var geometry, material;
      geometry = new THREE.CubeGeometry(10, 10, 10);
      material = new THREE.MeshLambertMaterial({
        ambient: 0xFF0000,
        color: 0xFF0000
      });
      return new THREE.Mesh(geometry, material);
    };

    Movable.prototype.explode = function() {
      return this.remove();
    };

    Movable.prototype.remove = function() {
      this.controller.scene.remove(this.mesh);
      this.universe.masses = _.without(this.universe.masses, this);
      if (this.solid) return this.healthBall.remove();
    };

    Movable.prototype.step = function() {
      if (this.mass >= 1000) this.velocity.multiplyScalar(0.99);
      this.position.addSelf(this.velocity);
      if (Math.abs(this.rotationalVelocity) > 0) {
        this.mesh.rotateAboutWorldAxis(THREE.AxisZ, this.rotationalVelocity);
        this.rotation = (this.rotation + this.rotationalVelocity) % (Math.PI * 2);
      }
      if (this.solid) return this.healthBall.update(this.position, this.health);
    };

    Movable.prototype.overlaps = function(other) {
      var diff;
      if (other === this) return false;
      diff = this.position.clone().subSelf(other.position).length();
      return diff < (other.radius + this.radius);
    };

    Movable.prototype.handleCollision = function(other) {
      var m1, m2, v1, v1x, v1y, v2, v2x, v2y, x, x1, x2, _results;
      x = this.position.clone().subSelf(other.position).normalize();
      v1 = this.velocity.clone();
      x1 = x.dot(v1);
      v1x = x.clone().multiplyScalar(x1);
      v1y = v1.clone().subSelf(v1x);
      m1 = this.mass;
      x = x.multiplyScalar(-1);
      v2 = other.velocity.clone();
      x2 = x.dot(v2);
      v2x = x.clone().multiplyScalar(x2);
      v2y = v2.clone().subSelf(v2x);
      m2 = other.mass;
      this.velocity = v1x.clone().multiplyScalar((m1 - m2) / (m1 + m2)).addSelf(v2x.multiplyScalar((2 * m2) / (m1 + m2)).addSelf(v1y)).multiplyScalar(0.75);
      this.acceleration = new THREE.Vector3(0, 0, 0);
      if (other.mass < 1000) {
        other.velocity = v1x.clone().multiplyScalar((2 * m1) / (m1 + m2)).addSelf(v2x.multiplyScalar((m2 - m1) / (m1 + m2)).addSelf(v2y)).multiplyScalar(0.75);
        other.acceleration = new THREE.Vector3(0, 0, 0);
      }
      if (this.velocity.length() === 0 && other.velocity.length() === 0) {
        if (m1 < m2) {
          this.velocity = x.clone().multiplyScalar(-1);
        } else {
          other.velocity = x.clone().multiplyScalar(1);
        }
      }
      _results = [];
      while (this.overlaps(other)) {
        this.position.addSelf(this.velocity);
        _results.push(other.position.addSelf(other.velocity));
      }
      return _results;
    };

    return Movable;

  })();

  $(document).ready(function() {
    if (!Detector.webgl) {
      Detector.addGetWebGLMessage();
      return;
    }
    return new Controller($('#container'));
  });

  BulletsStorage = (function() {

    function BulletsStorage(options) {
      this.universe = options.universe;
      this.controller = options.controller;
      this.pool = [];
    }

    BulletsStorage.prototype.addToPool = function(bullet) {
      return this.pool.push(bullet);
    };

    BulletsStorage.prototype.newShipBullet = function(parent) {
      var bullet, i, _results;
      _results = [];
      for (i = 1; i <= 2; i++) {
        bullet = this.pool.pop();
        if (!bullet) {
          bullet = new ShipBullet({
            controller: this.controller,
            universe: this.universe
          });
        }
        _results.push(bullet.setup(parent));
      }
      return _results;
    };

    return BulletsStorage;

  })();

  ShipBullet = (function(_super) {

    __extends(ShipBullet, _super);

    ShipBullet.prototype.solid = false;

    ShipBullet.prototype.damage = 100;

    ShipBullet.prototype.radius = 5;

    ShipBullet.prototype.mass = 0;

    function ShipBullet(options) {
      ShipBullet.__super__.constructor.call(this, options);
    }

    ShipBullet.prototype.buildMesh = function() {
      var geometry, material;
      geometry = new THREE.SphereGeometry(5);
      material = new THREE.MeshBasicMaterial;
      return new THREE.Mesh(geometry, material);
    };

    ShipBullet.prototype.setup = function(parent) {
      this.parent = parent;
      this.position.set(this.parent.position.x, this.parent.position.y, this.parent.position.z - 10);
      this.velocity.x = Math.cos(this.parent.rotation);
      this.velocity.y = Math.sin(this.parent.rotation);
      this.velocity.multiplyScalar(6);
      this.mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255);
      this.lifetime = 100;
      return this.alive = true;
    };

    ShipBullet.prototype.remove = function() {
      this.alive = false;
      this.position.z = this.controller.NEAR;
      return this.universe.bullets.addToPool(this);
    };

    ShipBullet.prototype.step = function() {
      if (this.alive) {
        if (this.lifetime > 0) {
          this.position.addSelf(this.velocity);
          return this.lifetime--;
        } else {
          return this.remove();
        }
      }
    };

    ShipBullet.prototype.handleCollision = function(other) {
      if (!other.solid) return;
      if (other === this.parent) return;
      other.health -= this.damage;
      if (other.health <= 0) other.explode();
      return this.remove();
    };

    return ShipBullet;

  })(Movable);

  Player = (function(_super) {

    __extends(Player, _super);

    Player.prototype.healthRadius = 8;

    Player.prototype.maxHealth = 100;

    Player.prototype.radius = 20;

    Player.prototype.mass = 1;

    Player.prototype.max_speed = 2;

    Player.prototype.max_accel = 0.05;

    function Player(options) {
      Player.__super__.constructor.call(this, options);
      this.acceleration = new THREE.Vector3(0, 0, 0);
      this.commandCentre = new CommandCentre(options);
      this.position.y = this.commandCentre.position.y - this.commandCentre.radius;
      this.rotation = Math.PI * 1.5;
      this.mesh.rotateAboutObjectAxis(THREE.AxisZ, this.rotation);
      this.bulletDelay = 0;
    }

    Player.prototype.buildMesh = function() {
      var material;
      material = new THREE.MeshLambertMaterial({
        ambient: 0x5E574B,
        color: 0x5E574B
      });
      return new THREE.Mesh(this.controller.geometries['models/ship_basic.js'], material);
    };

    Player.prototype.rotateLeft = function() {
      return this.rotationalVelocity = Math.PI / 64;
    };

    Player.prototype.rotateRight = function() {
      return this.rotationalVelocity = -Math.PI / 64;
    };

    Player.prototype.forward = function() {
      var accel;
      this.acceleration.x = Math.cos(this.rotation);
      this.acceleration.y = Math.sin(this.rotation);
      accel = this.acceleration.length();
      if (accel > this.max_accel) {
        this.acceleration.multiplyScalar(this.max_accel / accel);
      }
      this.universe.trails.newShipTrail(this);
      return this.mesh.rotateAboutObjectAxis(THREE.AxisX, Math.PI / 128);
    };

    Player.prototype.backward = function() {
      var accel;
      this.acceleration.x = -Math.cos(this.rotation);
      this.acceleration.y = -Math.sin(this.rotation);
      accel = this.acceleration.length();
      if (accel > this.max_accel) {
        this.acceleration.multiplyScalar(this.max_accel / accel);
      }
      this.universe.trails.newShipTrail(this);
      return this.mesh.rotateAboutObjectAxis(THREE.AxisX, -Math.PI / 128);
    };

    Player.prototype.fire = function() {
      if (this.bulletDelay <= 0) {
        this.universe.bullets.newShipBullet(this);
        return this.bulletDelay = 10;
      }
    };

    Player.prototype.step = function() {
      var speed;
      this.commandCentre.step();
      this.bulletDelay--;
      this.velocity.addSelf(this.acceleration);
      this.acceleration.multiplyScalar(0);
      speed = this.velocity.length();
      if (speed > this.max_speed) {
        this.velocity.multiplyScalar(this.max_speed / speed);
      }
      if (Math.abs(this.rotationalVelocity) > 0.01) {
        this.rotationalVelocity *= 0.9;
      } else {
        this.rotationalVelocity = 0;
      }
      return Player.__super__.step.apply(this, arguments);
    };

    return Player;

  })(Movable);

  LocalPlayer = (function(_super) {

    __extends(LocalPlayer, _super);

    function LocalPlayer() {
      LocalPlayer.__super__.constructor.apply(this, arguments);
    }

    LocalPlayer.prototype.step = function() {
      var key, _i, _len, _ref;
      _ref = this.universe.keys;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        switch (key) {
          case 37:
            this.rotateLeft();
            break;
          case 39:
            this.rotateRight();
            break;
          case 38:
            this.forward();
            break;
          case 40:
            this.backward();
            break;
          case 68:
            this.fire();
        }
      }
      LocalPlayer.__super__.step.apply(this, arguments);
      this.controller.camera.position.x = this.position.x;
      return this.controller.camera.position.y = this.position.y;
    };

    return LocalPlayer;

  })(Player);

  CommandCentre = (function(_super) {

    __extends(CommandCentre, _super);

    CommandCentre.prototype.mass = 999999999999999999;

    CommandCentre.prototype.healthRadius = 40;

    CommandCentre.prototype.maxHealth = 10000;

    CommandCentre.prototype.radius = 45;

    CommandCentre.prototype.rotationalVelocity = Math.PI / 512;

    function CommandCentre(options) {
      CommandCentre.__super__.constructor.call(this, options);
    }

    CommandCentre.prototype.buildMesh = function() {
      var geometry, material;
      geometry = new THREE.TorusGeometry(50, 3, 40, 40, Math.PI * 2);
      material = new THREE.MeshLambertMaterial({
        ambient: 0x606162,
        color: 0x606162
      });
      return new THREE.Mesh(geometry, material);
    };

    return CommandCentre;

  })(Movable);

  Starfield = (function() {
    var FAR, NEAR, PARTICLE_COUNT;

    PARTICLE_COUNT = 100;

    NEAR = 1;

    FAR = 500;

    function Starfield(controller) {
      var color, depthMagnitude, material, p, pX, pY, pZ, particle;
      this.controller = controller;
      this.screen_range_x = Math.tan(this.controller.camera.fov * Math.PI / 180 * 0.5) * this.controller.camera.position.z * 2;
      this.screen_range_y = this.screen_range_x * this.controller.camera.aspect;
      this.particles = new THREE.Geometry();
      for (p = 0; 0 <= PARTICLE_COUNT ? p <= PARTICLE_COUNT : p >= PARTICLE_COUNT; 0 <= PARTICLE_COUNT ? p++ : p--) {
        depthMagnitude = Math.random();
        pX = Math.random() * (2 * this.screen_range_x) - this.screen_range_x;
        pY = Math.random() * (2 * this.screen_range_y) - this.screen_range_y;
        pZ = depthMagnitude * FAR - NEAR;
        particle = new THREE.Vertex(new THREE.Vector3(pX, pY, pZ));
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
      _ref = this.particles.vertices;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        particle = _ref[_i];
        if (particle.position.x - this.controller.camera.position.x < -this.screen_range_x) {
          particle.position.x = this.controller.camera.position.x + this.screen_range_x;
        } else if (particle.position.x - this.controller.camera.position.x > this.screen_range_x) {
          particle.position.x = this.controller.camera.position.x - this.screen_range_x;
        }
        if (particle.position.y - this.controller.camera.position.y < -this.screen_range_y) {
          _results.push(particle.position.y = this.controller.camera.position.y + this.screen_range_y);
        } else if (particle.position.y - this.controller.camera.position.y > this.screen_range_y) {
          _results.push(particle.position.y = this.controller.camera.position.y - this.screen_range_y);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Starfield;

  })();

  THREE.Mesh.prototype.rotateAboutObjectAxis = function(axis, radians) {
    var rotationMatrix;
    rotationMatrix = new THREE.Matrix4();
    rotationMatrix.setRotationAxis(axis.normalize(), radians);
    this.matrix.multiplySelf(rotationMatrix);
    return this.rotation.setRotationFromMatrix(this.matrix);
  };

  THREE.Mesh.prototype.rotateAboutWorldAxis = function(axis, radians) {
    var rotationMatrix;
    rotationMatrix = new THREE.Matrix4();
    rotationMatrix.setRotationAxis(axis.normalize(), radians);
    rotationMatrix.multiplySelf(this.matrix);
    this.matrix = rotationMatrix;
    return this.rotation.setRotationFromMatrix(this.matrix);
  };

  THREE.AxisX = new THREE.Vector3(1, 0, 0);

  THREE.AxisY = new THREE.Vector3(0, 1, 0);

  THREE.AxisZ = new THREE.Vector3(0, 0, 1);

  TrailsStorage = (function() {

    function TrailsStorage(options) {
      this.universe = options.universe;
      this.controller = options.controller;
      this.pool = [];
    }

    TrailsStorage.prototype.addToPool = function(trail) {
      return this.pool.push(trail);
    };

    TrailsStorage.prototype.newShipTrail = function(parent) {
      var i, trail, _results;
      _results = [];
      for (i = 1; i <= 2; i++) {
        trail = this.pool.pop();
        if (!trail) {
          trail = new ShipTrail({
            controller: this.controller,
            universe: this.universe
          });
        }
        _results.push(trail.setup(parent.position));
      }
      return _results;
    };

    return TrailsStorage;

  })();

  ShipTrail = (function(_super) {

    __extends(ShipTrail, _super);

    ShipTrail.prototype.solid = false;

    function ShipTrail(options) {
      ShipTrail.__super__.constructor.call(this, options);
    }

    ShipTrail.prototype.buildMesh = function() {
      var geometry, material;
      geometry = new THREE.SphereGeometry(1);
      material = new THREE.MeshBasicMaterial;
      return new THREE.Mesh(geometry, material);
    };

    ShipTrail.prototype.setup = function(position) {
      this.position.set(position.x, position.y, position.z - 10);
      this.velocity.set((Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4, 0);
      this.mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255);
      this.lifetime = 40;
      return this.alive = true;
    };

    ShipTrail.prototype.remove = function() {
      this.alive = false;
      this.position.z = this.controller.NEAR;
      return this.universe.trails.addToPool(this);
    };

    ShipTrail.prototype.step = function() {
      if (this.alive) {
        if (this.lifetime > 0) {
          this.position.addSelf(this.velocity);
          this.mesh.material.opacity = this.lifetime / 30;
          return this.lifetime--;
        } else {
          return this.remove();
        }
      }
    };

    return ShipTrail;

  })(Movable);

}).call(this);
