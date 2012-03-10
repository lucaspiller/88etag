(function() {
  var AiPlayer, BulletsStorage, CommandCentre, CommandCentreInner, Controller, HealthBall, LocalPlayer, Movable, Player, PlayerShip, ShipBullet, ShipTrail, Starfield, TrailsStorage, Turret, TurretBase, Universe,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Controller = (function() {
    var CAMERA_Z, FAR, NEAR, VIEW_ANGLE;

    VIEW_ANGLE = 45;

    NEAR = 1;

    FAR = 1000;

    CAMERA_Z = 1000;

    Controller.prototype.models = ['models/ship_basic.js', 'models/command_centre.js', 'models/command_centre_inner.js', 'models/turret.js', 'models/turret_base.js'];

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
      var loader, model, _i, _len, _ref, _results;
      this.geometries = {};
      loader = new THREE.JSONLoader();
      _ref = this.models;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        _results.push(this.loadModel(loader, model));
      }
      return _results;
    };

    Controller.prototype.loadModel = function(loader, model) {
      var _this = this;
      return loader.load(model, function(geometry) {
        geometry.computeVertexNormals();
        _this.geometries[model] = geometry;
        if (_.size(_this.geometries) === _.size(_this.models)) {
          return _this.continueLoad();
        }
      });
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
      this.players = [];
      this.buildPlayer();
      this.bindKeys();
    }

    Universe.prototype.buildPlayer = function() {
      var ai;
      this.player = new LocalPlayer({
        controller: this.controller,
        universe: this
      });
      this.players.push(this.player);
      ai = new AiPlayer({
        controller: this.controller,
        universe: this
      });
      return this.players.push(ai);
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
      var mass, player, _i, _j, _len, _len2, _ref, _ref2, _results;
      this.starfield.step();
      _ref = this.masses;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        mass = _ref[_i];
        mass.step();
      }
      _ref2 = this.players;
      _results = [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        player = _ref2[_j];
        _results.push(player.step());
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
          if (m1.mass <= m2.mass && m1.overlaps(m2)) m1.handleCollision(m2);
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

  PlayerShip = (function(_super) {

    __extends(PlayerShip, _super);

    PlayerShip.prototype.healthRadius = 8;

    PlayerShip.prototype.maxHealth = 1000;

    PlayerShip.prototype.radius = 10;

    PlayerShip.prototype.mass = 10;

    PlayerShip.prototype.max_speed = 2;

    PlayerShip.prototype.max_accel = 0.05;

    function PlayerShip(options) {
      PlayerShip.__super__.constructor.call(this, options);
      this.parent = options.parent;
      this.acceleration = new THREE.Vector3(0, 0, 0);
      this.position.y = this.parent.commandCentre.position.y - this.parent.commandCentre.radius - 10;
      this.rotation = Math.PI * 1.5;
      this.mesh.rotateAboutObjectAxis(THREE.AxisZ, this.rotation);
      this.bulletDelay = 0;
    }

    PlayerShip.prototype.buildMesh = function() {
      var material;
      material = new THREE.MeshLambertMaterial({
        ambient: 0x5E574B,
        color: 0x5E574B
      });
      return new THREE.Mesh(this.controller.geometries['models/ship_basic.js'], material);
    };

    PlayerShip.prototype.rotateLeft = function() {
      return this.rotationalVelocity = Math.PI / 64;
    };

    PlayerShip.prototype.rotateRight = function() {
      return this.rotationalVelocity = -Math.PI / 64;
    };

    PlayerShip.prototype.forward = function() {
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

    PlayerShip.prototype.backward = function() {
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

    PlayerShip.prototype.fire = function() {
      if (this.bulletDelay <= 0) {
        this.universe.bullets.newShipBullet(this);
        return this.bulletDelay = 10;
      }
    };

    PlayerShip.prototype.step = function() {
      var speed;
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
      return PlayerShip.__super__.step.apply(this, arguments);
    };

    PlayerShip.prototype.explode = function() {
      PlayerShip.__super__.explode.apply(this, arguments);
      return this.parent.respawn();
    };

    return PlayerShip;

  })(Movable);

  CommandCentreInner = (function() {

    CommandCentreInner.prototype.rotationalVelocity = -Math.PI / 512;

    function CommandCentreInner(options) {
      this.controller = options.controller;
      this.universe = options.universe;
      this.mesh = this.buildMesh();
      this.position = this.mesh.position = new THREE.Vector3(0, 0, 500);
      if (options.position) {
        this.position.x = this.mesh.position.x = options.position.x;
        this.position.y = this.mesh.position.y = options.position.y;
      }
      this.controller.scene.add(this.mesh);
    }

    CommandCentreInner.prototype.remove = function() {
      return this.controller.scene.remove(this.mesh);
    };

    CommandCentreInner.prototype.buildMesh = function() {
      var material;
      material = new THREE.MeshFaceMaterial;
      return new THREE.Mesh(this.controller.geometries['models/command_centre_inner.js'], material);
    };

    CommandCentreInner.prototype.step = function() {
      return this.mesh.rotateAboutWorldAxis(THREE.AxisZ, this.rotationalVelocity);
    };

    return CommandCentreInner;

  })();

  CommandCentre = (function(_super) {

    __extends(CommandCentre, _super);

    CommandCentre.prototype.mass = 999999999999999999;

    CommandCentre.prototype.healthRadius = 25;

    CommandCentre.prototype.maxHealth = 10000;

    CommandCentre.prototype.radius = 50;

    CommandCentre.prototype.rotationalVelocity = Math.PI / 512;

    function CommandCentre(options) {
      this.inner = new CommandCentreInner(options);
      CommandCentre.__super__.constructor.call(this, options);
      if (options.position) {
        this.position.x = this.mesh.position.x = options.position.x;
        this.position.y = this.mesh.position.y = options.position.y;
      }
    }

    CommandCentre.prototype.buildMesh = function() {
      var material;
      material = new THREE.MeshFaceMaterial;
      return new THREE.Mesh(this.controller.geometries['models/command_centre.js'], material);
    };

    CommandCentre.prototype.remove = function() {
      CommandCentre.__super__.remove.apply(this, arguments);
      return this.inner.remove();
    };

    CommandCentre.prototype.step = function() {
      CommandCentre.__super__.step.apply(this, arguments);
      this.inner.position.set(this.position.x, this.position.y, this.position.z);
      return this.inner.step();
    };

    return CommandCentre;

  })(Movable);

  Player = (function() {

    function Player(options) {
      this.options = options;
      options.parent = this;
      this.universe = options.universe;
      this.controller = options.controller;
      this.commandCentre = new CommandCentre(options);
      this.buildShip();
    }

    Player.prototype.buildShip = function() {
      return this.ship = new PlayerShip(this.options);
    };

    Player.prototype.step = function() {
      true;      if (!this.ship) {
        if (this.respawnDelay <= 0) {
          return this.buildShip();
        } else {
          return this.respawnDelay--;
        }
      }
    };

    Player.prototype.respawn = function() {
      this.ship = false;
      return this.respawnDelay = 300;
    };

    return Player;

  })();

  LocalPlayer = (function(_super) {

    __extends(LocalPlayer, _super);

    function LocalPlayer() {
      LocalPlayer.__super__.constructor.apply(this, arguments);
    }

    LocalPlayer.prototype.step = function() {
      var key, _i, _len, _ref;
      LocalPlayer.__super__.step.apply(this, arguments);
      if (this.ship) {
        _ref = this.universe.keys;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          key = _ref[_i];
          switch (key) {
            case 37:
              this.ship.rotateLeft();
              break;
            case 39:
              this.ship.rotateRight();
              break;
            case 38:
              this.ship.forward();
              break;
            case 40:
              this.ship.backward();
              break;
            case 68:
              this.ship.fire();
              break;
            case 81:
              this.buildTurret();
              this.universe.keys = _.without(this.universe.keys, 81);
          }
        }
        this.controller.camera.position.x = this.ship.position.x;
        return this.controller.camera.position.y = this.ship.position.y;
      }
    };

    LocalPlayer.prototype.buildTurret = function() {
      var turret;
      return turret = new Turret({
        universe: this.universe,
        controller: this.controller,
        position: this.ship.position.clone(),
        parent: this
      });
    };

    return LocalPlayer;

  })(Player);

  AiPlayer = (function(_super) {
    var AI_STEP_INTERVAL, FIRE_ANGLE_DIFF_MAX, FIRE_MAX_DISTANCE, ROTATE_ANGLE_DIFF_MAX;

    __extends(AiPlayer, _super);

    AI_STEP_INTERVAL = 5;

    ROTATE_ANGLE_DIFF_MAX = Math.PI / 16;

    FIRE_ANGLE_DIFF_MAX = Math.PI / 8;

    FIRE_MAX_DISTANCE = 1000;

    function AiPlayer(options) {
      options.position = new THREE.Vector3(0, 0, 0);
      options.position.x = (Math.random() * 10000) - 5000;
      options.position.y = (Math.random() * 10000) - 5000;
      AiPlayer.__super__.constructor.call(this, options);
      this.aiStepCounter = 0;
      this.angle = 0;
    }

    AiPlayer.prototype.step = function() {
      AiPlayer.__super__.step.apply(this, arguments);
      if (this.ship) {
        if (this.aiStepCounter <= 0) {
          this.aiStep();
          return this.aiStepCounter = AI_STEP_INTERVAL;
        } else {
          this.aiStepCounter--;
          if (Math.abs(this.ship.rotation - this.angle) > ROTATE_ANGLE_DIFF_MAX) {
            if (this.ship.rotation > this.angle) {
              this.ship.rotateRight();
            } else if (this.ship.rotation < this.angle) {
              this.ship.rotateLeft();
            }
          }
          return this.ship.forward();
        }
      }
    };

    AiPlayer.prototype.aiStep = function() {
      var vector;
      if (!this.target) this.chooseTarget();
      if (this.target && this.target.ship) {
        vector = this.target.ship.position.clone().subSelf(this.ship.position);
        this.angle = Math.atan2(vector.y, vector.x);
        return this.fire = Math.abs(this.ship.rotation - this.angle) <= FIRE_ANGLE_DIFF_MAX && vector.length() < FIRE_MAX_DISTANCE;
      } else {
        return this.fire = false;
      }
    };

    AiPlayer.prototype.chooseTarget = function() {
      var player, _i, _len, _ref, _results;
      _ref = this.universe.players;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        if (player !== this) {
          this.target = player;
          break;
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return AiPlayer;

  })(Player);

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

    ShipTrail.prototype.handleCollision = function(other) {
      return true;
    };

    return ShipTrail;

  })(Movable);

  TurretBase = (function() {

    function TurretBase(options) {
      this.controller = options.controller;
      this.universe = options.universe;
      this.mesh = this.buildMesh();
      this.position = this.mesh.position = new THREE.Vector3(0, 0, 500);
      if (options.position) {
        this.position.x = this.mesh.position.x = options.position.x;
        this.position.y = this.mesh.position.y = options.position.y;
      }
      this.controller.scene.add(this.mesh);
    }

    TurretBase.prototype.remove = function() {
      return this.controller.scene.remove(this.mesh);
    };

    TurretBase.prototype.buildMesh = function() {
      var geometry, material, _i, _len, _ref;
      material = new THREE.MeshFaceMaterial;
      geometry = this.controller.geometries['models/turret_base.js'];
      _ref = geometry.materials;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        material = _ref[_i];
        material.shading = THREE.FlatShading;
      }
      return new THREE.Mesh(geometry, material);
    };

    return TurretBase;

  })();

  Turret = (function(_super) {
    var AI_STEP_INTERVAL, FIRE_ANGLE_DIFF_MAX, FIRE_MAX_DISTANCE, ROTATE_ANGLE_DIFF_MAX;

    __extends(Turret, _super);

    AI_STEP_INTERVAL = 60;

    ROTATE_ANGLE_DIFF_MAX = Math.PI / 32;

    FIRE_ANGLE_DIFF_MAX = Math.PI / 8;

    FIRE_MAX_DISTANCE = 1000;

    Turret.prototype.radius = 20;

    Turret.prototype.healthRadius = 8;

    Turret.prototype.mass = 1000;

    Turret.prototype.maxHealth = 1000;

    function Turret(options) {
      this.base = new TurretBase(options);
      Turret.__super__.constructor.call(this, options);
      this.parent = options.parent;
      this.position.x = options.position.x;
      this.position.y = options.position.y;
      this.aiStepCounter = 0;
      this.bulletDelay = 0;
    }

    Turret.prototype.buildMesh = function() {
      var geometry, material, _i, _len, _ref;
      material = new THREE.MeshFaceMaterial;
      geometry = this.controller.geometries['models/turret.js'];
      _ref = geometry.materials;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        material = _ref[_i];
        material.shading = THREE.FlatShading;
      }
      return new THREE.Mesh(geometry, material);
    };

    Turret.prototype.rotateLeft = function() {
      return this.rotationalVelocity = Math.PI / 64;
    };

    Turret.prototype.rotateRight = function() {
      return this.rotationalVelocity = -Math.PI / 64;
    };

    Turret.prototype.rotateStop = function() {
      return this.rotationalVelocity = 0;
    };

    Turret.prototype.remove = function() {
      Turret.__super__.remove.apply(this, arguments);
      return this.base.remove();
    };

    Turret.prototype.step = function() {
      Turret.__super__.step.apply(this, arguments);
      if (this.aiStepCounter <= 0) {
        this.aiStep();
        this.aiStepCounter = AI_STEP_INTERVAL;
      } else {
        this.aiStepCounter--;
      }
      if (Math.abs(this.rotation - this.angle) > ROTATE_ANGLE_DIFF_MAX) {
        if (this.rotation > this.angle) {
          this.rotateRight();
        } else if (this.rotation < this.angle) {
          this.rotateLeft();
        }
      } else {
        this.rotateStop();
      }
      this.bulletDelay--;
      if (this.shouldFire) return this.fire();
    };

    Turret.prototype.fire = function() {
      if (this.bulletDelay <= 0) {
        this.universe.bullets.newShipBullet(this);
        return this.bulletDelay = 50;
      }
    };

    Turret.prototype.aiStep = function() {
      var vector;
      if (!this.target) this.chooseTarget();
      if (this.target && this.target.ship) {
        vector = this.target.ship.position.clone().subSelf(this.position);
        this.angle = Math.atan2(vector.y, vector.x);
        return this.shouldFire = Math.abs(this.rotation - this.angle) <= FIRE_ANGLE_DIFF_MAX && vector.length() < FIRE_MAX_DISTANCE;
      } else {
        return this.shouldFire = false;
      }
    };

    Turret.prototype.chooseTarget = function() {
      var player, _i, _len, _ref, _results;
      _ref = this.universe.players;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        if (player !== this.parent) {
          console.log(player, this.parent);
          this.target = player;
          break;
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Turret;

  })(Movable);

}).call(this);
