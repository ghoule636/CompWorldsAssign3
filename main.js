/*
 * Gabriel Houle
 * Assignment 2
 */

var socket = io.connect("http://76.28.150.193:8888");

socket.on("load", function (data) {
    console.log(data);
    gameEngine.entities = [];
    gameEngine.bases = [];
    for (var i = 0; i < data.ships.length; i++) {
        var tempShip = data.ships[i];
        var loadShip = new Ship(gameEngine, tempShip.x, tempShip.y, tempShip.color);
        loadShip.setExperience(tempShip.experience);
        loadShip.setVelocity(tempShip.velocity);
        gameEngine.addEntity(loadShip);
    }

    for (var i = 0; i < data.bases.length; i++) {
        var tempBase = data.bases[i];
        var loadBase = new Base(gameEngine, tempBase.x, tempBase.y, tempBase.type, tempBase.color);
        loadBase.setHealth(tempBase.health);
        loadBase.setSpawnCount(tempBase.spawnCount);
        loadBase.setVelocity(tempBase.velocity);
        gameEngine.addBase(loadBase);
    }
});


//socket.emit("load", { studentname: "Gabriel Houle", statename: "theState" });


function distance(a, b) {
    var difX = a.x - b.x;
    var difY = a.y - b.y;
    return Math.sqrt(difX * difX + difY * difY);
};

function Base(game, x, y, type, color) {
    this.color = color;
    this.x = x;
    this.y = y;
    this.type = type;
    this.spawnCount = 0;
    this.visualRadius = 700;
    this.radius = 30;
    this.health = 2;
    this.spawnTimer = 50;
    this.velocity = { x: 0, y: 0 };
    
    Entity.call(this, game, this.x, this.y);
}

Base.prototype = new Entity();
Base.prototype.constructor = Base;

Base.prototype.setHealth = function (e) {
    this.health = e;
}

Base.prototype.setVelocity = function (e) {
    this.velocity = e;
}

Base.prototype.setSpawnCount = function (e) {
    this.spawnCount = e;
}

Base.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

Base.prototype.update = function () {
    Entity.prototype.update.call(this);
    var colorCount = 0;
    var enemyCount = 1;

    for (var i = 0; i < this.game.bases.length; i++) {
        var ent = this.game.bases[i];
        if (ent.color === this.color) {
            colorCount++;
        } else {
            enemyCount++;
        }
    }

    if (colorCount == 1 && (enemyCount > 4 || enemyCount < 3) && this.spawnTimer > 20) {
        this.spawnTimer--;
    } else if (this.spawnTimer < 50) {
        this.spawnTimer++;
    }

    if (collideLeft(this) || collideRight(this)) { // screen edge detection
        if (collideLeft(this)) this.x = this.radius;
        if (collideRight(this)) this.x = 800 - this.radius;
    }
    if (collideTop(this) || collideBottom(this)) {
        if (collideTop(this)) this.y = this.radius;
        if (collideBottom(this)) this.y = 800 - this.radius;
    }

    for (var i = 0; i < this.game.bases.length; i++) { // collision with bases
        var ent = this.game.bases[i];
        if (ent != this && this.collide(ent)) {

            var dist = distance(this, ent);
            var delta = this.radius + ent.radius - dist;
            var difX = (this.x - ent.x) / dist;
            var difY = (this.y - ent.y) / dist;
            this.x += difX * delta;
            this.y += difY * delta;
        }
    }

    if (this.spawnCount < this.spawnTimer) {
        this.spawnCount++;
    } else {
        var ship = new Ship(this.game, this.x + Math.random() * 150 - 80,
                            this.y + Math.random() * 150 - 80, this.color);
        this.game.addEntity(ship);
        this.spawnCount = 0;
    }
    if (this.health <= 0) {
        this.removeFromWorld = true;
    }
}

Base.prototype.draw = function (ctx) {
    var healthBar = 1;
    if (this.health == 1) {
        healthBar = 2;
    }
    
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, (Math.PI * 2) / healthBar, false);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.strokeStyle = "White";
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.stroke();
    ctx.closePath();
}

function Ship(game, x, y, color) {
    this.radius = 15;
    this.experience = 0;
    this.visualRadius = 700;
    this.color = color;
    this.x = x;
    this.y = y;
    this.velocity = {x: 0, y: 0};

    Entity.call(this, game, this.x, this.y);
}

Ship.prototype = new Entity();
Ship.prototype.constructor = Ship;

Ship.prototype.setExperience = function (e) {
    this.experience = e;
}

Ship.prototype.setVelocity = function (e) {
    this.velocity = e;
}

Ship.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

