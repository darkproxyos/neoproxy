var sprite;
var Nivel28 = {
  preload: function(){
    game.stage.backgroundColor = '#000000';
    game.load.image('fondo', 'assets/map/fondolvl5.png');
    game.load.spritesheet('portalwin', 'assets/sprites/portalwin.png', 64, 64, 8);
    game.load.image('arrow', 'assets/sprites/arrow.png');
    game.load.image('bolapuaslvl1', 'assets/sprites/bolapuaslvl1.png');
    game.load.image('bolapuas', 'assets/sprites/bolapuaslvl4.png');
    game.load.image('baseboomeranglvl1', 'assets/sprites/baseboomerang.png');
    game.load.image('boomeranglvl1', 'assets/sprites/boomerang.png');
    game.load.image('baseboomeranglvl2', 'assets/sprites/baseboomeranglvl2.png');
    game.load.image('boomeranglvl2', 'assets/sprites/boomeranglvl2.png');
    game.load.image('baseboomerang', 'assets/sprites/baseboomeranglvl4.png');
    game.load.image('boomerang', 'assets/sprites/boomeranglvl4.png');
    game.load.image('sierralvl1', 'assets/sprites/sierra.png');
    game.load.image('sierra', 'assets/sprites/sierralvl4.png');
    game.load.image('baseboomeranglvl3', 'assets/sprites/baseboomeranglvl3.png');
    game.load.image('boomeranglvl3', 'assets/sprites/boomeranglvl3.png');
    game.load.image('sierralvl3', 'assets/sprites/sierralvl3.png');
    game.load.image('aplastadorlvl3', 'assets/sprites/aplastador.png');
    game.load.image('aplastador', 'assets/sprites/aplastadorlvl4.png');
    game.load.image('cubo3x3', 'assets/sprites/nivel27/3x3.png');
    game.load.image('bullet', 'assets/sprites/lazer.png');
    game.load.image('canon', 'assets/sprites/canon.png');
    game.load.tilemap('map','assets/map/nivel28.csv');
    game.load.image('tileset','assets/map/tilenivel7.png');
    game.load.spritesheet('musiconoff', 'assets/sprites/musiconoff.png', 64,64);

      //game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

    //game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    firstRunLandscape = game.scale.isGameLandscape;
    game.scale.forceOrientation(false, true);
    game.scale.enterIncorrectOrientation.add(handleIncorrect);
    game.scale.leaveIncorrectOrientation.add(handleCorrect);
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.setShowAll();


    this.game.scale.refresh();

        //game.scale.refresh();



  },

  create: function(){

    if(whitelvl.isPlaying == false){
          whitelvl.play();
    };
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.add.tileSprite(0, 0, 3200, 3200, 'fondo');

    portalwin = game.add.sprite(1398, 1566, 'portalwin');
    game.physics.enable(portalwin, Phaser.Physics.ARCADE);
    var portalanim = portalwin.animations.add('portalanim');
    portalwin.animations.play('portalanim', 30, true);
    portalwin.body.immovable = true;
    portalwin.body.enable = true;
    portalwin.anchor.setTo(0.5);

    portalwinb = game.add.sprite(3072, 2432, 'portalwin');
    game.physics.enable(portalwinb, Phaser.Physics.ARCADE);
    var portalanim = portalwinb.animations.add('portalanim');
    portalwinb.animations.play('portalanim', 30, true);
    portalwinb.body.immovable = true;
    portalwinb.body.enable = true;
    portalwinb.anchor.setTo(0.5);

    portalwinc = game.add.sprite(2047, 1981, 'portalwin');
    game.physics.enable(portalwinc, Phaser.Physics.ARCADE);
    var portalanim = portalwinc.animations.add('portalanim');
    portalwinc.animations.play('portalanim', 30, true);
    portalwinc.body.immovable = true;
    portalwinc.body.enable = true;
    portalwinc.anchor.setTo(0.5);

    portalwind = game.add.sprite(1855, 1981, 'portalwin');
    game.physics.enable(portalwind, Phaser.Physics.ARCADE);
    var portalanim = portalwind.animations.add('portalanim');
    portalwind.animations.play('portalanim', 30, true);
    portalwind.body.immovable = true;
    portalwind.body.enable = true;
    portalwind.anchor.setTo(0.5);

    portalwine = game.add.sprite(1665, 1981, 'portalwin');
    game.physics.enable(portalwine, Phaser.Physics.ARCADE);
    var portalanim = portalwine.animations.add('portalanim');
    portalwine.animations.play('portalanim', 30, true);
    portalwine.body.immovable = true;
    portalwine.body.enable = true;
    portalwine.anchor.setTo(0.5);

    portalwinf = game.add.sprite(1471, 1981, 'portalwin');
    game.physics.enable(portalwinf, Phaser.Physics.ARCADE);
    var portalanim = portalwinf.animations.add('portalanim');
    portalwinf.animations.play('portalanim', 30, true);
    portalwinf.body.immovable = true;
    portalwinf.body.enable = true;
    portalwinf.anchor.setTo(0.5);

    portalwing = game.add.sprite(1280, 1981, 'portalwin');
    game.physics.enable(portalwing, Phaser.Physics.ARCADE);
    var portalanim = portalwing.animations.add('portalanim');
    portalwing.animations.play('portalanim', 30, true);
    portalwing.body.immovable = true;
    portalwing.body.enable = true;
    portalwing.anchor.setTo(0.5);

    portalwinh = game.add.sprite(2368, 1150, 'portalwin');
    game.physics.enable(portalwinh, Phaser.Physics.ARCADE);
    var portalanim = portalwinh.animations.add('portalanim');
    portalwinh.animations.play('portalanim', 30, true);
    portalwinh.body.immovable = true;
    portalwinh.body.enable = true;
    portalwinh.anchor.setTo(0.5);

   sprite = game.add.sprite(254, 2783, 'arrow');
   game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.collideWorldBounds = true;
    sprite.body.enable = true;
    sprite.scale.setTo(1.3, 1.3);
    game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.setSize(18, 18, +13,+1);
    sprite.body.setCircle(16);
    sprite.anchor.setTo(0.5);
    sprite.body.allowRotation = true;

    bolapuas = game.add.sprite(705, 2525, 'bolapuaslvl1');
    game.physics.enable(bolapuas, Phaser.Physics.ARCADE);
    bolapuas.body.enable = true;
    bolapuas.body.immovable = true;
    bolapuas.anchor.setTo(0.5, 0.5);
    bolapuas.scale.setTo(0.4, 0.4);
    bolapuas.body.setCircle(185);
    tween = game.add.tween(bolapuas).to({ x: 1070 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    aplastador = game.add.sprite(1952, 191, 'aplastadorlvl3');
    game.physics.enable(aplastador, Phaser.Physics.ARCADE);
    aplastador.body.enable = true;
    aplastador.body.immovable = true;
    aplastador.anchor.setTo(0.5, 0.5);
    aplastador.scale.setTo(0.4, 0.4);
    aplastador.angle += 90;
    tween = game.add.tween(aplastador).to({ x: 2080 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
    tween.repeatDelay(1000);

    sierra = game.add.sprite(256, 1406, 'sierralvl1');
    game.physics.enable(sierra, Phaser.Physics.ARCADE);
    sierra.body.enable = true;
    sierra.body.immovable = true;
    sierra.anchor.setTo(0.5, 0.5);
    sierra.scale.setTo(0.3, 0.3);
    sierra.body.setCircle(185);
    tween = game.add.tween(sierra).to({ x: 1087 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    sierra2 = game.add.sprite(1087, 1151, 'sierralvl1');
    game.physics.enable(sierra2, Phaser.Physics.ARCADE);
    sierra2.body.enable = true;
    sierra2.body.immovable = true;
    sierra2.anchor.setTo(0.5, 0.5);
    sierra2.scale.setTo(0.3, 0.3);
    sierra2.body.setCircle(185);
    tween2 = game.add.tween(sierra2).to({ x: 193 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    sierra3 = game.add.sprite(2561, 319, 'sierralvl3');
    game.physics.enable(sierra3, Phaser.Physics.ARCADE);
    sierra3.body.enable = true;
    sierra3.body.immovable = true;
    sierra3.anchor.setTo(0.5, 0.5);
    sierra3.scale.setTo(0.3, 0.3);
    sierra3.body.setCircle(185);
    tween3 = game.add.tween(sierra3).to({ x: 2049 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo3x3 = game.add.sprite(2592, 1824, 'cubo3x3');
    game.physics.enable(cubo3x3, Phaser.Physics.ARCADE);
    cubo3x3.body.enable = true;
    cubo3x3.body.immovable = true;
    cubo3x3.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween = game.add.tween(cubo3x3).to({ x: 3042 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo3x3b = game.add.sprite(2400, 1824, 'cubo3x3');
    game.physics.enable(cubo3x3b, Phaser.Physics.ARCADE);
    cubo3x3b.body.enable = true;
    cubo3x3b.body.immovable = true;
    cubo3x3b.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween3x3b = game.add.tween(cubo3x3b).to({ y: 2145 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo3x3c = game.add.sprite(3043, 2207, 'cubo3x3');
    game.physics.enable(cubo3x3c, Phaser.Physics.ARCADE);
    cubo3x3c.body.enable = true;
    cubo3x3c.body.immovable = true;
    cubo3x3c.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween3x3c = game.add.tween(cubo3x3c).to({ x: 2594 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);


    map = game.add.tilemap('map', 64, 64);

    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,110);
    map.setTileIndexCallback(0, this.dead, this);
    map.setTileIndexCallback(1, this.dead, this);
    map.setTileIndexCallback(2, this.dead, this);
    map.setTileIndexCallback(3, this.dead, this);
    map.setTileIndexCallback(4, this.dead, this);
    map.setTileIndexCallback(5, this.dead, this);
    map.setCollision(16);

    layer = map.createLayer(0);

    layer.resizeWorld();

    game.camera.follow(sprite);

    baseboomerang = game.add.sprite(480, 2077, 'baseboomeranglvl1');
    baseboomerang.anchor.setTo(0.5, 0.5);
    baseboomerang.scale.setTo(0.3, 0.3);

    boomerang = game.add.sprite(480, 2077, 'boomeranglvl1');
    game.physics.enable(boomerang, Phaser.Physics.ARCADE);
    boomerang.body.enable = true;
    boomerang.body.immovable = true;
    boomerang.anchor.setTo(0.5, 0.5);
    boomerang.scale.setTo(0.3, 0.3);
    boomerang.body.setCircle(160);
    boomerang.pivot.x = 400;

    baseboomerang1 = game.add.sprite(929, 800, 'baseboomeranglvl2');
    baseboomerang1.anchor.setTo(0.5, 0.5);
    baseboomerang1.scale.setTo(0.3, 0.3);

    boomerang1 = game.add.sprite(929, 800, 'boomeranglvl2');
    game.physics.enable(boomerang1, Phaser.Physics.ARCADE);
    boomerang1.body.enable = true;
    boomerang1.body.immovable = true;
    boomerang1.anchor.setTo(0.5, 0.5);
    boomerang1.scale.setTo(0.3, 0.3);
    boomerang1.body.setCircle(160);
    boomerang1.pivot.x = 400;

    baseboomerang2 = game.add.sprite(223, 223, 'baseboomeranglvl2');
    baseboomerang2.anchor.setTo(0.5, 0.5);
    baseboomerang2.scale.setTo(0.3, 0.3);

    boomerang2 = game.add.sprite(223, 223, 'boomeranglvl2');
    game.physics.enable(boomerang2, Phaser.Physics.ARCADE);
    boomerang2.body.enable = true;
    boomerang2.body.immovable = true;
    boomerang2.anchor.setTo(0.5, 0.5);
    boomerang2.scale.setTo(0.3, 0.3);
    boomerang2.body.setCircle(160);
    boomerang2.pivot.x = 400;

    baseboomerang3 = game.add.sprite(864, 415, 'baseboomeranglvl2');
    baseboomerang3.anchor.setTo(0.5, 0.5);
    baseboomerang3.scale.setTo(0.3, 0.3);

    boomerang3 = game.add.sprite(864, 415, 'boomeranglvl2');
    game.physics.enable(boomerang3, Phaser.Physics.ARCADE);
    boomerang3.body.enable = true;
    boomerang3.body.immovable = true;
    boomerang3.anchor.setTo(0.5, 0.5);
    boomerang3.scale.setTo(0.3, 0.3);
    boomerang3.body.setCircle(160);
    boomerang3.pivot.x = 400;

    baseboomerang4 = game.add.sprite(607, 225, 'baseboomeranglvl2');
    baseboomerang4.anchor.setTo(0.5, 0.5);
    baseboomerang4.scale.setTo(0.3, 0.3);

    boomerang4 = game.add.sprite(607, 225, 'boomeranglvl2');
    game.physics.enable(boomerang4, Phaser.Physics.ARCADE);
    boomerang4.body.enable = true;
    boomerang4.body.immovable = true;
    boomerang4.anchor.setTo(0.5, 0.5);
    boomerang4.scale.setTo(0.3, 0.3);
    boomerang4.body.setCircle(160);
    boomerang4.pivot.x = 400;

    baseboomerangred = game.add.sprite(1824, 863, 'baseboomeranglvl3');
    baseboomerangred.anchor.setTo(0.5, 0.5);
    baseboomerangred.scale.setTo(0.3, 0.3);

    boomerangred = game.add.sprite(1824, 863, 'boomeranglvl3');
    game.physics.enable(boomerangred, Phaser.Physics.ARCADE);
    boomerangred.body.enable = true;
    boomerangred.body.immovable = true;
    boomerangred.anchor.setTo(0.5, 0.5);
    boomerangred.scale.setTo(0.3, 0.3);
    boomerangred.body.setCircle(160);
    boomerangred.pivot.x = 400;

    boomerangredb = game.add.sprite(1824, 863, 'boomeranglvl3');
    game.physics.enable(boomerangredb, Phaser.Physics.ARCADE);
    boomerangredb.body.enable = true;
    boomerangredb.body.immovable = true;
    boomerangredb.anchor.setTo(0.5, 0.5);
    boomerangredb.scale.setTo(0.3, 0.3);
    boomerangredb.body.setCircle(160);
    boomerangredb.pivot.x = 400;
    boomerangredb.rotation += 3.1;

    baseboomerangred2 = game.add.sprite(1695, 349, 'baseboomeranglvl3');
    baseboomerangred2.anchor.setTo(0.5, 0.5);
    baseboomerangred2.scale.setTo(0.3, 0.3);

    boomerangred2 = game.add.sprite(1695, 349, 'boomeranglvl3');
    game.physics.enable(boomerangred2, Phaser.Physics.ARCADE);
    boomerangred2.body.enable = true;
    boomerangred2.body.immovable = true;
    boomerangred2.anchor.setTo(0.5, 0.5);
    boomerangred2.scale.setTo(0.3, 0.3);
    boomerangred2.body.setCircle(160);
    boomerangred2.pivot.x = 400;

    boomerangred2b = game.add.sprite(1695, 349, 'boomeranglvl3');
    game.physics.enable(boomerangred2b, Phaser.Physics.ARCADE);
    boomerangred2b.body.enable = true;
    boomerangred2b.body.immovable = true;
    boomerangred2b.anchor.setTo(0.5, 0.5);
    boomerangred2b.scale.setTo(0.3, 0.3);
    boomerangred2b.body.setCircle(160);
    boomerangred2b.pivot.x = 400;
    boomerangred2b.rotation += 3.1;

    baseboomerangred3 = game.add.sprite(1951, 608, 'baseboomeranglvl3');
    baseboomerangred3.anchor.setTo(0.5, 0.5);
    baseboomerangred3.scale.setTo(0.3, 0.3);

    boomerangred3 = game.add.sprite(1951, 608, 'boomeranglvl3');
    game.physics.enable(boomerangred3, Phaser.Physics.ARCADE);
    boomerangred3.body.enable = true;
    boomerangred3.body.immovable = true;
    boomerangred3.anchor.setTo(0.5, 0.5);
    boomerangred3.scale.setTo(0.3, 0.3);
    boomerangred3.body.setCircle(160);
    boomerangred3.pivot.x = 400;

    boomerangred3b = game.add.sprite(1951, 608, 'boomeranglvl3');
    game.physics.enable(boomerangred3b, Phaser.Physics.ARCADE);
    boomerangred3b.body.enable = true;
    boomerangred3b.body.immovable = true;
    boomerangred3b.anchor.setTo(0.5, 0.5);
    boomerangred3b.scale.setTo(0.3, 0.3);
    boomerangred3b.body.setCircle(160);
    boomerangred3b.pivot.x = 400;
    boomerangred3b.rotation += 3.1;

    baseboomerangred4 = game.add.sprite(2209, 543, 'baseboomeranglvl3');
    baseboomerangred4.anchor.setTo(0.5, 0.5);
    baseboomerangred4.scale.setTo(0.3, 0.3);

    boomerangred4 = game.add.sprite(2209, 543, 'boomeranglvl3');
    game.physics.enable(boomerangred4, Phaser.Physics.ARCADE);
    boomerangred4.body.enable = true;
    boomerangred4.body.immovable = true;
    boomerangred4.anchor.setTo(0.5, 0.5);
    boomerangred4.scale.setTo(0.3, 0.3);
    boomerangred4.body.setCircle(160);
    boomerangred4.pivot.x = 400;

    boomerangred4b = game.add.sprite(2209, 543, 'boomeranglvl3');
    game.physics.enable(boomerangred4b, Phaser.Physics.ARCADE);
    boomerangred4b.body.enable = true;
    boomerangred4b.body.immovable = true;
    boomerangred4b.anchor.setTo(0.5, 0.5);
    boomerangred4b.scale.setTo(0.3, 0.3);
    boomerangred4b.body.setCircle(160);
    boomerangred4b.pivot.x = 400;
    boomerangred4b.rotation += 3.1;

    baseboomerangred5 = game.add.sprite(2465, 608, 'baseboomeranglvl3');
    baseboomerangred5.anchor.setTo(0.5, 0.5);
    baseboomerangred5.scale.setTo(0.3, 0.3);

    boomerangred5 = game.add.sprite(2465, 608, 'boomeranglvl3');
    game.physics.enable(boomerangred5, Phaser.Physics.ARCADE);
    boomerangred5.body.enable = true;
    boomerangred5.body.immovable = true;
    boomerangred5.anchor.setTo(0.5, 0.5);
    boomerangred5.scale.setTo(0.3, 0.3);
    boomerangred5.body.setCircle(160);
    boomerangred5.pivot.x = 400;

    boomerangred5b = game.add.sprite(2465, 608, 'boomeranglvl3');
    game.physics.enable(boomerangred5b, Phaser.Physics.ARCADE);
    boomerangred5b.body.enable = true;
    boomerangred5b.body.immovable = true;
    boomerangred5b.anchor.setTo(0.5, 0.5);
    boomerangred5b.scale.setTo(0.3, 0.3);
    boomerangred5b.body.setCircle(160);
    boomerangred5b.pivot.x = 400;
    boomerangred5b.rotation += 3.1;

    weapon = game.add.weapon(30, 'bullet');
    weapon.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon.bulletLifespan = 2800;
    weapon.bulletSpeed = 300;
    weapon.fireRate = 1;

    canon = this.add.sprite(2785, 30, 'canon');
    canon.anchor.set(0.5);
    canon.angle = +90;
    game.physics.arcade.enable(canon);
    canon.body.drag.set(70);
    canon.body.maxVelocity.set(200);
    weapon.trackSprite(canon, 0, 0, true);

    weapon2 = game.add.weapon(30, 'bullet');
    weapon2.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon2.bulletLifespan = 2800;
    weapon2.bulletSpeed = 300;
    weapon2.fireRate = 1;

    canon2 = this.add.sprite(2850, 30, 'canon');
    canon2.anchor.set(0.5);
    canon2.angle = +90;
    game.physics.arcade.enable(canon2);
    canon2.body.drag.set(70);
    canon2.body.maxVelocity.set(200);
    weapon2.trackSprite(canon2, 0, 0, true);

    weapon3 = game.add.weapon(30, 'bullet');
    weapon3.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon3.bulletLifespan = 2000;
    weapon3.bulletSpeed = 300;
    weapon3.fireRate = 1;

    canon3 = this.add.sprite(2019, 1310, 'canon');
    canon3.anchor.set(0.5);
    //canon3.angle = -180;
    game.physics.arcade.enable(canon3);
    canon3.body.drag.set(70);
    canon3.body.maxVelocity.set(200);
    weapon3.trackSprite(canon3, 0, 0, true);

    weapon4 = game.add.weapon(30, 'bullet');
    weapon4.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon4.bulletLifespan = 2000;
    weapon4.bulletSpeed = 300;
    weapon4.fireRate = 1;

    canon4 = this.add.sprite(2019, 1374, 'canon');
    canon4.anchor.set(0.5);
    //canon4.angle = -90;
    game.physics.arcade.enable(canon4);
    canon4.body.drag.set(70);
    canon4.body.maxVelocity.set(200);
    weapon4.trackSprite(canon4, 0, 0, true);

    weapon5 = game.add.weapon(30, 'bullet');
    weapon5.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon5.bulletLifespan = 1800;
    weapon5.bulletSpeed = 300;
    weapon5.fireRate = 1;

    canon5 = this.add.sprite(2208, 1628, 'canon');
    canon5.anchor.set(0.5);
    canon5.angle = -180;
    game.physics.arcade.enable(canon5);
    canon5.body.drag.set(70);
    canon5.body.maxVelocity.set(200);
    weapon5.trackSprite(canon5, 0, 0, true);

    game.time.events.loop(Phaser.Timer.SECOND, this.fire, this);

    musiconoff = game.add.button(330, 60, 'musiconoff', this.musicoffon, this, 1, 0);
    musiconoff.anchor.setTo(0.5, 0.5);
    musiconoff.scale.setTo(0.8, 0.8);
    musiconoff.fixedToCamera = true;
  },
  update: function(){
    sprite.rotation = game.physics.arcade.moveToPointer(sprite, 60, game.input.activePointer, 500);

    game.physics.arcade.collide(sprite, layer);
    game.physics.arcade.collide(sprite, portalwin, this.win);
    game.physics.arcade.collide(sprite, portalwinb, function(){sprite.x = 1939;
    sprite.y = 2969;});
    game.physics.arcade.collide(sprite, portalwinc, function(){sprite.x = 1405;
    sprite.y = 960;});
    game.physics.arcade.collide(sprite, portalwind, function(){sprite.x = 3034;
    sprite.y = 194;});
    game.physics.arcade.collide(sprite, portalwine, function(){sprite.x = 137;
    sprite.y = 685;});
    game.physics.arcade.collide(sprite, portalwinf, function(){sprite.x = 1400;
    sprite.y = 1720;});
    game.physics.arcade.collide(sprite, portalwing, function(){sprite.x = 2886;
    sprite.y = 2782;});
    game.physics.arcade.collide(sprite, portalwinh, function(){sprite.x = 2014;
    sprite.y = 2405;});
    game.physics.arcade.collide(sprite, bolapuas, this.dead);
    game.physics.arcade.collide(sprite, aplastador, this.dead);
    game.physics.arcade.collide(sprite, sierra, this.dead);
    game.physics.arcade.collide(sprite, sierra2, this.dead);
    game.physics.arcade.collide(sprite, sierra3, this.dead);
    game.physics.arcade.collide(sprite, cubo3x3, this.dead);
    game.physics.arcade.collide(sprite, cubo3x3b, this.dead);
    game.physics.arcade.collide(sprite, cubo3x3c, this.dead);
    game.physics.arcade.collide(sprite, boomerang, this.dead);
    game.physics.arcade.collide(sprite, boomerang1, this.dead);
    game.physics.arcade.collide(sprite, boomerang2, this.dead);
    game.physics.arcade.collide(sprite, boomerang3, this.dead);
    game.physics.arcade.collide(sprite, boomerang4, this.dead);
    game.physics.arcade.collide(sprite, boomerangred, this.dead);
    game.physics.arcade.collide(sprite, boomerangredb, this.dead);
    game.physics.arcade.collide(sprite, boomerangred2, this.dead);
    game.physics.arcade.collide(sprite, boomerangred2b, this.dead);
    game.physics.arcade.collide(sprite, boomerangred3, this.dead);
    game.physics.arcade.collide(sprite, boomerangred3b, this.dead);
    game.physics.arcade.collide(sprite, boomerangred4, this.dead);
    game.physics.arcade.collide(sprite, boomerangred4b, this.dead);
    game.physics.arcade.collide(sprite, boomerangred5, this.dead);
    game.physics.arcade.collide(sprite, boomerangred5b, this.dead);
    game.physics.arcade.collide(sprite, weapon.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon2.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon3.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon4.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon5.bullets,this.dead);

    boomerang.rotation += 0.05;
    sierra.rotation -= 0.08;
    sierra2.rotation -= 0.08;
    sierra3.rotation -= 0.08;
    boomerang1.rotation -= 0.05;
    boomerang2.rotation += 0.05;
    boomerang3.rotation -= 0.05;
    boomerang4.rotation += 0.05;
    boomerangred.rotation -= 0.05;
    boomerangredb.rotation -= 0.05;
    boomerangred2.rotation += 0.04;
    boomerangred2b.rotation += 0.04;
    boomerangred3.rotation += 0.05;
    boomerangred3b.rotation += 0.05;
    boomerangred4.rotation -= 0.05;
    boomerangred4b.rotation -= 0.05;
    boomerangred5.rotation += 0.05;
    boomerangred5b.rotation += 0.05;




  },

  render: function(){
      //game.debug.pointer( game.input.activePointer );
      //game.debug.body(sprite);
  },

  fire: function(){

  weapon.fire();
  weapon2.fire();
  weapon3.fire();
  weapon4.fire();
  weapon5.fire();



  },

dead: function(){

sprite.x = 254;
sprite.y = 2783;


},
win: function(){

  whitelvl.stop();
  finallvl.play();
  nivel = 29;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
game.state.start('Nivel29');

},

musicoffon: function(){

if (sonando == true){
  sonando = false;

  musiconoff.setFrames(1,0);
  musiconoff.frame = 0;
  whitelvl.stop();
}else{


  musiconoff.setFrames(0,1);
  musiconoff.frame = 1;
  whitelvl.play();
  sonando = true;
};


}

};

function handleIncorrect(){
     	if(!game.device.desktop){
     		document.getElementById("turn").style.display="block";
     	}
	}

	function handleCorrect(){
		if(!game.device.desktop){
			if(firstRunLandscape){
				gameRatio = window.innerWidth/window.innerHeight;
				game.width = window.innerWidth;
				game.height = window.innerHeight;
				game.renderer.resize(game.width,game.height);
				game.scale.refresh();
			}
			document.getElementById("turn").style.display="none";
		}
	}
