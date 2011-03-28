(function() {
  var CommandCentre, Controller, Gt, Mass, MassStorage, Ship, ShipTrail, Star, Starfield, Universe, Vector, Viewpoint;
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
        return this.universe.keyDown(e.which);
      }, this));
      return $(window).keyup(__bind(function(e) {
        return this.universe.keyUp(e.which);
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
    var LOOP_TARGET;
    LOOP_TARGET = 1000 / 24;
    function Universe(options) {
      this.canvas = options != null ? options.canvas : void 0;
      this.masses = new MassStorage;
      this.starfield = new Starfield;
      this.keys = [];
      this.tick = 0;
      this.buildPlayer();
    }
    Universe.prototype.start = function() {
      this.setupCanvas();
      this.starfield.generate(this.viewpoint);
      return this.loop();
    };
    Universe.prototype.setupCanvas = function() {
      this.viewpoint = new Viewpoint(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.ctx.fillStyle = 'rgb(255, 255, 255)';
      return this.ctx.strokeStyle = 'rgb(255, 255, 255)';
    };
    Universe.prototype.loop = function() {
      var delay, start, time;
      start = new Date().getTime();
      this.checkInput();
      this.checkCollisions();
      this.step();
      this.render();
      time = new Date().getTime() - start;
      delay = this.LOOP_TARGET - time;
      if (delay < 0) {
        console.log('Frame took ' + time + 'ms');
        delay = 0;
      }
      return setTimeout((__bind(function() {
        return this.loop();
      }, this)), delay);
    };
    Universe.prototype.keyDown = function(key) {
      return this.keys.push(key);
    };
    Universe.prototype.keyUp = function(key) {
      this.keys = _.without(this.keys, key);
      switch (key) {
        case 37:
        case 39:
          return this.ship.rotate(0);
      }
    };
    Universe.prototype.checkInput = function() {
      var key, _i, _len, _ref, _results;
      _ref = this.keys;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        _results.push((function() {
          switch (key) {
            case 37:
              return this.ship.rotate(-1);
            case 39:
              return this.ship.rotate(+1);
            case 38:
              return this.ship.forward();
            case 40:
              return this.ship.backward();
          }
        }).call(this));
      }
      return _results;
    };
    Universe.prototype.step = function() {
      this.tick += 1;
      return this.masses.step();
    };
    Universe.prototype.render = function() {
      var ctx;
      if (this.ship != null) {
        this.viewpoint.update(this.ship);
      }
      ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.save();
      this.starfield.render(ctx, this.viewpoint);
      this.viewpoint.translate(ctx);
      this.masses.render(ctx);
      return ctx.restore();
    };
    Universe.prototype.buildPlayer = function() {
      var h, w, x, y, _ref, _ref2, _ref3, _ref4;
      _ref3 = [(_ref = this.canvas) != null ? _ref.width : void 0, (_ref2 = this.canvas) != null ? _ref2.height : void 0], w = _ref3[0], h = _ref3[1];
      _ref4 = [Math.random() * w / 2 + w / 4, Math.random() * h / 2 + h / 4], x = _ref4[0], y = _ref4[1];
      this.commandCentre = new CommandCentre({
        position: new Vector(x, y)
      });
      this.add(this.commandCentre);
      return this.buildShip();
    };
    Universe.prototype.buildShip = function() {
      var x, y;
      x = this.commandCentre.position.x;
      y = this.commandCentre.position.y + this.commandCentre.radius;
      this.ship = new Ship({
        position: new Vector(x, y),
        rotation: Math.PI / 2
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
    Universe.prototype.checkCollisions = function() {
      var id, m1, m2, _ref, _results;
      _ref = this.masses.items;
      _results = [];
      for (id in _ref) {
        m1 = _ref[id];
        _results.push((function() {
          var _ref, _results;
          _ref = this.masses.items;
          _results = [];
          for (id in _ref) {
            m2 = _ref[id];
            _results.push(m1.overlaps(m2) ? m1.handleCollision(m2) : void 0);
          }
          return _results;
        }).call(this));
      }
      return _results;
    };
    return Universe;
  })();
  Gt.Universe = Universe;
  Star = (function() {
    Star.prototype.STAR_RADIUS = 1.5;
    function Star(options) {
      this.position = options.position;
      this.alpha = options.alpha;
    }
    Star.prototype.render = function(ctx, viewpoint, MULT) {
      var alpha, x, y;
      ctx.save();
      x = this.position.x - (viewpoint.position.x / (this.position.z + 1));
      y = this.position.y - (viewpoint.position.y / (this.position.z + 1));
      x -= Math.floor(x / (viewpoint.width * MULT)) * (viewpoint.width * MULT);
      y -= Math.floor(y / (viewpoint.height * MULT)) * (viewpoint.height * MULT);
      if (y > viewpoint.height) {
        y = y - viewpoint.height;
      } else if (y < 0) {
        y = y + viewpoint.height;
      }
      ctx.translate(x, y);
      alpha = (1 - this.position.z) / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(0, 0, this.STAR_RADIUS, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      return ctx.restore();
    };
    return Star;
  })();
  Gt.Star = Star;
  Starfield = (function() {
    Starfield.prototype.NUM_STARS = 100;
    Starfield.prototype.MULT = 2;
    function Starfield() {
      this.stars = [];
    }
    Starfield.prototype.generate = function(viewpoint) {
      var i, _ref, _results;
      _results = [];
      for (i = 1, _ref = this.NUM_STARS; (1 <= _ref ? i <= _ref : i >= _ref); (1 <= _ref ? i += 1 : i -= 1)) {
        _results.push(this.stars.push(new Star({
          position: new Vector(Math.random() * viewpoint.width * this.MULT, Math.random() * viewpoint.height * this.MULT, Math.random())
        })));
      }
      return _results;
    };
    Starfield.prototype.render = function(ctx, viewpoint) {
      var star;
      ctx.save();
      ctx.translate(0, 0);
      for (star in this.stars) {
        this.stars[star].render(ctx, viewpoint, this.MULT);
      }
      return ctx.restore();
    };
    return Starfield;
  })();
  Gt.Starfield = Starfield;
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
      var highestLayer, i, id, mass, _ref, _results;
      highestLayer = 0;
      _ref = this.items;
      for (id in _ref) {
        mass = _ref[id];
        if (mass.layer > highestLayer) {
          highestLayer = mass.layer;
        }
      }
      _results = [];
      for (i = 0; (0 <= highestLayer ? i <= highestLayer : i >= highestLayer); (0 <= highestLayer ? i += 1 : i -= 1)) {
        _results.push((function() {
          var _ref, _results;
          _ref = this.items;
          _results = [];
          for (id in _ref) {
            mass = _ref[id];
            _results.push(mass.layer === i ? mass.render(ctx) : void 0);
          }
          return _results;
        }).call(this));
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
    Mass.prototype.type = 'Unknown';
    Mass.prototype.mass = 1;
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
      this.layer = o.layer || 0;
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
      diff = other.position.minus(this.position).length();
      return diff < (other.radius + this.radius);
    };
    Mass.prototype.handleCollision = function(other) {
      var m1, m2, v1, v1x, v1y, v2, v2x, v2y, x, x1, x2, _results;
      x = this.position.minus(other.position).normalized();
      v1 = this.velocity;
      x1 = x.dotProduct(v1);
      v1x = x.times(x1);
      v1y = v1.minus(v1x);
      m1 = this.mass;
      x = x.times(-1);
      v2 = other.velocity;
      x2 = x.dotProduct(v2);
      v2x = x.times(x2);
      v2y = v2.minus(v2x);
      m2 = other.mass;
      this.velocity = v1x.times((m1 - m2) / (m1 + m2)).plus(v2x.times((2 * m2) / (m1 + m2)).plus(v1y));
      this.velocity._zeroSmall();
      this.acceleration = new Vector(0, 0);
      other.velocity = v1x.times((2 * m1) / (m1 + m2)).plus(v2x.times((m2 - m1) / (m1 + m2)).plus(v2y));
      other.velocity._zeroSmall();
      other.acceleration = new Vector(0, 0);
      if (this.velocity.length() === 0 && other.velocity.length() === 0) {
        if (m1 < m2) {
          this.velocity = x.times(-1);
        } else {
          other.velocity = x.times(1);
        }
      }
      _results = [];
      while (this.overlaps(other)) {
        this.position = this.position.plus(this.velocity);
        _results.push(other.position = other.position.plus(other.velocity));
      }
      return _results;
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
    ShipTrail.prototype.LIFETIME = 40;
    ShipTrail.prototype.type = 'ShipTrail';
    ShipTrail.prototype.solid = false;
    function ShipTrail(options) {
      var ship;
      ship = options.ship;
      options.radius || (options.radius = 2);
      options.position || (options.position = ship.position);
      options.velocity || (options.velocity = new Vector((Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4));
      options.lifetime = this.LIFETIME;
      ShipTrail.__super__.constructor.call(this, options);
    }
    ShipTrail.prototype._render = function(ctx) {
      var alpha;
      alpha = this.lifetime / this.LIFETIME;
      ctx.fillStyle = 'rgba(89,163,89,' + alpha + ')';
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
    Ship.prototype.mass = 10;
    function Ship(options) {
      options || (options = {});
      options.radius || (options.radius = 10);
      options.layer = 2;
      this.max_speed = 3;
      this.max_accel = 0.03;
      this.trailDelay = 0;
      Ship.__super__.constructor.call(this, options);
    }
    Ship.prototype._render = function(ctx) {
      ctx.fillStyle = 'rgb(0,68,0)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgb(94,87,75)';
      ctx.beginPath();
      ctx.moveTo(-1.5 * this.radius, -1.2 * this.radius);
      ctx.lineTo(this.radius * 1.4, -0.8 * this.radius);
      ctx.moveTo(-1.5 * this.radius, this.radius * -0.4);
      ctx.lineTo(this.radius * 1.5, this.radius * -0.4);
      ctx.moveTo(-1.5 * this.radius, this.radius * 0.4);
      ctx.lineTo(this.radius * 1.5, this.radius * 0.4);
      ctx.moveTo(-1.5 * this.radius, 1.2 * this.radius);
      ctx.lineTo(this.radius * 1.4, 0.8 * this.radius);
      ctx.closePath();
      return ctx.stroke();
    };
    Ship.prototype.forward = function() {
      return this.thrust(this.acceleration.plus(new Vector(this.rotation).times(this.max_accel)));
    };
    Ship.prototype.backward = function() {
      return this.thrust(this.acceleration.minus(new Vector(this.rotation).times(this.max_accel)));
    };
    Ship.prototype.thrust = function(accel) {
      if (this.trailDelay <= 0) {
        this.universe.add(new ShipTrail({
          ship: this
        }));
        this.trailDelay = 1;
      }
      this.acceleration = accel;
      return this.universe.update(this);
    };
    Ship.prototype.step = function() {
      var dt, newVelocity, t;
      dt = this.universe.tick - this.tick;
      if (this === this.universe.ship) {
        this.lifetime += dt;
      }
      if ((this.lifetime -= dt) < 0) {
        return this.remove();
      }
      for (t = 0; (0 <= dt ? t < dt : t > dt); (0 <= dt ? t += 1 : t -= 1)) {
        newVelocity = this.velocity.plus(this.acceleration);
        if (newVelocity.length() < this.max_speed) {
          this.velocity = newVelocity;
        } else {
          this.velocity = newVelocity.times(this.max_speed / newVelocity.length());
        }
        this.position = this.position.plus(this.velocity);
        this.acceleration = this.acceleration.times(0.8);
        this.rotation += this.rotationalVelocity;
      }
      this.trailDelay -= dt;
      return this.tick = this.universe.tick;
    };
    Ship.prototype.rotate = function(dir) {
      if (dir > 0 && this.rotationalVelocity <= 0) {
        this.rotationalVelocity += Math.PI / 64;
      } else if (dir < 0 && this.rotationalVelocity >= 0) {
        this.rotationalVelocity -= Math.PI / 64;
      } else if (dir === 0) {
        this.rotationalVelocity = 0;
      }
      return this.universe.update(this);
    };
    return Ship;
  })();
  Gt.Ship = Ship;
  CommandCentre = (function() {
    __extends(CommandCentre, Mass);
    CommandCentre.prototype.type = 'CommandCentre';
    CommandCentre.prototype.mass = Infinity;
    function CommandCentre(options) {
      options || (options = {});
      options.radius || (options.radius = 80);
      options.rotationalVelocity || (options.rotationalVelocity = Math.PI / 512);
      options.layer = 1;
      CommandCentre.__super__.constructor.call(this, options);
    }
    CommandCentre.prototype.step = function() {
      var dt;
      dt = this.universe.tick - this.tick;
      this.lifetime += dt;
      return CommandCentre.__super__.step.apply(this, arguments);
    };
    CommandCentre.prototype._render = function(ctx) {
      var i;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgb(96, 97, 90)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = 'rgb(254, 235, 202)';
      for (i = 1; i <= 4; i++) {
        ctx.strokeRect(this.radius / 2, -5, this.radius / 2, 10);
        ctx.strokeRect(this.radius, -20, 2, 40);
        ctx.rotate(Math.PI / 2);
      }
      ctx.rotate(-2 * this.rotation);
      ctx.rotate(Math.PI / 8);
      for (i = 1; i <= 8; i++) {
        ctx.strokeRect((this.radius / 2) * 1.5, -15, 2, 30);
        ctx.rotate(Math.PI / 4);
      }
      ctx.fillStyle = 'rgb(0, 25, 0)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgb(0,68,0)';
      ctx.beginPath();
      ctx.arc(0, 0, (this.radius / 2) * 0.9, 0, Math.PI * 2, true);
      ctx.closePath();
      return ctx.fill();
    };
    return CommandCentre;
  })();
  Viewpoint = (function() {
    Viewpoint.prototype.BUFFER = 40;
    function Viewpoint(canvas) {
      var _ref;
      this.position = new Vector(0, 0);
      _ref = [canvas.width, canvas.height], this.width = _ref[0], this.height = _ref[1];
    }
    Viewpoint.prototype.update = function(ship) {
      this.position.x = ship.position.x - (this.width / 2);
      return this.position.y = ship.position.y - (this.height / 2);
    };
    Viewpoint.prototype.translate = function(ctx) {
      return ctx.translate(-this.position.x, -this.position.y);
    };
    return Viewpoint;
  })();
  Vector = (function() {
    function Vector(x, y, z) {
      var _ref;
      _ref = y != null ? [x, y] : [Math.cos(x), Math.sin(x)], this.x = _ref[0], this.y = _ref[1];
      this.z = z != null ? z : 0;
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
    Vector.prototype.dotProduct = function(other) {
      return (this.x * other.x) + (this.y * other.y);
    };
    Vector.prototype.clone = function() {
      return new Vector(this.x, this.y, this.z);
    };
    Vector.prototype._zeroSmall = function() {
      if (Math.abs(this.x) < 0.01) {
        this.x = 0;
      }
      if (Math.abs(this.y) < 0.01) {
        this.y = 0;
      }
      if (Math.abs(this.z) < 0.01) {
        return this.z = 0;
      }
    };
    return Vector;
  })();
  Gt.Vector = Vector;
  $(document).ready(function() {
    return Gt.c = new Gt.Controller($('canvas').get(0));
  });
}).call(this);