Ship.prototype.update = function () {
    Entity.prototype.update.call(this);
    var colorCount = 0;

    for (var i = 0; i < this.game.bases.length; i++) {
        var ent = this.game.bases[i];
        if (ent.color === this.color) {
            colorCount++;
        }
    }

    if (this.experience > 500 && colorCount < 3) {
        var base = new Base(this.game, this.x, this.y, "main", this.color);
        this.game.addBase(base);
        this.removeFromWorld = true;
    }

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (collideLeft(this) || collideRight(this)) { // screen edge detection
        this.velocity.x = -this.velocity.x * friction;
        if (collideLeft(this)) this.x = this.radius;
        if (collideRight(this)) this.x = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }
    if (collideTop(this) || collideBottom(this)) {
        this.velocity.y = -this.velocity.y * friction;
        if (collideTop(this)) this.y = this.radius;
        if (collideBottom(this)) this.y = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    for (var i = 0; i < this.game.entities.length; i++) { // collision with other ships
        var ent = this.game.entities[i];
        if (ent !== this && this.collide(ent) && this.color === ent.color) {

            var dist = distance(this, ent);
            var delta = this.radius + ent.radius - dist;
            var difX = (this.x - ent.x) / dist;
            var difY = (this.y - ent.y) / dist;

            this.x += difX * delta / 2;
            this.y += difY * delta / 2;
            ent.x -= difX * delta / 2;
            ent.y -= difY * delta / 2;

        } else if (ent !== this && this.collide(ent) && this.color !== ent.color) {
            // destroys ships of different colors upon collision
            var select = Math.random();
            this.removeFromWorld = true;
            ent.removeFromWorld = true;
        }

        if (ent.color != this.color && this.collide({ x: ent.x, y: ent.y, radius: this.visualRadius })) {
            var dist = distance(this, ent);
            if (dist > this.radius + ent.radius + 10) {
                var difX = (ent.x - this.x) / dist;
                var difY = (ent.y - this.y) / dist;
                this.velocity.x += difX * acceleration / (dist * dist);
                this.velocity.y += difY * acceleration / (dist * dist);
                var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
                if (speed > maxSpeed) {
                    var ratio = maxSpeed / speed;
                    this.velocity.x *= ratio;
                    this.velocity.y *= ratio;
                }
            }
        }
    }

    for (var i = 0; i < this.game.bases.length; i++) { // collision with bases
        var ent = this.game.bases[i];
        if (this.collide(ent) && this.color === ent.color) {

            var dist = distance(this, ent);
            var delta = this.radius + ent.radius - dist;
            var difX = (this.x - ent.x) / dist;
            var difY = (this.y - ent.y) / dist;

            this.x += difX * delta;
            this.y += difY * delta;

            if (ent.color != this.color && this.collide({ x: ent.x, y: ent.y, radius: this.visualRadius })) {
                var dist = distance(this, ent);
                if (dist > this.radius + ent.radius + 10) {
                    var difX = (ent.x - this.x) / dist;
                    var difY = (ent.y - this.y) / dist;
                    this.velocity.x += (difX * acceleration / (dist * dist) * 5);
                    this.velocity.y += (difY * acceleration / (dist * dist) * 5);
                    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
                    if (speed > maxSpeed) {
                        var ratio = maxSpeed / speed;
                        this.velocity.x *= ratio;
                        this.velocity.y *= ratio;
                    }
                }
            }

        } else if (this.collide(ent) && this.color !== ent.color) {
            ent.health--;
            this.removeFromWorld = true;
        }
    }
    this.experience++;
}

Ship.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
}

// the "main" code begins here

var friction = 1;
var acceleration = 10000;
var maxSpeed = 200;
var colors = ["Red", "Green", "Blue", "Purple"];

var collideLeft = function (ent) {
    return (ent.x - ent.radius) < 0;
};

var collideRight = function (ent) {
    return (ent.x + ent.radius) > 800;
};

var collideTop = function (ent) {
    return (ent.y - ent.radius) < 0;
};

var collideBottom = function (ent) {
    return (ent.y + ent.radius) > 800;
};

var ASSET_MANAGER = new AssetManager();
var gameEngine = new GameEngine();

ASSET_MANAGER.queueDownload("");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var saveBtn = document.getElementById('Save');
    var loadBtn = document.getElementById('Load')
    var ctx = canvas.getContext('2d');

    gameEngine = new GameEngine();

    socket.on("connect", function () {
        console.log("Socket connected.")
    });
    socket.on("disconnect", function () {
        console.log("Socket disconnected.")
    });
    socket.on("reconnect", function () {
        console.log("Socket reconnected.")
    });
    
    var base1 = new Base(gameEngine, 100, 100, "main", colors[3]);
    gameEngine.addBase(base1);

    var base2 = new Base(gameEngine, 600, 100, "main", colors[1]);
    gameEngine.addBase(base2);

    var base3 = new Base(gameEngine, 100, 600, "main", colors[2]);
    gameEngine.addBase(base3);

    var base4 = new Base(gameEngine, 600, 600, "main", colors[0]);
    gameEngine.addBase(base4);

    gameEngine.init(ctx);
    gameEngine.start();


    saveBtn.addEventListener("click", function (e) {
        console.log("save");

        var shipList = [];
        var baseList = [];

        for (var i = 0; i < gameEngine.entities.length; i++) {
            var currShip = gameEngine.entities[i];
            var tempShip = {
                experience: currShip.radius, color: currShip.color, x: currShip.x, y: currShip.y,
                velocity: currShip.velocity
            };

            shipList.push(tempShip);
        }

        for (var i = 0; i < gameEngine.bases.length; i++) {
            var currBase = gameEngine.bases[i];
            var tempBase = {
                color: currBase.color, type: currBase.type, health: currBase.health, spawnCount: currBase.spawnCount,
                velocity: currBase.velocity, x: currBase.x, y: currBase.y
            }
            baseList.push(tempBase);
        }

        socket.emit("save", {studentname: "Gabriel Houle", statename: "aState", ships: shipList, bases: baseList});
    }, false);

    loadBtn.addEventListener("click", function (e) {
        console.log("load");
        socket.emit("load", {studentname: "Gabriel Houle", statename: "aState"});
    }, false);
});
