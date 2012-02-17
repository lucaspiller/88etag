(function() {
  var Controller, LocalPlayer, Movable, Player, Starfield, Universe,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Controller = (function() {
    var CAMERA_Z, FAR, NEAR, VIEW_ANGLE;

    VIEW_ANGLE = 45;

    NEAR = 1;

    FAR = 100;

    CAMERA_Z = 100;

    function Controller(container) {
      this.container = container;
      this.setupRenderer();
      this.setupScene();
      this.universe = new Universe(this);
      this.render();
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
      this.light1 = new THREE.PointLight(0xffffff);
      this.scene.add(this.light1);
      this.light2 = new THREE.PointLight(0xffffff);
      this.scene.add(this.light2);
      this.light3 = new THREE.PointLight(0xffffff);
      return this.scene.add(this.light3);
    };

    Controller.prototype.width = function() {
      return window.innerWidth;
    };

    Controller.prototype.height = function() {
      return window.innerHeight;
    };

    Controller.prototype.render = function() {
      var _this = this;
      requestAnimationFrame((function() {
        return _this.render();
      }));
      this.universe.step();
      this.light1.position.set(this.camera.position.x + 100, this.camera.position.y + 100, 10);
      this.light2.position.set(this.camera.position.x - 100, this.camera.position.y - 100, 10);
      this.light3.position.set(this.camera.position.x, this.camera.position.y, CAMERA_Z * 10);
      this.renderer.render(this.scene, this.camera);
      if (this.stats) return this.stats.update();
    };

    return Controller;

  })();

  Universe = (function() {

    function Universe(controller) {
      this.controller = controller;
      this.starfield = new Starfield(this.controller);
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
        return _this.keys.push(e.which);
      });
      return $(window).keyup(function(e) {
        return _this.keys = _.without(_this.keys, e.which);
      });
    };

    Universe.prototype.step = function() {
      this.starfield.step();
      return this.player.step();
    };

    return Universe;

  })();

  Movable = (function() {

    function Movable(options) {
      this.controller = options.controller;
      this.universe = options.universe;
      this.mesh = this.buildMesh();
      this.velocity = this.mesh.velocity = new THREE.Vector3(0, 0, 0);
      this.position = this.mesh.position = new THREE.Vector3(0, 0, 90);
      this.controller.scene.add(this.mesh);
      this.rotationalVelocity = 0;
    }

    Movable.prototype.buildMesh = function() {
      var geometry, material;
      geometry = new THREE.CubeGeometry(1, 1, 1);
      material = new THREE.MeshLambertMaterial({
        color: 0xFF0000
      });
      return new THREE.Mesh(geometry, material);
    };

    Movable.prototype.step = function() {
      this.position.addSelf(this.velocity);
      if (Math.abs(this.rotationalVelocity) > 0) {
        this.rotation = (this.rotation + this.rotationalVelocity) % (Math.PI * 2);
        return this.mesh.rotation.z += this.rotationalVelocity;
      }
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

  Player = (function(_super) {

    __extends(Player, _super);

    function Player(controller) {
      Player.__super__.constructor.call(this, controller);
      this.velocity.set(Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, 0);
      this.rotationalVelocity = 0;
    }

    Player.prototype.buildMesh = function() {
      var geometry, material, mesh;
      geometry = new THREE.CubeGeometry(1, 3, 1);
      material = new THREE.MeshLambertMaterial({
        color: 0x5E574B
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.set(Math.PI / 16, Math.PI / 4, 0);
      return mesh;
    };

    Player.prototype.rotateLeft = function() {
      return this.rotationalVelocity = Math.PI / 64;
    };

    Player.prototype.rotateRight = function() {
      return this.rotationalVelocity = -Math.PI / 64;
    };

    Player.prototype.step = function() {
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
        }
      }
      LocalPlayer.__super__.step.apply(this, arguments);
      this.controller.camera.position.x = this.position.x;
      return this.controller.camera.position.y = this.position.y;
    };

    return LocalPlayer;

  })(Player);

  Starfield = (function() {
    var FAR, NEAR, PARTICLE_COUNT;

    PARTICLE_COUNT = 100;

    NEAR = 1;

    FAR = 50;

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

}).call(this);
