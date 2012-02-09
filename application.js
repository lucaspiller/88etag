var AiPlayer, Bullet, BulletTrail, CommandCentre, Controller, Gt, LocalPlayer, Mass, MassDriver, MassStorage, Player, PlayerStorage, Ship, ShipTrail, Star, Starfield, Turret, TurretBullet, Universe, Vector, Viewpoint, WeaponsFire,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Gt = window.Gt = {};

Controller = (function() {

  function Controller(canvas) {
    this.canvas = canvas;
    this.setupCanvas();
    this.setupInput();
    this.start();
  }

  Controller.prototype.setupCanvas = function() {
    var _ref,
      _this = this;
    _ref = [$(window).width() - 5, $(window).height() - 5], this.canvas.width = _ref[0], this.canvas.height = _ref[1];
    return $(document).resize(function() {
      var _ref2;
      return _ref2 = [$(window).width() - 5, $(window).height() - 5], _this.canvas.width = _ref2[0], _this.canvas.height = _ref2[1], _ref2;
    });
  };

  Controller.prototype.setupInput = function() {
    return this.setupKeys();
  };

  Controller.prototype.setupKeys = function() {
    var _this = this;
    $(window).keydown(function(e) {
      return _this.universe.keyDown(e.which);
    });
    return $(window).keyup(function(e) {
      return _this.universe.keyUp(e.which);
    });
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

  LOOP_TARGET = 1000 / 60;

  function Universe(options) {
    this.canvas = options != null ? options.canvas : void 0;
    this.masses = new MassStorage;
    this.players = new PlayerStorage;
    this.starfield = new Starfield;
    this.keys = [];
    this.tick = 0;
  }

  Universe.prototype.start = function() {
    var _this = this;
    this.setupCanvas();
    this.starfield.generate(this.viewpoint);
    this.buildPlayer();
    setInterval((function() {
      return _this.loop();
    }), LOOP_TARGET);
    return this.loop();
  };

  Universe.prototype.setupCanvas = function() {
    this.viewpoint = new Viewpoint(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = 'rgb(255, 255, 255)';
    return this.ctx.strokeStyle = 'rgb(255, 255, 255)';
  };

  Universe.prototype.loop = function() {
    var renderTime, start;
    start = Date.now();
    this.checkCollisions();
    this.step();
    this.render();
    renderTime = Date.now() - start;
    if (renderTime > LOOP_TARGET) {
      return console.log('Frame took ' + renderTime + 'ms');
    }
  };

  Universe.prototype.keyDown = function(key) {
    return this.keys.push(key);
  };

  Universe.prototype.keyUp = function(key) {
    return this.keys = _.without(this.keys, key);
  };

  Universe.prototype.step = function() {
    this.tick += 1;
    this.players.step();
    return this.masses.step();
  };

  Universe.prototype.render = function() {
    var ctx;
    if (this.player.ship != null) this.viewpoint.update(this.player.ship);
    ctx = this.ctx;
    if (this.respawnGraphics) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    ctx.save();
    this.starfield.render(ctx, this.viewpoint);
    this.viewpoint.translate(ctx);
    this.masses.render(ctx);
    ctx.restore();
    return this.renderGUI(ctx);
  };

  Universe.prototype.renderGUI = function(ctx) {
    var powerWidth;
    if (this.player.ship != null) {
      powerWidth = (this.player.ship.energy / this.player.ship.maxEnergy) * 200;
      ctx.save();
      ctx.fillStyle = 'rgb(255, 0, 0)';
      ctx.fillRect(30, this.canvas.height - 40, powerWidth, 5);
      ctx.restore();
    }
    return this.renderCcHelpers(ctx);
  };

  Universe.prototype.renderCcHelpers = function(ctx) {
    var id, player, vector, _ref, _results;
    _ref = this.players.items;
    _results = [];
    for (id in _ref) {
      player = _ref[id];
      if (player.commandCentre != null) {
        if (this.viewpoint.offscreen(player.commandCentre.position)) {
          vector = Vector.minus(player.commandCentre.position, this.viewpoint.position);
          if (vector.x < 0) {
            vector.x = 0;
          } else if (vector.x > this.viewpoint.width) {
            vector.x = this.viewpoint.width;
          }
          if (vector.y < 0) {
            vector.y = 0;
          } else if (vector.y > this.viewpoint.height) {
            vector.y = this.viewpoint.height;
          }
          ctx.save();
          ctx.lineWidth = 3;
          if (player === this.player) {
            ctx.strokeStyle = 'rgb(0, 255, 0)';
          } else {
            ctx.strokeStyle = 'rgb(255, 0, 0)';
          }
          ctx.translate(vector.x, vector.y);
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.stroke();
          _results.push(ctx.restore());
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Universe.prototype.buildPlayer = function() {
    var ai;
    this.player = new LocalPlayer({
      universe: this
    });
    this.player.build();
    this.players.add(this.player);
    ai = new AiPlayer({
      universe: this
    });
    ai.build();
    return this.players.add(ai);
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
        var _ref2, _results2;
        _ref2 = this.masses.items;
        _results2 = [];
        for (id in _ref2) {
          m2 = _ref2[id];
          if (m1.overlaps(m2)) {
            _results2.push(m1.handleCollision(m2));
          } else {
            _results2.push(void 0);
          }
        }
        return _results2;
      }).call(this));
    }
    return _results;
  };

  return Universe;

})();

Gt.Universe = Universe;

PlayerStorage = (function() {

  function PlayerStorage() {
    this.items = {};
    this.length = 0;
  }

  PlayerStorage.prototype.find = function(player) {
    return this.items[this.key(player)];
  };

  PlayerStorage.prototype.add = function(player) {
    if (this.find(player) != null) return;
    this.length++;
    return this.set(player);
  };

  PlayerStorage.prototype.update = function(player) {
    if (this.find(player) != null) {
      return this.set(player);
    } else {
      return this.add(player);
    }
  };

  PlayerStorage.prototype.remove = function(player) {
    if (this.find(player) == null) return;
    this.length--;
    return delete this.items[this.key(player)];
  };

  PlayerStorage.prototype.key = function(player) {
    return player.id;
  };

  PlayerStorage.prototype.set = function(player) {
    return this.items[this.key(player)] = player;
  };

  PlayerStorage.prototype.step = function() {
    var id, player, _ref, _results;
    _ref = this.items;
    _results = [];
    for (id in _ref) {
      player = _ref[id];
      _results.push(player.step());
    }
    return _results;
  };

  return PlayerStorage;

})();

Player = (function() {
  var RESPAWN_DELAY;

  RESPAWN_DELAY = 5000;

  Player.prototype.local = false;

  function Player(options) {
    this.id = Math.random(9999999999999);
    this.universe = options.universe;
    this.score = 0;
  }

  Player.prototype.build = function() {
    var h, w, x, y, _ref, _ref2, _ref3, _ref4;
    _ref3 = [(_ref = this.universe.canvas) != null ? _ref.width : void 0, (_ref2 = this.universe.canvas) != null ? _ref2.height : void 0], w = _ref3[0], h = _ref3[1];
    _ref4 = [Math.random() * w * 8, Math.random() * h * 8], x = _ref4[0], y = _ref4[1];
    this.commandCentre = new CommandCentre({
      position: Vector._new(x, y),
      player: this
    });
    this.universe.add(this.commandCentre);
    return this.buildShip();
  };

  Player.prototype.buildShip = function() {
    var x, y;
    x = this.commandCentre.position.x;
    y = this.commandCentre.position.y + this.commandCentre.radius;
    this.ship = new Ship({
      position: Vector._new(x, y),
      rotation: Math.PI / 2,
      player: this
    });
    return this.universe.add(this.ship);
  };

  Player.prototype.respawn = function() {
    var _this = this;
    return setTimeout(function() {
      _this.buildShip();
      if (_this.universe.player === _this) {
        _this.universe.respawnGraphics = true;
        return setTimeout(function() {
          return _this.universe.respawnGraphics = false;
        }, RESPAWN_DELAY / 2);
      }
    }, RESPAWN_DELAY);
  };

  Player.prototype.step = function() {
    return true;
  };

  return Player;

})();

LocalPlayer = (function(_super) {

  __extends(LocalPlayer, _super);

  LocalPlayer.prototype.local = true;

  function LocalPlayer(options) {
    LocalPlayer.__super__.constructor.call(this, options);
  }

  LocalPlayer.prototype.step = function() {
    var key, _i, _len, _ref;
    if (this.ship != null) {
      _ref = this.universe.keys;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        switch (key) {
          case 37:
            this.ship.rotate(-1);
            break;
          case 39:
            this.ship.rotate(+1);
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
      if (!_.include(this.universe.keys, 37) && !_.include(this.universe.keys, 39)) {
        return this.ship.rotate(0);
      }
    }
  };

  LocalPlayer.prototype.buildTurret = function() {
    var turret;
    turret = new Turret({
      position: this.ship.position,
      player: this
    });
    return this.universe.add(turret);
  };

  LocalPlayer.prototype.buildMassDriver = function() {
    var massDriver;
    massDriver = new MassDriver({
      position: this.ship.position,
      player: this
    });
    return this.universe.add(massDriver);
  };

  return LocalPlayer;

})(Player);

AiPlayer = (function(_super) {
  var FIRE_ANGLE_DIFF_MAX, FIRE_MAX_DISTANCE, ROTATE_ANGLE_DIFF_MAX;

  __extends(AiPlayer, _super);

  ROTATE_ANGLE_DIFF_MAX = Math.PI / 32;

  FIRE_ANGLE_DIFF_MAX = Math.PI / 8;

  FIRE_MAX_DISTANCE = 1000;

  AiPlayer.prototype.local = true;

  function AiPlayer(options) {
    var _this = this;
    this.players = options.universe.players;
    this.angle = 0;
    setInterval(function() {
      return _this.aiStep();
    }, 100);
    AiPlayer.__super__.constructor.call(this, options);
  }

  AiPlayer.prototype._chooseTarget = function() {
    var id, player, _ref, _results;
    _ref = this.players.items;
    _results = [];
    for (id in _ref) {
      player = _ref[id];
      if (player !== this) {
        this.target = player.ship;
        break;
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  AiPlayer.prototype.step = function() {
    if (Math.abs(this.ship.rotation - this.angle) > ROTATE_ANGLE_DIFF_MAX) {
      if (this.ship.rotation > this.angle) {
        this.ship.rotate(-1);
      } else if (this.ship.rotation < this.angle) {
        this.ship.rotate(1);
      }
    } else {
      this.ship.rotate(0);
    }
    this.ship.forward();
    if (this.fire) return this.ship.fire();
  };

  AiPlayer.prototype.aiStep = function() {
    var vector;
    if (this.target && this.target.alive()) {
      vector = Vector.minus(this.target.position, this.ship.position);
      this.angle = Math.atan2(vector.y, vector.x);
      return this.fire = Math.abs(this.ship.rotation - this.angle) <= FIRE_ANGLE_DIFF_MAX && Vector._length(vector) < FIRE_MAX_DISTANCE;
    } else {
      this.fire = false;
      return this._chooseTarget();
    }
  };

  return AiPlayer;

})(Player);

Star = (function() {

  Star.prototype.STAR_RADIUS = 1.5;

  function Star(options) {
    this.position = options.position;
    this.alpha = options.alpha;
    this.z = Math.random();
  }

  Star.prototype.render = function(ctx, viewpoint, MULT) {
    var alpha, x, y;
    ctx.save();
    x = this.position.x - (viewpoint.position.x / (this.z + 1));
    y = this.position.y - (viewpoint.position.y / (this.z + 1));
    x -= Math.floor(x / (viewpoint.width * MULT)) * (viewpoint.width * MULT);
    y -= Math.floor(y / (viewpoint.height * MULT)) * (viewpoint.height * MULT);
    if (y > viewpoint.height) {
      y = y - viewpoint.height;
    } else if (y < 0) {
      y = y + viewpoint.height;
    }
    ctx.translate(x, y);
    alpha = (1 - this.z) / 2;
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
    for (i = 1, _ref = this.NUM_STARS; 1 <= _ref ? i <= _ref : i >= _ref; 1 <= _ref ? i++ : i--) {
      _results.push(this.stars.push(new Star({
        position: Vector._new(Math.random() * viewpoint.width * this.MULT, Math.random() * viewpoint.height * this.MULT)
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
    if (this.find(mass) != null) return;
    this.length++;
    return this.set(mass);
  };

  MassStorage.prototype.update = function(mass) {
    if (this.find(mass) != null) return this.set(mass);
  };

  MassStorage.prototype.remove = function(mass) {
    if (this.find(mass) == null) return;
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
      if (mass.layer > highestLayer) highestLayer = mass.layer;
    }
    _results = [];
    for (i = 0; 0 <= highestLayer ? i <= highestLayer : i >= highestLayer; 0 <= highestLayer ? i++ : i--) {
      _results.push((function() {
        var _ref2, _results2;
        _ref2 = this.items;
        _results2 = [];
        for (id in _ref2) {
          mass = _ref2[id];
          if (mass.layer === i) {
            _results2.push(mass.render(ctx));
          } else {
            _results2.push(void 0);
          }
        }
        return _results2;
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

  Mass.prototype.maxHealth = 1;

  Mass.prototype.solid = true;

  function Mass(options) {
    var o;
    o = options || {};
    this.id = Math.random(9999999999999);
    this.radius = o.radius || 1;
    this.position = o.position || Vector._new(0, 0);
    this.velocity = o.velocity || Vector._new(0, 0);
    this.acceleration = o.acceleration || Vector._new(0, 0);
    this.rotation = o.rotation || 0;
    this.rotationalVelocity = o.rotationalVelocity || 0;
    this.player = o.player;
    this.lifetime = o.lifetime || 24 * 60;
    this.layer = o.layer || 0;
    this.health = o.health || this.maxHealth;
  }

  Mass.prototype.explode = function() {
    return this.remove();
  };

  Mass.prototype.remove = function() {
    return this.universe.remove(this);
  };

  Mass.prototype.alive = function() {
    return this.health > 0;
  };

  Mass.prototype.overlaps = function(other) {
    var diff;
    if (other === this) return false;
    diff = Vector._length(Vector.minus(other.position, this.position));
    return diff < (other.radius + this.radius);
  };

  Mass.prototype.handleCollision = function(other) {
    var m1, m2, v1, v1x, v1y, v2, v2x, v2y, x, x1, x2, _results;
    if (!(this.solid && other.solid)) return;
    x = Vector.normalized(Vector.minus(this.position, other.position));
    v1 = this.velocity;
    x1 = Vector.dotProduct(x, v1);
    v1x = Vector.times(x, x1);
    v1y = Vector.minus(v1, v1x);
    m1 = this.mass;
    x = Vector.times(x, -1);
    v2 = other.velocity;
    x2 = Vector.dotProduct(x, v2);
    v2x = Vector.times(x, x2);
    v2y = Vector.minus(v2, v2x);
    m2 = other.mass;
    this.velocity = Vector._zeroSmall(Vector.times(Vector.plus(Vector.times(v1x, (m1 - m2) / (m1 + m2)), Vector.plus(Vector.times(v2x, (2 * m2) / (m1 + m2)), v1y)), 0.75));
    this.acceleration = Vector._new(0, 0);
    other.velocity = Vector._zeroSmall(Vector.times(Vector.plus(Vector.times(v1x, (2 * m1) / (m1 + m2)), Vector.plus(Vector.times(v2x, (m2 - m1) / (m1 + m2)), v2y)), 0.75));
    other.acceleration = Vector._new(0, 0);
    if (Vector._length(this.velocity) === 0 && Vector._length(other.velocity) === 0) {
      if (m1 < m2) {
        this.velocity = Vector.times(x, -1);
      } else {
        other.velocity = Vector.times(x, 1);
      }
    }
    _results = [];
    while (this.overlaps(other)) {
      this.position = Vector.plus(this.position, this.velocity);
      _results.push(other.position = Vector.plus(other.position, other.velocity));
    }
    return _results;
  };

  Mass.prototype.step = function() {
    var dt, t;
    dt = this.universe.tick - this.tick;
    if ((this.lifetime -= dt) < 0) return this.remove();
    for (t = 0; 0 <= dt ? t < dt : t > dt; 0 <= dt ? t++ : t--) {
      this.velocity = Vector.plus(this.velocity, this.acceleration);
      if (Vector._length(this.acceleration) === 0 && this.mass >= 1000) {
        this.velocity = Vector.times(this.velocity, 0.99);
      }
      this.position = Vector.plus(this.position, this.velocity);
      this.acceleration = Vector.times(this.acceleration, 0.8);
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

ShipTrail = (function(_super) {

  __extends(ShipTrail, _super);

  ShipTrail.prototype.type = 'ShipTrail';

  ShipTrail.prototype.solid = false;

  function ShipTrail(options) {
    this.ship = options.ship;
    options.radius || (options.radius = 2);
    options.position || (options.position = Vector.clone(this.ship.position));
    options.velocity || (options.velocity = Vector._new((Math.random() - 0.5) / 4, (Math.random() - 0.5) / 4));
    options.lifetime = 40;
    ShipTrail.__super__.constructor.call(this, options);
  }

  ShipTrail.prototype._render = function(ctx) {
    var alpha;
    alpha = this.lifetime / 40;
    ctx.fillStyle = 'rgba(89,163,89,' + alpha + ')';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    return ctx.fill();
  };

  return ShipTrail;

})(Mass);

Gt.ShipTrail = ShipTrail;

WeaponsFire = (function(_super) {

  __extends(WeaponsFire, _super);

  WeaponsFire.prototype.type = 'WeaponsFire';

  WeaponsFire.prototype.solid = false;

  WeaponsFire.prototype.damage = 1;

  function WeaponsFire(options) {
    this.parent = options.parent;
    options || (options = {});
    options.radius || (options.radius = 1);
    options.position || (options.position = Vector.clone(this.parent.position));
    options.velocity || (options.velocity = Vector.times(Vector._new(this.parent.rotation), 2));
    WeaponsFire.__super__.constructor.call(this, options);
  }

  WeaponsFire.prototype.handleCollision = function(other) {
    if (!other.solid) return;
    if (other === this.parent) return;
    other.health -= this.damage;
    if (other.health <= 0) other.explode();
    return this.remove();
  };

  return WeaponsFire;

})(Mass);

Bullet = (function(_super) {

  __extends(Bullet, _super);

  Bullet.prototype.type = 'Bullet';

  Bullet.prototype.damage = 100;

  function Bullet(options) {
    options.radius || (options.radius = 5);
    options.lifetime = 100;
    Bullet.__super__.constructor.call(this, options);
    this.velocity = Vector.times(Vector._new(this.parent.rotation), 6);
    this.rotation = this.parent.rotation;
  }

  Bullet.prototype._render = function(ctx) {
    ctx.fillStyle = 'rgb(89,163,89)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    return ctx.fill();
  };

  return Bullet;

})(WeaponsFire);

Gt.Bullet = Bullet;

Ship = (function(_super) {

  __extends(Ship, _super);

  Ship.prototype.type = 'Ship';

  Ship.prototype.value = 1000;

  Ship.prototype.mass = 10;

  Ship.prototype.maxEnergy = 200;

  function Ship(options) {
    options || (options = {});
    options.radius || (options.radius = 10);
    options.layer = 2;
    options.velocity = Vector._new(0, 0);
    this.energy = options.energy || this.maxEnergy;
    this.max_speed = 3;
    this.max_accel = 0.03;
    this.trailDelay = 0;
    this.bulletDelay = 0;
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
    return this.thrust(Vector.plus(this.acceleration, Vector.times(Vector._new(this.rotation), this.max_accel)));
  };

  Ship.prototype.backward = function() {
    return this.thrust(Vector.minus(this.acceleration, Vector.times(Vector._new(this.rotation), this.max_accel)));
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

  Ship.prototype.fire = function() {
    if (this.bulletDelay <= 0) {
      if (!this.power(-50)) return;
      this.universe.add(new Bullet({
        parent: this
      }));
      return this.bulletDelay = 10;
    }
  };

  Ship.prototype.power = function(delta) {
    if (this.energy + delta < 0) return false;
    this.energy += delta;
    if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
    return true;
  };

  Ship.prototype.step = function() {
    var dt, newVelocity, t;
    dt = this.universe.tick - this.tick;
    if (this.player.local) {
      this.lifetime += dt;
      this.power(dt);
      this.trailDelay -= dt;
      this.bulletDelay -= dt;
    }
    if ((this.lifetime -= dt) < 0) return this.remove();
    for (t = 0; 0 <= dt ? t < dt : t > dt; 0 <= dt ? t++ : t--) {
      newVelocity = Vector.plus(this.velocity, this.acceleration);
      if (Vector._length(newVelocity) < this.max_speed) {
        this.velocity = newVelocity;
      } else {
        this.velocity = Vector.times(newVelocity, this.max_speed / Vector._length(newVelocity));
      }
      this.position = Vector.plus(this.position, this.velocity);
      this.acceleration = Vector.times(this.acceleration, 0.8);
      this.rotation += this.rotationalVelocity;
      this.rotation = this.rotation % (Math.PI * 2);
    }
    return this.tick = this.universe.tick;
  };

  Ship.prototype.rotate = function(dir) {
    if (dir > 0 && this.rotationalVelocity <= 0) {
      this.rotationalVelocity += (Math.PI / 64) * Math.abs(dir);
    } else if (dir < 0 && this.rotationalVelocity >= 0) {
      this.rotationalVelocity -= (Math.PI / 64) * Math.abs(dir);
    } else if (dir === 0) {
      this.rotationalVelocity = 0;
    }
    return this.universe.update(this);
  };

  Ship.prototype.explode = function() {
    Ship.__super__.explode.apply(this, arguments);
    if (this.player.local) return this.player.respawn();
  };

  return Ship;

})(Mass);

Gt.Ship = Ship;

CommandCentre = (function(_super) {

  __extends(CommandCentre, _super);

  CommandCentre.prototype.type = 'CommandCentre';

  CommandCentre.prototype.mass = 999999999999999999;

  CommandCentre.prototype.maxHealth = 10000;

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
    ctx.arc(0, 0, 0.9 * (this.radius / 2) * (this.health / this.maxHealth), 0, Math.PI * 2, true);
    ctx.closePath();
    return ctx.fill();
  };

  return CommandCentre;

})(Mass);

Turret = (function(_super) {
  var FIRING_DISTANCE, ROTATE_ANGLE_DIFF_MAX, TARGETTING_DISTANCE;

  __extends(Turret, _super);

  TARGETTING_DISTANCE = 1500;

  ROTATE_ANGLE_DIFF_MAX = Math.PI / 32;

  FIRING_DISTANCE = 500;

  Turret.prototype.type = 'Turret';

  Turret.prototype.mass = 1000;

  Turret.prototype.maxHealth = 1000;

  function Turret(options) {
    options || (options = {});
    options.radius || (options.radius = 15);
    options.layer = 1;
    Turret.__super__.constructor.call(this, options);
    this.bulletDelay = 0;
    this.rotation = Math.random(Math.PI * 2);
    this.lastFindTargetLoop = 0;
    this.lastTargettingLoop = 0;
  }

  Turret.prototype.step = function() {
    var dt;
    dt = this.universe.tick - this.tick;
    this.lifetime += dt;
    this.lastFindTargetLoop++;
    if (this.lastFindTargetLoop > 125) {
      this._findTarget();
      this.lastFindTargetLoop = 0;
    }
    this.lastTargettingLoop++;
    if (this.lastFindTargetLoop > 5) {
      this._updateTargetting();
      this.lastTargettingLoop = 0;
    }
    if (this.player.local) {
      this.bulletDelay -= dt;
      if (this.target) {
        if (Math.abs(this.rotation - this.angle) > ROTATE_ANGLE_DIFF_MAX) {
          if (this.rotation > this.angle) {
            this.rotation -= Math.PI / 128;
          } else if (this.rotation < this.angle) {
            this.rotation += Math.PI / 128;
          }
        }
        if (this.shouldFire) this.fire();
      }
    }
    return Turret.__super__.step.apply(this, arguments);
  };

  Turret.prototype.fire = function() {
    if (this.bulletDelay <= 0) {
      this.universe.add(new TurretBullet({
        parent: this
      }));
      return this.bulletDelay = 50;
    }
  };

  Turret.prototype._findTarget = function() {
    var closeObjects,
      _this = this;
    this.target = false;
    closeObjects = _.filter(this.universe.masses.items, function(mass, id) {
      if (mass.player && mass.player !== _this.player) {
        return mass.position.minus(_this.position).length() < TARGETTING_DISTANCE;
      }
    });
    if (closeObjects.length > 0) {
      return this.target = closeObjects[Math.ceil(Math.random(closeObjects.length)) - 1];
    }
  };

  Turret.prototype._updateTargetting = function() {
    var vector;
    if (this.target) {
      vector = this.target.position.minus(this.position);
      this.angle = Math.atan2(vector.y, vector.x);
      return this.shouldFire = Vector._length() < FIRING_DISTANCE;
    } else {
      return this.shouldFire = false;
    }
  };

  Turret.prototype._render = function(ctx) {
    var size;
    ctx.rotate(-this.rotation);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgb(195, 231, 247)';
    size = this.radius * 1.3;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    size = this.radius * 1.0;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    size = this.radius * 0.7;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    size = this.radius * 0.4;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    ctx.fillStyle = 'rgb(0, 25, 0)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgb(0,68,0)';
    ctx.beginPath();
    ctx.arc(0, 0, 0.9 * (this.radius / 2) * (this.health / this.maxHealth), 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.rotate(this.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = 'rgb(135, 157, 168)';
    return ctx.strokeRect(-this.radius, -this.radius / 4, this.radius * 3, this.radius / 2);
  };

  return Turret;

})(Mass);

TurretBullet = (function(_super) {

  __extends(TurretBullet, _super);

  function TurretBullet() {
    TurretBullet.__super__.constructor.apply(this, arguments);
  }

  TurretBullet.prototype.type = 'TurretBullet';

  TurretBullet.prototype.step = function() {
    this.universe.add(new BulletTrail({
      parent: this
    }));
    return TurretBullet.__super__.step.apply(this, arguments);
  };

  TurretBullet.prototype._render = function(ctx) {
    ctx.fillStyle = 'rgb(2, 162, 62)';
    ctx.fillRect(-this.radius * 2, -this.radius / 4, this.radius * 2, this.radius / 2);
    ctx.rotate(-Math.PI / 16);
    ctx.fillRect(-this.radius * 2, -this.radius / 4, this.radius * 2, this.radius / 2);
    ctx.rotate((Math.PI / 16) * 2);
    return ctx.fillRect(-this.radius * 2, -this.radius / 4, this.radius * 2, this.radius / 2);
  };

  return TurretBullet;

})(Bullet);

BulletTrail = (function(_super) {

  __extends(BulletTrail, _super);

  BulletTrail.prototype.type = 'BulletTrail';

  BulletTrail.prototype.solid = false;

  function BulletTrail(options) {
    options.radius || (options.radius = 2);
    options.position || (options.position = options.parent.position);
    options.velocity || (options.velocity = new Vector((Math.random() - 0.5) / 2, (Math.random() - 0.5) / 2));
    options.lifetime = 5;
    BulletTrail.__super__.constructor.call(this, options);
  }

  BulletTrail.prototype._render = function(ctx) {
    var alpha;
    alpha = this.lifetime / 10;
    ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    return ctx.fill();
  };

  return BulletTrail;

})(Mass);

MassDriver = (function(_super) {
  var FIRING_DISTANCE, TARGETTING_DISTANCE;

  __extends(MassDriver, _super);

  TARGETTING_DISTANCE = 1500;

  FIRING_DISTANCE = 350;

  MassDriver.prototype.type = 'MassDriver';

  MassDriver.prototype.mass = 5000;

  MassDriver.prototype.maxHealth = 10000;

  function MassDriver(options) {
    options || (options = {});
    options.radius || (options.radius = 35);
    options.layer = 1;
    MassDriver.__super__.constructor.call(this, options);
    this.lastFindTargetLoop = 0;
    this.lastTargettingLoop = 0;
  }

  MassDriver.prototype.step = function() {
    var dt;
    dt = this.universe.tick - this.tick;
    this.lifetime += dt;
    this.lastFindTargetLoop++;
    if (this.lastFindTargetLoop > 125) {
      this._findTarget();
      this.lastFindTargetLoop = 0;
    }
    this.lastTargettingLoop++;
    if (this.lastFindTargetLoop > 5) {
      this._updateTargetting();
      this.lastTargettingLoop = 0;
    }
    return MassDriver.__super__.step.apply(this, arguments);
  };

  MassDriver.prototype._findTarget = function() {
    var closeObjects,
      _this = this;
    this.target = false;
    closeObjects = _.filter(this.universe.masses.items, function(mass, id) {
      if (mass.player && mass.player !== _this.player) {
        return mass.position.minus(_this.position).length() < TARGETTING_DISTANCE;
      }
    });
    if (closeObjects.length > 0) {
      return this.target = closeObjects[Math.ceil(Math.random(closeObjects.length)) - 1];
    }
  };

  MassDriver.prototype._updateTargetting = function() {
    if (this.target) {
      this.vector = this.target.position.minus(this.position);
      this.shouldFire = this.Vector._length() < FIRING_DISTANCE;
      if (this.shouldFire) {
        return this.target.velocity = this.target.velocity.plus(this.vector.times(10));
      } else {
        return this.target = false;
      }
    } else {
      return this.shouldFire = false;
    }
  };

  MassDriver.prototype._render = function(ctx) {
    ctx.fillStyle = 'rgb(122, 77, 29)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgb(42, 28, 16)';
    ctx.beginPath();
    ctx.arc(0, 0, (this.radius / 3) * 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    if (this.shouldFire) {
      ctx.strokeStyle = 'rgb(42, 28, 16)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.vector.x, this.vector.y);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.fillStyle = 'rgb(0, 25, 0)';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgb(0,68,0)';
    ctx.beginPath();
    ctx.arc(0, 0, 0.9 * 10 * (this.health / this.maxHealth), 0, Math.PI * 2, true);
    ctx.closePath();
    return ctx.fill();
  };

  return MassDriver;

})(Mass);

Viewpoint = (function() {

  Viewpoint.prototype.BUFFER = 40;

  function Viewpoint(canvas) {
    var _ref,
      _this = this;
    this.position = Vector._new(0, 0);
    _ref = [canvas.width, canvas.height], this.width = _ref[0], this.height = _ref[1];
    $(window).resize(function() {
      var _ref2;
      return _ref2 = [canvas.width, canvas.height], _this.width = _ref2[0], _this.height = _ref2[1], _ref2;
    });
  }

  Viewpoint.prototype.update = function(ship) {
    this.position.x = ship.position.x - (this.width / 2);
    return this.position.y = ship.position.y - (this.height / 2);
  };

  Viewpoint.prototype.translate = function(ctx) {
    return ctx.translate(-this.position.x, -this.position.y);
  };

  Viewpoint.prototype.offscreen = function(vector) {
    vector = Vector.minus(vector, this.position);
    return vector.x < 0 || vector.x > this.width || vector.y < 0 || vector.y > this.height;
  };

  return Viewpoint;

})();

Vector = (function() {

  function Vector() {}

  Vector._new = function(x, y) {
    var _ref;
    _ref = y != null ? [x, y] : [Math.cos(x), Math.sin(x)], x = _ref[0], y = _ref[1];
    x || (x = 0);
    y || (y = 0);
    return this._zeroSmall({
      x: x,
      y: y
    });
  };

  Vector.plus = function(vector, v) {
    return {
      x: vector.x + v.x,
      y: vector.y + v.y
    };
  };

  Vector.minus = function(vector, v) {
    return {
      x: vector.x - v.x,
      y: vector.y - v.y
    };
  };

  Vector.times = function(vector, s) {
    return {
      x: vector.x * s,
      y: vector.y * s
    };
  };

  Vector._length = function(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  };

  Vector.normalized = function(vector) {
    return this.times(vector, 1.0 / this._length(vector));
  };

  Vector.dotProduct = function(vector, other) {
    return (vector.x * other.x) + (vector.y * other.y);
  };

  Vector.clone = function(vector) {
    return {
      x: vector.x,
      y: vector.y
    };
  };

  Vector._zeroSmall = function(vector) {
    if (Math.abs(vector.x) < 0.01) vector.x = 0;
    if (Math.abs(vector.y) < 0.01) vector.y = 0;
    return vector;
  };

  return Vector;

})();

Gt.Vector = Vector;

$(document).ready(function() {
  return Gt.c = new Gt.Controller($('canvas').get(0));
});
