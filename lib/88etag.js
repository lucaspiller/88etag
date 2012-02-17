(function() {
  var Controller, Player, Universe;

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
      new Universe(this);
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
      this._render();
      if (this.stats) return this.stats.update();
    };

    Controller.prototype._render = function() {
      return this.renderer.render(this.scene, this.camera);
    };

    return Controller;

  })();

  Universe = (function() {

    function Universe(controller) {
      this.controller = controller;
      this.buildPlayer();
    }

    Universe.prototype.buildPlayer = function() {
      return new Player(this.controller);
    };

    return Universe;

  })();

  Player = (function() {

    function Player(controller) {
      var geometry, material;
      this.controller = controller;
      geometry = new THREE.TorusGeometry(1, 0.42, 16, 16);
      material = new THREE.MeshLambertMaterial({
        color: 0xCC0000
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(0, 0, 90);
      this.controller.scene.add(this.mesh);
    }

    return Player;

  })();

  $(document).ready(function() {
    if (!Detector.webgl) {
      Detector.addGetWebGLMessage();
      return;
    }
    return new Controller($('#container'));
  });

}).call(this);
