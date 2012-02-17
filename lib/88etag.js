(function() {
  var Controller, Movable, Player, Universe,
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
      this.light = new THREE.PointLight(0xffffff);
      this.light.position.set(0, 0, CAMERA_Z * 10);
      return this.scene.add(this.light);
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
      this.renderer.render(this.scene, this.camera);
      if (this.stats) return this.stats.update();
    };

    return Controller;

  })();

  Universe = (function() {

    function Universe(controller) {
      this.controller = controller;
      this.buildPlayer();
    }

    Universe.prototype.buildPlayer = function() {
      return this.player = new Player(this.controller);
    };

    Universe.prototype.step = function() {
      return this.player.step();
    };

    return Universe;

  })();

  Movable = (function() {

    function Movable(controller) {
      this.controller = controller;
      this.mesh = this.buildMesh();
      this.velocity = this.mesh.velocity = new THREE.Vector3(0, 0, 0);
      this.position = this.mesh.position = new THREE.Vector3(0, 0, 90);
      this.controller.scene.add(this.mesh);
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
      return this.position.addSelf(this.velocity);
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
    }

    Player.prototype.buildMesh = function() {
      var geometry, material;
      geometry = new THREE.CubeGeometry(1, 3, 1);
      material = new THREE.MeshBasicMaterial({
        color: 0x5E574B
      });
      return new THREE.Mesh(geometry, material);
    };

    return Player;

  })(Movable);

}).call(this);
