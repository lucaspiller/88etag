(function() {
  var Bounds, Controller, Gt, Mass, MassStorage, Ship, ShipTrail, Universe, Vector;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Gt = window.Gt = {};
  Controller = (function() {
    function Controller(canvas) {
      this.canvas = canvas;
      this.setupCanvas();
      this.setupInput();
      this.start();
    }
    Controller.prototype.setupCanvas = function() {
      var _ref;
      return _ref = [$(window).width() - 50, $(window).height() - 50], this.canvas.width = _ref[0], this.canvas.height = _ref[1], _ref;
    };
    Controller.prototype.setupInput = function() {
      return this.setupKeys();
    };
    Controller.prototype.setupKeys = function() {
      $(window).keydown(__bind(function(e) {
        var ship;
        ship = this.universe.ship;
        switch (e.which) {
          case 37:
            return ship.rotate(-1);
          case 39:
            return ship.rotate(+1);
          case 38:
            return ship.thrust();
        }
      }, this));
      return $(window).keyup(__bind(function(e) {
        switch (e.which) {
          case 37:
          case 39:
            return this.universe.ship.rotate(0);
        }
      }, this));
    };
    Controller.prototype.start = function() {
      this.universe = new Universe({
        canvas: this.canvas
      });
      return this.universe.start();
    };
    return Controller;
  })();
  Gt.Controller = Controller;
  Universe = (function() {
    function Universe(options) {
      this.canvas = options != null ? options.canvas : void 0;
      this.masses = new MassStorage;
      this.tick = 0;
      this.buildShip();
    }
    Universe.prototype.start = function() {
      this.setupCanvas();
      return this.loop();
    };
    Universe.prototype.setupCanvas = function() {
      this.bounds = new Bounds(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.ctx.fillStyle = 'rgb(255, 255, 255)';
      return this.ctx.strokeStyle = 'rgb(255, 255, 255)';
    };
    Universe.prototype.loop = function() {
      this.step();
      this.render();
      return setTimeout((__bind(function() {
        return this.loop();
      }, this)), 1000 / 24);
    };
    Universe.prototype.step = function() {
      this.tick += 1;
      return this.masses.step();
    };
    Universe.prototype.render = function() {
      var ctx;
      if (this.ship != null) {
        this.bounds.check(this.ship);
      }
      ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.save();
      this.bounds.translate(ctx);
      this.masses.render(ctx);
      return ctx.restore();
    };
    Universe.prototype.buildShip = function() {
      var h, w, x, y, _ref, _ref2, _ref3, _ref4;
      _ref3 = [(_ref = this.canvas) != null ? _ref.width : void 0, (_ref2 = this.canvas) != null ? _ref2.height : void 0], w = _ref3[0], h = _ref3[1];
      _ref4 = [Math.random() * w / 2 + w / 4, Math.random() * h / 2 + h / 4], x = _ref4[0], y = _ref4[1];
      this.ship = new Ship({
        position: new Vector(x, y),
        rotation: -Math.PI / 2
      });
      return this.add(this.ship);
    };
    Universe.prototype.add = function(mass) {
      var _ref;
      this.masses.add(mass);
      mass.universe = this;
      return (_ref = mass.tick) != null ? _ref : mass.tick = this.tick;
    };
    Universe.prototype.update = function(mass) {
      var existing;
      existing = this.masses.find(mass);
      if (!(existing != null) || existing.ntick < mass.ntick) {
        mass.universe = this;
        return this.masses.update(mass);
      }
    };
    Universe.prototype.remove = function(mass) {
      return this.masses.remove(mass);
    };
    return Universe;
  })();
  Gt.Universe = Universe;
  MassStorage = (function() {
    function MassStorage() {
      this.items = {};
      this.length = 0;
    }
    MassStorage.prototype.find = function(mass) {
      return this.items[this.key(mass)];
    };
    MassStorage.prototype.add = function(mass) {
      if (this.find(mass) != null) {
        return;
      }
      this.length++;
      return this.set(mass);
    };
    MassStorage.prototype.update = function(mass) {
      if (this.find(mass) != null) {
        return this.set(mass);
      } else {
        return this.add(mass);
      }
    };
    MassStorage.prototype.remove = function(mass) {
      if (this.find(mass) == null) {
        return;
      }
      this.length--;
      return delete this.items[this.key(mass)];
    };
    MassStorage.prototype.key = function(mass) {
      return mass.id;
    };
    MassStorage.prototype.set = function(mass) {
      return this.items[this.key(mass)] = mass;
    };
    MassStorage.prototype.render = function(ctx) {
      var id, mass, _ref, _results;
      _ref = this.items;
      _results = [];
      for (id in _ref) {
        mass = _ref[id];
        _results.push(mass.render(ctx));
      }
      return _results;
    };
    MassStorage.prototype.step = function() {
      var id, mass, _ref, _results;
      _ref = this.items;
      _results = [];
      for (id in _ref) {
        mass = _ref[id];
        _results.push(mass.step());
      }
      return _results;
    };
    return MassStorage;
  })();
  Mass = (function() {
    function Mass(options) {
      var o;
      o = options || {};
      this.id = Math.random(9999999999999);
      this.radius = o.radius || 1;
      this.position = o.position || new Vector();
      this.velocity = o.velocity || new Vector();
      this.acceleration = o.acceleration || new Vector();
      this.rotation = o.rotation || 0;
      this.rotationalVelocity = o.rotationalVelocity || 0;
      this.lifetime = o.lifetime || 24 * 60;
    }
    Mass.prototype.remove = function() {
      return this.universe.remove(this);
    };
    Mass.prototype.solid = true;
    Mass.prototype.overlaps = function(other) {
      var diff;
      if (!(this.solid && other.solid && other !== this)) {
        return false;
      }
      diff = other.position.minus(this.position).length;
      return diff < this.radius || diff < other.radius;
    };
    Mass.prototype.step = function() {
      var dt, t;
      dt = this.universe.tick - this.tick;
      if ((this.lifetime -= dt) < 0) {
        return this.remove();
      }
      for (t = 0; (0 <= dt ? t < dt : t > dt); (0 <= dt ? t += 1 : t -= 1)) {
        this.velocity = this.velocity.plus(this.acceleration);
        this.position = this.position.plus(this.velocity);
        this.acceleration = this.acceleration.times(0.8);
        this.rotation += this.rotationalVelocity;
      }
      return this.tick = this.universe.tick;
    };
    Mass.prototype.render = function(ctx) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.rotate(this.rotation);
      this._render(ctx);
      return ctx.restore();
    };
    Mass.prototype._render = function(ctx) {
      ctx.strokeStyle = 'rgb(255,0,0)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
      ctx.closePath();
      return ctx.stroke();
    };
    return Mass;
  })();
  Gt.Mass = Mass;
  ShipTrail = (function() {
    __extends(ShipTrail, Mass);
    ShipTrail.prototype.LIFETIME = 20;
    ShipTrail.prototype.type = 'ShipTrail';
    function ShipTrail(options) {
      var ship;
      ship = options.ship;
      options.radius || (options.radius = 4);
      options.position || (options.position = ship.position);
      options.lifetime = this.LIFETIME;
      ShipTrail.__super__.constructor.call(this, options);
    }
    ShipTrail.prototype._render = function(ctx) {
      var alpha;
      alpha = this.lifetime / this.LIFETIME;
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
      ctx.closePath();
      return ctx.fill();
    };
    return ShipTrail;
  })();
  Gt.ShipTrail = ShipTrail;
  Ship = (function() {
    __extends(Ship, Mass);
    Ship.prototype.type = 'Ship';
    Ship.prototype.value = 1000;
    function Ship(options) {
      options || (options = {});
      options.radius || (options.radius = 16);
      Ship.__super__.constructor.call(this, options);
    }
    Ship.prototype.step = function() {
      var dt;
      if (this === this.universe.ship) {
        dt = this.universe.tick - this.tick;
        this.lifetime += dt;
      }
      return Ship.__super__.step.call(this);
    };
    Ship.prototype._render = function(ctx) {
      ctx.beginPath();
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(this.radius / -4, this.radius / 2.5);
      ctx.moveTo(0, this.radius * 0.32);
      ctx.lineTo(0, this.radius * -0.32);
      ctx.moveTo(this.radius / -4, this.radius / -2.5);
      ctx.lineTo(this.radius, 0);
      return ctx.stroke();
    };
    Ship.prototype.thrust = function() {
      this.universe.add(new ShipTrail({
        ship: this
      }));
      this.acceleration = this.acceleration.plus(new Vector(this.rotation).times(0.15));
      return this.universe.update(this);
    };
    Ship.prototype.rotate = function(dir) {
      if (dir > 0 && this.rotationalVelocity <= 0) {
        this.rotationalVelocity += Math.PI / 16;
      } else if (dir < 0 && this.rotationalVelocity >= 0) {
        this.rotationalVelocity -= Math.PI / 16;
      } else if (dir === 0) {
        this.rotationalVelocity = 0;
      }
      return this.universe.update(this);
    };
    return Ship;
  })();
  Gt.Ship = Ship;
  Bounds = (function() {
    Bounds.prototype.BUFFER = 40;
    function Bounds(canvas) {
      var _ref, _ref2, _ref3;
      _ref = [0, 0], this.l = _ref[0], this.t = _ref[1];
      _ref3 = (_ref2 = [canvas.width, canvas.height], this.width = _ref2[0], this.height = _ref2[1], _ref2), this.r = _ref3[0], this.b = _ref3[1];
      this.dx = this.dy = 0;
    }
    Bounds.prototype.check = function(ship) {
      var dx, dy, flip, p;
      p = ship.position;
      if (p.x < this.l + this.BUFFER) {
        this.dx = -this.width * 0.75;
      } else if (p.x > this.r - this.BUFFER) {
        this.dx = +this.width * 0.75;
      }
      if (p.y < this.t + this.BUFFER) {
        this.dy = -this.height * 0.75;
        flip = true;
      } else if (p.y > this.b - this.BUFFER) {
        this.dy = +this.height * 0.75;
        flip = true;
      }
      if (this.dx !== 0) {
        dx = parseInt(this.dx / 8);
        this.l += dx;
        this.r += dx;
        this.dx -= dx;
        if (Math.abs(this.dx) < 3) {
          this.dx = 0;
        }
      }
      if (this.dy !== 0) {
        dy = parseInt(this.dy / 8);
        this.t += dy;
        this.b += dy;
        this.dy -= dy;
        if (Math.abs(this.dy) < 3) {
          return this.dy = 0;
        }
      }
    };
    Bounds.prototype.translate = function(ctx) {
      return ctx.translate(-this.l, -this.t);
    };
    return Bounds;
  })();
  Vector = (function() {
    function Vector(x, y) {
      var _ref;
      _ref = y != null ? [x, y] : [Math.cos(x), Math.sin(x)], this.x = _ref[0], this.y = _ref[1];
      this.x || (this.x = 0);
      this.y || (this.y = 0);
      this._zeroSmall();
    }
    Vector.prototype.plus = function(v) {
      return new Vector(this.x + v.x, this.y + v.y);
    };
    Vector.prototype.minus = function(v) {
      return new Vector(this.x - v.x, this.y - v.y);
    };
    Vector.prototype.times = function(s) {
      return new Vector(this.x * s, this.y * s);
    };
    Vector.prototype.length = function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vector.prototype.normalized = function() {
      return this.times(1.0 / this.length());
    };
    Vector.prototype.clone = function() {
      return new Vector(this.x, this.y);
    };
    Vector.prototype._zeroSmall = function() {
      if (Math.abs(this.x) < 0.01) {
        this.x = 0;
      }
      if (Math.abs(this.y) < 0.01) {
        return this.y = 0;
      }
    };
    return Vector;
  })();
  Gt.Vector = Vector;
  $(document).ready(function() {
    return Gt.c = new Gt.Controller($('canvas').get(0));
  });
}).call(this);
