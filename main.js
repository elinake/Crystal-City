var game = new Phaser.Game(700, 700, Phaser.AUTO, '', {
    preload: preload,
    create: create,
    update: update
});

var player;
var cursors;
var enemys;
var enemiesLeft = 10;
var map;
var bullets;
var fireButton;
var fireSound;
var explosion;
var applause;
var boo;
var bulletCollisionGroup;
var enemyCollisionGroup;
var worldCollisionGroup;
var playerCollisionGroup;

var score = 0;
var scoreText;
var startText;

var emitter;
var emitter2;

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('targ', 'assets/targ.png');
    game.load.image('bullet', 'assets/bullet2.png');
    game.load.image('wummel', 'assets/wummel.png');
    game.load.image('spectar', 'assets/ss.png');
    game.load.image('expRed', 'assets/expRed.png');
    game.load.image('expGreen', 'assets/expGreen.png');
    game.load.image('start', 'assets/starttext.png');

    game.load.audio('sound', 'assets/silencer.wav');
    game.load.audio('explosion', 'assets/explosion.wav');
    game.load.audio('applause', 'assets/applause3.wav');
    game.load.audio('boo', 'assets/boo.wav');

    game.load.tilemap('map', 'city.json', null, Phaser.Tilemap.TILED_JSON);
}

function create() {
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setImpactEvents(true);
    game.physics.p2.restitution = 0.8;
    game.stage.backgroundColor = "#0000F8";

    //controls
    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    fireButton.onDown.add(fireBullet, this);
    var re = game.input.keyboard.addKey(Phaser.Keyboard.ESC);
    re.onDown.add(restart, this);

    //sounds
    fireSound = game.add.audio('sound');
    explosion = game.add.audio('explosion');
    explosion.allowMultiple = true;
    applause = game.add.audio('applause');
    boo = game.add.audio('boo');

    //explosion particles
    emitter = game.add.emitter(0, 0, 100);
    emitter.makeParticles('expRed');
    emitter.gravity = 200;

    emitter2 = game.add.emitter(0, 0, 100);
    emitter2.makeParticles('expGreen');
    emitter2.gravity = 200;

    playerCollisionGroup = game.physics.p2.createCollisionGroup();
    worldCollisionGroup = game.physics.p2.createCollisionGroup();
    enemyCollisionGroup = game.physics.p2.createCollisionGroup();
    bulletCollisionGroup = game.physics.p2.createCollisionGroup();
    game.physics.p2.updateBoundsCollisionGroup();

    //world
    map = game.add.tilemap('map');
    map.addTilesetImage('sky');

    layer = map.createLayer('Tile Layer 1');
    layer.resizeWorld();
    layer.enableBody = true;

    map.setCollisionBetween(0, 100);
    var tileObjects = game.physics.p2.convertTilemap(map, layer);
    for (var i = 0; i < tileObjects.length; i++) {
        var tileBody = tileObjects[i];
        tileBody.setCollisionGroup(worldCollisionGroup);
        tileBody.collides([playerCollisionGroup, enemyCollisionGroup, bulletCollisionGroup]);
    }

    game.physics.p2.setBoundsToWorld(true, true, true, true, true);

    scoreText = game.add.text(16, 16, 'score: 0', {
        fontSize: '32px',
        fill: '#FFFFFF',
        style: Phaser.RetroFont.TEXT_SET6
    });
    
     //targs
    enemys = game.add.group();
    enemys.enableBody = true;
    enemys.physicsBodyType = Phaser.Physics.P2JS;

    initial();

}

function initial() {
    // The player and its settings
    player = game.add.sprite(34, game.world.height - 150, 'wummel');
    //    player.anchor.setTo(0.5, 0.5);
    player.scale.set(1.4, 1.6);
    game.physics.p2.enable(player);
    player.body.setCollisionGroup(playerCollisionGroup);
    player.body.collides(enemyCollisionGroup, hitEnemy, this);
    player.body.collides(worldCollisionGroup);
    player.visible = true;
       player.speed = 300; //jostain syystä tämän poiskommentointi piilottaa spriten?!?!
    //    player.body.mass = 0.1;

    startText = game.add.sprite(100, 200, 'start');
    startText.fixedToCamera = true;

    game.input.onDown.add(removeStart, this);

}

