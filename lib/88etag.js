(function() {
  var AiPlayer, Bullet, BulletsStorage, Client, CommandCentre, CommandCentreInner, Controller, HealthBall, Indicator, LocalPlayer, MassDriver, MassDriverFire, MeshFactory, Movable, Player, PlayerShip, Server, ShipBullet, ShipTrail, Starfield, Trail, TrailsStorage, Turret, TurretBase, TurretBullet, TurretBulletTrail, Universe,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Controller = (function() {
    var CAMERA_Z, FAR, NEAR, VIEW_ANGLE;

    VIEW_ANGLE = 45;

    NEAR = 1;

    FAR = 1000;

    CAMERA_Z = 1000;

    Controller.prototype.models = ['models/ship_basic.js', 'models/command_centre.js', 'models/command_centre_inner.js', 'models/turret.js', 'models/turret_base.js', 'models/mass_driver.js'];

    function Controller() {
      var _this = this;
      this.loadedModels = false;
      this.localStep = 0;
      this.setupRenderer();
      this.setupScene();
      this.client = new Client(this);
      this.client.connect(window.location, function() {
        return _this.continueLoad();
      });
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
      this.container = document.createElement('div');
      document.body.appendChild(this.container);
      this.container.appendChild(this.renderer.domElement);
      if (window.Stats) {
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        container.appendChild(this.stats.domElement);
      }
      return this.meshFactory = new MeshFactory(this);
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

    Controller.prototype.screen_range = function(depth) {
      var range_x, range_y;
      range_x = Math.tan(this.camera.fov * Math.PI / 180) * (this.camera.position.z - depth) * 2;
      range_y = range_x / this.camera.aspect;
      return [range_x, range_y];
    };

    Controller.prototype.camera_x_min = function(range_x) {
      return this.camera.position.x - range_x / 2;
    };

    Controller.prototype.camera_x_max = function(range_x) {
      return this.camera.position.x + range_x / 2;
    };

    Controller.prototype.camera_y_min = function(range_y) {
      return this.camera.position.y - range_y / 2;
    };

    Controller.prototype.camera_y_max = function(range_y) {
      return this.camera.position.y + range_y / 2;
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
          _this.loadedModels = true;
          return _this.continueLoad();
        }
      });
    };

    Controller.prototype.continueLoad = function() {
      if (this.loadedModels && this.client.connected) {
        this.universe = this.client.universe = new Universe(this);
        return this.render();
      }
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
      if (this.stats) this.stats.update();
      return this.localStep++;
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
        if (m1.alive) {
          _ref2 = this.masses;
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            m2 = _ref2[_j];
            if (m2.alive) {
              if (m1.mass <= m2.mass && m1.overlaps(m2)) m1.handleCollision(m2);
            }
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
      material = new THREE.MeshBasicMaterial();
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

    Movable.prototype.type = 'unknown';

    Movable.prototype.maxHealth = 100;

    Movable.prototype.healthRadius = 10;

    Movable.prototype.mass = 1;

    Movable.prototype.solid = true;

    Movable.prototype.collidable = true;

    Movable.prototype.radius = 10;

    Movable.prototype.rotation = 0;

    Movable.prototype.rotationalVelocity = 0;

    Movable.prototype.alive = true;

    function Movable(options) {
      var _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      this.id = Math.random();
      this.controller = options.controller;
      this.universe = options.universe;
      this.local = (_ref = options.local) != null ? _ref : true;
      this.type = (_ref2 = options.type) != null ? _ref2 : this.type;
      this.position = new THREE.Vector3(0, 0, 500);
      this.position.x = (_ref3 = (_ref4 = options.position) != null ? _ref4.x : void 0) != null ? _ref3 : 0;
      this.position.y = (_ref5 = (_ref6 = options.position) != null ? _ref6.y : void 0) != null ? _ref5 : 0;
      this.mesh = this.buildMesh();
      this.mesh.rotateAboutWorldAxis(THREE.AxisZ, 0.001);
      this.mesh.position = this.position;
      this.controller.scene.add(this.mesh);
      this.velocity = this.mesh.velocity = new THREE.Vector3(0, 0, 0);
      this.mesh.position = this.position;
      this.rotation = (_ref7 = options.rotation) != null ? _ref7 : 0;
      this.mesh.rotateAboutObjectAxis(THREE.AxisZ, this.rotation);
      this.health = this.maxHealth;
      this.universe.masses.push(this);
      if (this.local) {
        this.controller.client.objectCreated(this);
        if (this.solid) {
          this.healthBall = new HealthBall({
            controller: this.controller,
            position: this.position,
            maxHealth: this.maxHealth,
            radius: this.healthRadius
          });
        }
      }
    }

    Movable.prototype.buildMesh = function() {
      var geometry, material;
      if (this.controller.meshFactory[this.type]) {
        return this.controller.meshFactory[this.type]();
      } else {
        geometry = new THREE.CubeGeometry(10, 10, 10);
        material = new THREE.MeshLambertMaterial({
          ambient: 0xFF0000,
          color: 0xFF0000
        });
        return new THREE.Mesh(geometry, material);
      }
    };

    Movable.prototype.explode = function() {
      return this.remove();
    };

    Movable.prototype.remove = function() {
      this.controller.scene.remove(this.mesh);
      this.universe.masses = _.without(this.universe.masses, this);
      if (this.local) {
        this.controller.client.objectDestroyed(this);
        if (this.solid) return this.healthBall.remove();
      }
    };

    Movable.prototype.step = function() {
      if (this.solid) this.velocity.multiplyScalar(0.99);
      this.position.addSelf(this.velocity);
      if (Math.abs(this.rotationalVelocity) > 0) {
        this.mesh.rotateAboutWorldAxis(THREE.AxisZ, this.rotationalVelocity);
        this.rotation = (this.rotation + this.rotationalVelocity) % (Math.PI * 2);
      }
      if (this.local) {
        if (!this.velocity.isZero()) this.controller.client.objectMoved(this);
        if (this.solid) return this.healthBall.update(this.position, this.health);
      }
    };

    Movable.prototype.setRotation = function(rotation) {
      this.mesh.rotateAboutWorldAxis(THREE.AxisZ, -this.rotation);
      this.mesh.rotateAboutWorldAxis(THREE.AxisZ, rotation);
      return this.rotation = rotation;
    };

    Movable.prototype.overlaps = function(other) {
      var diff, max, x, y;
      if (!(this.local && other.local)) return;
      if (other === this) return false;
      x = this.position.x - other.position.x;
      y = this.position.y - other.position.y;
      max = other.radius + this.radius;
      if (x < max && y < max) {
        diff = Math.sqrt(x * x + y * y);
        return diff < max;
      } else {
        return false;
      }
    };

    Movable.prototype.handleCollision = function(other) {
      var m1, m2, v1i, v2i, _results;
      if (!(this.solid && other.solid)) return;
      v1i = this.velocity;
      v2i = other.velocity;
      m1 = this.mass;
      m2 = other.mass;
      this.velocity = v1i.clone().multiplyScalar((m1 - m2) / (m2 + m1)).addSelf(v2i.clone().multiplyScalar((2 * m2) / (m2 + m1))).multiplyScalar(0.75);
      other.velocity = v1i.clone().multiplyScalar((2 * m1) / (m2 + m1)).addSelf(v2i.clone().multiplyScalar((m2 - m1) / (m2 + m1))).multiplyScalar(0.75);
      if (this.overlaps(other)) {
        this.velocity.x += Math.random() - 0.5;
        this.velocity.y += Math.random() - 0.5;
        _results = [];
        while (this.overlaps(other)) {
          this.position.addSelf(this.velocity);
          _results.push(other.position.addSelf(other.velocity));
        }
        return _results;
      }
    };

    return Movable;

  })();

  if (typeof window !== 'undefined') {
    $(document).ready(function() {
      if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
      }
      return new Controller;
    });
  }

  BulletsStorage = (function() {

    function BulletsStorage(options) {
      this.universe = options.universe;
      this.controller = options.controller;
      this.shipBulletPool = [];
      this.turretBulletPool = [];
    }

    BulletsStorage.prototype.addToShipBulletPool = function(bullet) {
      return this.shipBulletPool.push(bullet);
    };

    BulletsStorage.prototype.addToTurretBulletPool = function(bullet) {
      return this.turretBulletPool.push(bullet);
    };

    BulletsStorage.prototype.newShipBullet = function(parent) {
      var bullet;
      bullet = this.shipBulletPool.pop();
      if (!bullet) {
        bullet = new ShipBullet({
          controller: this.controller,
          universe: this.universe
        });
      }
      return bullet.setup(parent);
    };

    BulletsStorage.prototype.newTurretBullet = function(parent) {
      var bullet;
      bullet = this.turretBulletPool.pop();
      if (!bullet) {
        bullet = new TurretBullet({
          controller: this.controller,
          universe: this.universe
        });
      }
      return bullet.setup(parent);
    };

    return BulletsStorage;

  })();

  Bullet = (function(_super) {
    var HIDDEN_Z;

    __extends(Bullet, _super);

    HIDDEN_Z = 2000;

    Bullet.prototype.solid = false;

    Bullet.prototype.mass = 0;

    function Bullet(options) {
      Bullet.__super__.constructor.call(this, options);
    }

    Bullet.prototype.setup = function(parent) {
      this.parent = parent;
      this.position.set(this.parent.position.x, this.parent.position.y, this.parent.position.z - 10);
      this.rotation = this.parent.rotation - (Math.PI * 1.5);
      this.mesh.rotateAboutObjectAxis(THREE.AxisZ, this.rotation);
      this.velocity.x = Math.cos(this.parent.rotation);
      this.velocity.y = Math.sin(this.parent.rotation);
      return this.alive = true;
    };

    Bullet.prototype.remove = function() {
      this.controller.client.objectDestroyed(this);
      this.alive = false;
      this.position.z = HIDDEN_Z;
      return this.mesh.rotateAboutObjectAxis(THREE.AxisZ, -this.rotation);
    };

    Bullet.prototype.step = function() {
      if (this.alive) {
        if (this.lifetime > 0) {
          this.position.addSelf(this.velocity);
          return this.lifetime--;
        } else {
          return this.remove();
        }
      }
    };

    Bullet.prototype.handleCollision = function(other) {
      if (!other.solid) return;
      if (other === this.parent) return;
      other.health -= this.damage;
      if (other.health <= 0) other.explode();
      return this.remove();
    };

    return Bullet;

  })(Movable);

  ShipBullet = (function(_super) {

    __extends(ShipBullet, _super);

    function ShipBullet() {
      ShipBullet.__super__.constructor.apply(this, arguments);
    }

    ShipBullet.prototype.type = 'shipBullet';

    ShipBullet.prototype.damage = 100;

    ShipBullet.prototype.radius = 5;

    ShipBullet.prototype.setup = function(parent) {
      this.parent = parent;
      ShipBullet.__super__.setup.apply(this, arguments);
      this.velocity.multiplyScalar(6);
      this.mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255);
      this.lifetime = 100;
      return this.controller.client.objectCreated(this);
    };

    ShipBullet.prototype.remove = function() {
      ShipBullet.__super__.remove.apply(this, arguments);
      return this.universe.bullets.addToShipBulletPool(this);
    };

    return ShipBullet;

  })(Bullet);

  TurretBullet = (function(_super) {

    __extends(TurretBullet, _super);

    function TurretBullet() {
      TurretBullet.__super__.constructor.apply(this, arguments);
    }

    TurretBullet.prototype.type = 'turretBullet';

    TurretBullet.prototype.damage = 100;

    TurretBullet.prototype.radius = 5;

    TurretBullet.prototype.setup = function(parent) {
      this.parent = parent;
      TurretBullet.__super__.setup.apply(this, arguments);
      this.velocity.multiplyScalar(6);
      this.mesh.material.color.setRGB(89 / 255, 163 / 255, 89 / 255);
      this.lifetime = 100;
      return this.controller.client.objectCreated(this);
    };

    TurretBullet.prototype.remove = function() {
      TurretBullet.__super__.remove.apply(this, arguments);
      return this.universe.bullets.addToTurretBulletPool(this);
    };

    TurretBullet.prototype.step = function() {
      TurretBullet.__super__.step.apply(this, arguments);
      if (this.alive) return this.universe.trails.newTurretBulletTrail(this);
    };

    return TurretBullet;

  })(Bullet);

  Client = (function() {
    var SEND_INTERVAL;

    SEND_INTERVAL = 10;

    function Client(controller) {
      this.controller = controller;
      this.connected = false;
      this.id = Math.random();
      this.objects = [];
    }

    Client.prototype.connect = function(host, callback) {
      var _this = this;
      this.socket = io.connect(host);
      this.socket.on('connect', function() {
        if (_this.connected) {
          return window.location = window.location;
        } else {
          _this.socket.emit('clientId', _this.id);
          _this.connected = true;
          return callback();
        }
      });
      this.socket.on('connect_failed', function() {
        return alert('Unable to connect to server!');
      });
      this.socket.on('objectCreated', function(data) {
        var object;
        if (data.clientId !== _this.id) {
          if (_this.objects[data.id]) {
            object = _this.objects[data.id];
            object.remove();
            delete object;
          }
          object = new Movable({
            controller: _this.controller,
            universe: _this.universe,
            local: false,
            type: data.type
          });
          object.solid = data.solid;
          object.position.x = data.position.x;
          object.position.y = data.position.y;
          object.velocity.x = data.velocity.x;
          object.velocity.y = data.velocity.y;
          object.setRotation(data.rotation);
          object.rotationalVelocity = data.rotationalVelocity;
          return _this.objects[data.id] = object;
        }
      });
      this.socket.on('objectMoved', function(data) {
        var object;
        if (data.clientId !== _this.id) {
          object = _this.objects[data.id];
          object.position.x = data.position.x;
          object.position.y = data.position.y;
          object.velocity.x = data.velocity.x;
          object.velocity.y = data.velocity.y;
          object.setRotation(data.rotation);
          return object.rotationalVelocity = data.rotationalVelocity;
        }
      });
      return this.socket.on('objectDestroyed', function(data) {
        var object;
        if (data.clientId !== _this.id) {
          object = _this.objects[data.id];
          object.remove();
          return delete object;
        }
      });
    };

    Client.prototype.objectCreated = function(object) {
      if (object.collidable) {
        object.lastSendStep = this.controller.localStep;
        return this.socket.emit('objectCreated', this.serialize(object));
      }
    };

    Client.prototype.objectMoved = function(object) {
      if (object.collidable) {
        if ((this.controller.localStep - object.lastSendStep) > SEND_INTERVAL) {
          object.lastSendStep = this.controller.localStep;
          return this.socket.emit('objectMoved', this.serialize(object));
        }
      }
    };

    Client.prototype.objectDestroyed = function(object) {
      if (object.collidable) {
        object.lastSendStep = this.controller.localStep;
        return this.socket.emit('objectDestroyed', this.serialize(object));
      }
    };

    Client.prototype.serialize = function(object) {
      return {
        clientId: this.id,
        id: object.id,
        type: object.type,
        solid: object.solid,
        rotation: object.rotation,
        rotationalVelocity: object.rotationalVelocity,
        position: {
          x: object.position.x,
          y: object.position.y
        },
        velocity: {
          x: object.velocity.x,
          y: object.velocity.y
        }
      };
    };

    return Client;

  })();

  MassDriver = (function(_super) {
    var AI_STEP_INTERVAL, FIRE_MAX_DISTANCE;

    __extends(MassDriver, _super);

    AI_STEP_INTERVAL = 60;

    FIRE_MAX_DISTANCE = 300;

    MassDriver.prototype.type = 'massDriver';

    MassDriver.prototype.radius = 32;

    MassDriver.prototype.healthRadius = 8;

    MassDriver.prototype.mass = 250;

    MassDriver.prototype.maxHealth = 1000;

    function MassDriver(options) {
      MassDriver.__super__.constructor.call(this, options);
      this.parent = options.parent;
      this.aiStepCounter = 0;
      this.fireDelay = 60;
      this.rotationalVelocity = Math.PI / 512;
    }

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
      if (this.shouldFire) return this.fire();
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
      if (!this.target) this.chooseTarget();
      if (this.target) {
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

    MassDriverFire.prototype.type = 'massDriverFire';

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

  MeshFactory = (function() {

    function MeshFactory(controller) {
      this.controller = controller;
      true;
    }

    MeshFactory.prototype.turretBase = function() {
      var geometry, material, _i, _len, _ref;
      material = new THREE.MeshFaceMaterial;
      geometry = this.controller.geometries['models/turret_base.js'];
      _ref = geometry.materials;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        material = _ref[_i];
        material.shading = THREE.FlatShading;
      }
      return this.buildMesh(material, geometry);
    };

    MeshFactory.prototype.turret = function() {
      var geometry, material, _i, _len, _ref;
      material = new THREE.MeshFaceMaterial;
      geometry = this.controller.geometries['models/turret.js'];
      _ref = geometry.materials;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        material = _ref[_i];
        material.shading = THREE.FlatShading;
      }
      return this.buildMesh(material, geometry);
    };

    MeshFactory.prototype.massDriver = function() {
      var geometry, material;
      material = new THREE.MeshLambertMaterial({
        ambient: 0x5B3C1D,
        color: 0x5B3C1D
      });
      geometry = this.controller.geometries['models/mass_driver.js'];
      return this.buildMesh(material, geometry);
    };

    MeshFactory.prototype.playerShip = function() {
      var geometry, material;
      material = new THREE.MeshLambertMaterial({
        ambient: 0x5E574B,
        color: 0x5E574B
      });
      geometry = this.controller.geometries['models/ship_basic.js'];
      return this.buildMesh(material, geometry);
    };

    MeshFactory.prototype.shipBullet = function() {
      var geometry, material;
      geometry = new THREE.SphereGeometry(5);
      material = new THREE.MeshBasicMaterial;
      material.color.setRGB(89 / 255, 163 / 255, 89 / 255);
      return this.buildMesh(material, geometry);
    };

    MeshFactory.prototype.turretBullet = function() {
      var geometry, material;
      geometry = new THREE.CylinderGeometry(2, 1, 10, 10);
      material = new THREE.MeshBasicMaterial;
      material.color.setRGB(89 / 255, 163 / 255, 89 / 255);
      return this.buildMesh(material, geometry);
    };

    MeshFactory.prototype.commandCentreInner = function() {
      var geometry, material;
      material = new THREE.MeshFaceMaterial;
      geometry = this.controller.geometries['models/command_centre_inner.js'];
      return this.buildMesh(material, geometry);
    };

    MeshFactory.prototype.commandCentre = function() {
      var geometry, material;
      material = new THREE.MeshFaceMaterial;
      geometry = this.controller.geometries['models/command_centre.js'];
      return this.buildMesh(material, geometry);
    };

    MeshFactory.prototype.buildMesh = function(material, geometry) {
      return new THREE.Mesh(geometry, material);
    };

    return MeshFactory;

  })();

  PlayerShip = (function(_super) {

    __extends(PlayerShip, _super);

    PlayerShip.prototype.type = 'playerShip';

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
      this.bulletDelay = 0;
    }

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
      return this.controller.meshFactory.commandCentreInner();
    };

    CommandCentreInner.prototype.step = function() {
      return this.mesh.rotateAboutWorldAxis(THREE.AxisZ, this.rotationalVelocity);
    };

    return CommandCentreInner;

  })();

  CommandCentre = (function(_super) {

    __extends(CommandCentre, _super);

    CommandCentre.prototype.type = 'commandCentre';

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

  Indicator = (function() {

    function Indicator(options) {
      var _ref;
      this.controller = options.controller;
      this.universe = options.universe;
      this.parent = options.parent;
      this.element = document.createElement('div');
      $(this.element).addClass('indicator');
      this.controller.container.appendChild(this.element);
      _ref = this.controller.screen_range(600), this.range_x = _ref[0], this.range_y = _ref[1];
    }

    Indicator.prototype.step = function() {
      var camera_x_max, camera_x_min, camera_y_max, camera_y_min, position, x, xOff, y, yOff;
      if (this.parent === this.universe.player) $(this.element).addClass('player');
      camera_x_min = this.controller.camera_x_min(this.range_x);
      camera_x_max = this.controller.camera_x_max(this.range_x);
      camera_y_min = this.controller.camera_y_min(this.range_y);
      camera_y_max = this.controller.camera_y_max(this.range_y);
      if (this.parent.commandCentre) {
        position = this.parent.commandCentre.position;
        xOff = true;
        yOff = true;
        if (position.x < camera_x_min) {
          x = 0;
        } else if (position.x > camera_x_max) {
          x = this.controller.width();
        } else {
          x = ((position.x - camera_x_min) / this.range_x) * this.controller.width();
          xOff = false;
        }
        if (position.y < camera_y_min) {
          y = this.controller.height();
        } else if (position.y > camera_y_max) {
          y = 0;
        } else {
          y = (1 - ((position.y - camera_y_min) / this.range_y)) * this.controller.height();
          yOff = false;
        }
        if (yOff || xOff) {
          return $(this.element).css({
            'top': y - 10,
            'left': x - 10
          });
        } else {
          return $(this.element).css({
            'top': -20,
            'left': -20
          });
        }
      }
    };

    return Indicator;

  })();

  Player = (function() {

    function Player(options) {
      this.options = options;
      this.universe = options.universe;
      this.controller = options.controller;
      this.commandCentre = new CommandCentre(options);
      this.indicator = new Indicator({
        controller: this.controller,
        universe: this.universe,
        parent: this
      });
      this.buildShip();
    }

    Player.prototype.buildShip = function() {
      var y;
      y = this.commandCentre.position.y - this.commandCentre.radius - 10;
      return this.ship = new PlayerShip({
        controller: this.controller,
        universe: this.universe,
        parent: this,
        rotation: Math.PI * 1.5,
        position: {
          y: y
        }
      });
    };

    Player.prototype.step = function() {
      this.indicator.step();
      if (!this.ship) {
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
              break;
            case 87:
              this.buildMassDriver();
              this.universe.keys = _.without(this.universe.keys, 87);
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
        position: this.ship.position,
        parent: this
      });
    };

    LocalPlayer.prototype.buildMassDriver = function() {
      var massdriver;
      return massdriver = new MassDriver({
        universe: this.universe,
        controller: this.controller,
        position: this.ship.position,
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
          this.ship.forward();
          if (this.fire) return this.ship.fire();
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

  Server = (function() {

    function Server() {
      this.objects = [];
    }

    Server.prototype.start = function(io) {
      var _this = this;
      this.io = io;
      return this.io.sockets.on('connection', function(socket) {
        var clientId, object, _, _ref;
        clientId = void 0;
        _ref = _this.objects;
        for (_ in _ref) {
          object = _ref[_];
          socket.emit('objectCreated', object);
        }
        socket.on('clientId', function(data) {
          return clientId = data;
        });
        socket.on('objectCreated', function(data) {
          _this.io.sockets.emit('objectCreated', data);
          return _this.objects[data.id] = data;
        });
        socket.on('objectMoved', function(data) {
          _this.io.sockets.emit('objectMoved', data);
          return _this.objects[data.id] = data;
        });
        socket.on('objectDestroyed', function(data) {
          _this.io.sockets.emit('objectDestroyed', data);
          return delete _this.objects[data.id];
        });
        return socket.on('disconnect', function() {
          var object, _, _ref2, _results;
          if (clientId) {
            _ref2 = _this.objects;
            _results = [];
            for (_ in _ref2) {
              object = _ref2[_];
              if (object.clientId === clientId) {
                _this.io.sockets.emit('objectDestroyed', object);
                _results.push(delete _this.objects[object.id]);
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          }
        });
      });
    };

    return Server;

  })();

  if (typeof exports !== "undefined") module.exports.server = Server;

  Starfield = (function() {
    var FAR, NEAR, PARTICLE_COUNT;

    PARTICLE_COUNT = 50;

    NEAR = 1;

    FAR = 500;

    function Starfield(controller) {
      var color, depthMagnitude, material, p, pX, pY, pZ, particle, _ref;
      this.controller = controller;
      _ref = this.controller.screen_range(0), this.screen_range_x = _ref[0], this.screen_range_y = _ref[1];
      this.particles = new THREE.Geometry();
      for (p = 0; 0 <= PARTICLE_COUNT ? p <= PARTICLE_COUNT : p >= PARTICLE_COUNT; 0 <= PARTICLE_COUNT ? p++ : p--) {
        depthMagnitude = Math.random();
        pX = Math.random() * this.screen_range_x - (this.screen_range_x / 2);
        pY = Math.random() * this.screen_range_y - (this.screen_range_y / 2);
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
      this.camera_x_min = this.controller.camera_x_min(this.screen_range_x);
      this.camera_x_max = this.controller.camera_x_max(this.screen_range_x);
      this.camera_y_min = this.controller.camera_y_min(this.screen_range_y);
      this.camera_y_max = this.controller.camera_y_max(this.screen_range_y);
      _ref = this.particles.vertices;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        particle = _ref[_i];
        if (particle.position.x < this.camera_x_min) {
          while (particle.position.x < this.camera_x_min) {
            particle.position.x += this.screen_range_x;
          }
        } else if (particle.position.x > this.camera_x_max) {
          while (particle.position.x > this.camera_x_max) {
            particle.position.x -= this.screen_range_x;
          }
        }
        if (particle.position.y < this.camera_y_min) {
          _results.push((function() {
            var _results2;
            _results2 = [];
            while (particle.position.y < this.camera_y_min) {
              _results2.push(particle.position.y += this.screen_range_y);
            }
            return _results2;
          }).call(this));
        } else if (particle.position.y > this.camera_y_max) {
          _results.push((function() {
            var _results2;
            _results2 = [];
            while (particle.position.y > this.camera_y_max) {
              _results2.push(particle.position.y -= this.screen_range_y);
            }
            return _results2;
          }).call(this));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Starfield;

  })();

  if (typeof THREE !== "undefined") {
    THREE.Mesh.prototype.rotateAboutObjectAxis = function(axis, radians) {
      var rotationMatrix;
      rotationMatrix = new THREE.Matrix4();
      rotationMatrix.setRotationAxis(axis.normalize(), radians);
      this.matrix.multiplySelf(rotationMatrix);
      return this.rotation.getRotationFromMatrix(this.matrix);
    };
    THREE.Mesh.prototype.rotateAboutWorldAxis = function(axis, radians) {
      var rotationMatrix;
      rotationMatrix = new THREE.Matrix4();
      rotationMatrix.setRotationAxis(axis.normalize(), radians);
      rotationMatrix.multiplySelf(this.matrix);
      this.matrix = rotationMatrix;
      return this.rotation.getRotationFromMatrix(this.matrix);
    };
    THREE.AxisX = new THREE.Vector3(1, 0, 0);
    THREE.AxisY = new THREE.Vector3(0, 1, 0);
    THREE.AxisZ = new THREE.Vector3(0, 0, 1);
  }

  TrailsStorage = (function() {

    function TrailsStorage(options) {
      this.universe = options.universe;
      this.controller = options.controller;
      this.shipTrailPool = [];
      this.turretBulletTrailPool = [];
    }

    TrailsStorage.prototype.addToShipTrailPool = function(trail) {
      return this.shipTrailPool.push(trail);
    };

    TrailsStorage.prototype.addToTurretBulletTrailPool = function(trail) {
      return this.turretBulletTrailPool.push(trail);
    };

    TrailsStorage.prototype.newShipTrail = function(parent) {
      var i, trail, _results;
      _results = [];
      for (i = 1; i <= 2; i++) {
        trail = this.shipTrailPool.pop();
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

    TrailsStorage.prototype.newTurretBulletTrail = function(parent) {
      var trail;
      trail = this.turretBulletTrailPool.pop();
      if (!trail) {
        trail = new TurretBulletTrail({
          controller: this.controller,
          universe: this.universe
        });
      }
      return trail.setup(parent.position);
    };

    return TrailsStorage;

  })();

  Trail = (function(_super) {
    var HIDDEN_Z;

    __extends(Trail, _super);

    HIDDEN_Z = 2000;

    Trail.prototype.solid = false;

    Trail.prototype.collidable = false;

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

  ShipTrail = (function(_super) {

    __extends(ShipTrail, _super);

    function ShipTrail() {
      ShipTrail.__super__.constructor.apply(this, arguments);
    }

    ShipTrail.prototype.type = 'ShipTrail';

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

  TurretBulletTrail = (function(_super) {

    __extends(TurretBulletTrail, _super);

    function TurretBulletTrail() {
      TurretBulletTrail.__super__.constructor.apply(this, arguments);
    }

    TurretBulletTrail.prototype.type = 'TurretBulletTrail';

    TurretBulletTrail.prototype.max_lifetime = 5;

    TurretBulletTrail.prototype.max_opacity = 0.5;

    TurretBulletTrail.prototype.min_opacity = 0;

    TurretBulletTrail.prototype.buildMesh = function() {
      var geometry, material;
      geometry = new THREE.SphereGeometry(1);
      material = new THREE.MeshBasicMaterial;
      return new THREE.Mesh(geometry, material);
    };

    TurretBulletTrail.prototype.setup = function(position) {
      TurretBulletTrail.__super__.setup.apply(this, arguments);
      this.velocity.set((Math.random() - 0.5) / 2, (Math.random() - 0.5) / 2, 0);
      return this.mesh.material.color.setRGB(100, 100, 100);
    };

    TurretBulletTrail.prototype.remove = function() {
      TurretBulletTrail.__super__.remove.apply(this, arguments);
      return this.universe.trails.addToTurretBulletTrailPool(this);
    };

    return TurretBulletTrail;

  })(Trail);

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
      return this.controller.meshFactory.turretBase();
    };

    return TurretBase;

  })();

  Turret = (function(_super) {
    var AI_STEP_INTERVAL, FIRE_ANGLE_DIFF_MAX, FIRE_MAX_DISTANCE, ROTATE_ANGLE_DIFF_MAX, TARGETTING_MAX_DISTANCE;

    __extends(Turret, _super);

    AI_STEP_INTERVAL = 30;

    ROTATE_ANGLE_DIFF_MAX = Math.PI / 32;

    FIRE_ANGLE_DIFF_MAX = Math.PI / 8;

    FIRE_MAX_DISTANCE = 1000;

    TARGETTING_MAX_DISTANCE = 3000;

    Turret.prototype.type = 'turret';

    Turret.prototype.radius = 20;

    Turret.prototype.healthRadius = 8;

    Turret.prototype.mass = 50;

    Turret.prototype.maxHealth = 1000;

    function Turret(options) {
      this.base = new TurretBase(options);
      Turret.__super__.constructor.call(this, options);
      this.parent = options.parent;
      this.aiStepCounter = 0;
      this.bulletDelay = 0;
    }

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
      if (this.shouldFire) this.fire();
      return this.base.position.set(this.position.x, this.position.y, this.position.z);
    };

    Turret.prototype.fire = function() {
      if (this.bulletDelay <= 0) {
        this.universe.bullets.newTurretBullet(this);
        return this.bulletDelay = 150;
      }
    };

    Turret.prototype.aiStep = function() {
      var vector;
      if (!this.target) this.chooseTarget();
      if (this.target) {
        vector = this.target.position.clone().subSelf(this.position);
        this.angle = Math.atan2(vector.y, vector.x);
        return this.shouldFire = Math.abs(this.rotation - this.angle) <= FIRE_ANGLE_DIFF_MAX && vector.length() < FIRE_MAX_DISTANCE;
      } else {
        return this.shouldFire = false;
      }
    };

    Turret.prototype.chooseTarget = function() {
      var player, vector, _i, _len, _ref, _results;
      _ref = this.universe.players;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        if (player !== this.parent && player.ship) {
          vector = player.ship.position.clone().subSelf(this.position);
          if (vector.length() < TARGETTING_MAX_DISTANCE) {
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

    return Turret;

  })(Movable);

}).call(this);