//removes logo and adds the enemies, real game begin
function removeStart() {
    game.input.onDown.remove(removeStart, this);
    startText.kill();
    player.visible = true;

    for (var i = 1; i <= enemiesLeft; i++) {
        createEnemys('targ', i);
    }

    //10 seconds to super enemy
    game.time.events.add(10000, function () {
        spectarSmuggler();
    }, this);
}

//go to start screen
function restart() {
    score = 0;
    scoreText.text = 'Score: 0';
    player.destroy(); //ei voi poistaa koska muuten voittotilanteessa vanha jää näkyviin
    fireSound.destroy = true; //ei toimi myöskään funktiona

    enemys.forEach(function (targ) {
        targ.kill();
    });
    enemiesLeft = 10;
    initial();
}

//
function createEnemys(sprite, i) {
    var targ = enemys.create(i * 62, 100, sprite);
    targ.scale.set(1.4, 1.6);
    targ.body.velocity.y = -200; //ei muuten liiku alussa
    game.physics.p2.enable(targ);
    targ.speed = 300;

    targ.body.setCollisionGroup(enemyCollisionGroup);
    targ.body.collides(bulletCollisionGroup, enemyDies, this);
    targ.body.collides([enemyCollisionGroup, worldCollisionGroup]);
    targ.body.collides(playerCollisionGroup, hitEnemy, this);

    game.time.events.loop(3000, function () {
        targ.direction = game.rnd.integerInRange(0, 3);
        changeDirection(targ);
    }, this);
    return targ;
}

//super enemy
function spectarSmuggler() {
    var spectar = createEnemys('spectar', game.rnd.integerInRange(1, 9));
    spectar.speed = 300;
    spectar.body.createBodyCallback(player, function () {
        player.destroy(); //kill jättää vanhan näkyviin ja luo uuden, destroy tuhoaa ja se ei jää näkyviin uuden pelin alussa
        console.log("You lost!");
        boo.play();
        restart();
    }, this);
    enemiesLeft++;
}

//changes enemy direction randomly
function changeDirection(targ) {
    switch (targ.direction) {
    case 0:
        targ.body.velocity.x = -targ.speed;
        break;
    case 1:
        targ.body.velocity.x = targ.speed;
        break;
    case 2:
        targ.body.velocity.y = -targ.speed;
        break;
    case 3:
        targ.body.velocity.y = targ.speed;
        break;
    default:
        break;
    }
}


//body1 = vihollinen
//body2 = luoti
function enemyDies(body1, body2) {
    if (body2.sprite == null) return;
    explosion.play();
    emitter.x = body1.x;
    emitter.y = body1.y;
    emitter.start(true, 500, null, 50);

    body1.sprite.destroy();
    body2.sprite.destroy(); //välillä null?

    //  Add and update the score
    score += 10;
    scoreText.text = 'Score: ' + score;
    enemiesLeft--;
    if (enemiesLeft <= 0) {
        applause.play();
        console.log("You won!");
        restart();
    }
}


//the enemy hit the player and set it invisivle
function hitEnemy() {
    explosion.play();
    player.visible = false;
}

//player shoots the targs
function fireBullet() {
    fireSound.play();
    var bullet = game.add.sprite(player.body.x, player.body.y, 'bullet');
    bullet.enableBody = true;
    bullet.mass = 0.1;
    game.physics.p2.enable(bullet);
    bullet.body.velocity.x = -200 * player.body.velocity.x;
    bullet.body.velocity.y = -200 * player.body.velocity.y;

    bullet.body.setCollisionGroup(bulletCollisionGroup);
    bullet.body.collides(enemyCollisionGroup, hitEnemy, this)
    bullet.body.collides(worldCollisionGroup, function (body1, body2) {
        body1.sprite.destroy();
    }, this);
    game.time.events.add(2000, function () {
        bullet.destroy();
    }, this);
}

function update() {
    if (cursors.left.isDown) {
        player.body.velocity.x = -player.speed;
    } else if (cursors.right.isDown) {
        player.body.velocity.x = player.speed;
    }

    if (cursors.up.isDown) {
        player.body.velocity.y = -player.speed;
    } else if (cursors.down.isDown) {
        player.body.velocity.y = player.speed;

    }

}