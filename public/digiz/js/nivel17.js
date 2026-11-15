var sprite;
var Nivel17 = {
  preload: function(){
    game.stage.backgroundColor = '#000000';
    game.load.image('fondo', 'assets/map/fondolvl3.png');
    game.load.spritesheet('portalwin', 'assets/sprites/portalwin.png', 64, 64, 8);
    game.load.image('arrow', 'assets/sprites/arrow.png');
    game.load.image('bolapuas', 'assets/sprites/bolapuaslvl3.png');
    game.load.image('baseboomerang', 'assets/sprites/baseboomeranglvl3.png');
    game.load.image('boomerang', 'assets/sprites/boomeranglvl3.png');
    game.load.image('sierra', 'assets/sprites/sierralvl3.png');
    game.load.image('aplastador', 'assets/sprites/aplastador.png');
    game.load.tilemap('map','assets/map/nivel17.csv');
    game.load.image('tileset','assets/map/tilenivel3.png');
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

    if(redlvl.isPlaying == false){
          redlvl.play();
    };

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.add.tileSprite(0, 0, 2240, 1600, 'fondo');

    portalwin = game.add.sprite(1665, 767, 'portalwin');
    game.physics.enable(portalwin, Phaser.Physics.ARCADE);
    var portalanim = portalwin.animations.add('portalanim');
    portalwin.animations.play('portalanim', 30, true);
    portalwin.body.enable = true;
    portalwin.anchor.setTo(0.5);

  sprite = game.add.sprite(2111, 128, 'arrow');
  game.physics.enable(sprite, Phaser.Physics.ARCADE);
   sprite.body.collideWorldBounds = true;
   sprite.body.enable = true;
   sprite.scale.setTo(1.3, 1.3);
   game.physics.enable(sprite, Phaser.Physics.ARCADE);
   sprite.body.setSize(18, 18, +13,+1);
   sprite.body.setCircle(16);
   sprite.anchor.setTo(0.5);
   sprite.body.allowRotation = true;

   aplastador = game.add.sprite(1216, 60, 'aplastador');
   game.physics.enable(aplastador, Phaser.Physics.ARCADE);
   aplastador.body.enable = true;
   aplastador.body.immovable = true;
   aplastador.anchor.setTo(0.5, 0.5);
   aplastador.scale.setTo(0.4, 0.4);
   tween = game.add.tween(aplastador).to({ y: 157 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween.repeatDelay(1000);

   aplastador2 = game.add.sprite(318, 1388, 'aplastador');
   game.physics.enable(aplastador2, Phaser.Physics.ARCADE);
   aplastador2.body.enable = true;
   aplastador2.body.immovable = true;
   aplastador2.anchor.setTo(0.5, 0.5);
   aplastador2.scale.setTo(0.4, 0.4);
   tween2 = game.add.tween(aplastador2).to({ y: 1503 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween2.repeatDelay(1000);

   aplastador3 = game.add.sprite(1920, 480, 'aplastador');
   game.physics.enable(aplastador3, Phaser.Physics.ARCADE);
   aplastador3.body.enable = true;
   aplastador3.body.immovable = true;
   aplastador3.anchor.setTo(0.5, 0.5);
   aplastador3.scale.setTo(0.4, 0.4);
   tween3 = game.add.tween(aplastador3).to({ y: 603 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween3.repeatDelay(1000);

   aplastador4 = game.add.sprite(927, 1342, 'aplastador');
   game.physics.enable(aplastador4, Phaser.Physics.ARCADE);
   aplastador4.body.enable = true;
   aplastador4.body.immovable = true;
   aplastador4.anchor.setTo(0.5, 0.5);
   aplastador4.scale.setTo(0.4, 0.4);
   aplastador4.angle += 90;
   tween4 = game.add.tween(aplastador4).to({ x: 1059 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween4.repeatDelay(1000);

   sierra = game.add.sprite(769, 512, 'sierra');
   game.physics.enable(sierra, Phaser.Physics.ARCADE);
   sierra.body.enable = true;
   sierra.body.immovable = true;
   sierra.anchor.setTo(0.5, 0.5);
   sierra.scale.setTo(0.3, 0.3);
   sierra.body.setCircle(185);
   tween = game.add.tween(sierra).to({ x: 1344 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);



    map = game.add.tilemap('map', 64, 64);

    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,110);
    map.setTileIndexCallback(0, this.dead, this);
    map.setTileIndexCallback(1, this.win, this);
    map.setCollision(16);

    layer = map.createLayer(0);

    layer.resizeWorld();

    game.camera.follow(sprite);

    baseboomerang = game.add.sprite(1631, 160, 'baseboomerang');
    baseboomerang.anchor.setTo(0.5, 0.5);
    baseboomerang.scale.setTo(0.3, 0.3);

    boomerang = game.add.sprite(1631, 160, 'boomerang');
    game.physics.enable(boomerang, Phaser.Physics.ARCADE);
    boomerang.body.enable = true;
    boomerang.body.immovable = true;
    boomerang.anchor.setTo(0.5, 0.5);
    boomerang.scale.setTo(0.3, 0.3);
    boomerang.body.setCircle(160);
    boomerang.pivot.x = 400;

    boomerangb = game.add.sprite(1631, 160, 'boomerang');
    game.physics.enable(boomerangb, Phaser.Physics.ARCADE);
    boomerangb.body.enable = true;
    boomerangb.body.immovable = true;
    boomerangb.anchor.setTo(0.5, 0.5);
    boomerangb.scale.setTo(0.3, 0.3);
    boomerangb.body.setCircle(160);
    boomerangb.pivot.x = 400;
    boomerangb.rotation += 3.1;

    baseboomerang2 = game.add.sprite(1375, 97, 'baseboomerang');
    baseboomerang2.anchor.setTo(0.5, 0.5);
    baseboomerang2.scale.setTo(0.3, 0.3);

    boomerang2 = game.add.sprite(1375, 97, 'boomerang');
    game.physics.enable(boomerang2, Phaser.Physics.ARCADE);
    boomerang2.body.enable = true;
    boomerang2.body.immovable = true;
    boomerang2.anchor.setTo(0.5, 0.5);
    boomerang2.scale.setTo(0.3, 0.3);
    boomerang2.body.setCircle(160);
    boomerang2.pivot.x = 400;

    boomerang2b = game.add.sprite(1375, 97, 'boomerang');
    game.physics.enable(boomerang2b, Phaser.Physics.ARCADE);
    boomerang2b.body.enable = true;
    boomerang2b.body.immovable = true;
    boomerang2b.anchor.setTo(0.5, 0.5);
    boomerang2b.scale.setTo(0.3, 0.3);
    boomerang2b.body.setCircle(160);
    boomerang2b.pivot.x = 400;
    boomerang2b.rotation += 3.1;

    baseboomerang3 = game.add.sprite(927, 224, 'baseboomerang');
    baseboomerang3.anchor.setTo(0.5, 0.5);
    baseboomerang3.scale.setTo(0.3, 0.3);

    boomerang3 = game.add.sprite(927, 224, 'boomerang');
    game.physics.enable(boomerang3, Phaser.Physics.ARCADE);
    boomerang3.body.enable = true;
    boomerang3.body.immovable = true;
    boomerang3.anchor.setTo(0.5, 0.5);
    boomerang3.scale.setTo(0.3, 0.3);
    boomerang3.body.setCircle(160);
    boomerang3.pivot.x = 400;

    boomerang3b = game.add.sprite(927, 224, 'boomerang');
    game.physics.enable(boomerang3b, Phaser.Physics.ARCADE);
    boomerang3b.body.enable = true;
    boomerang3b.body.immovable = true;
    boomerang3b.anchor.setTo(0.5, 0.5);
    boomerang3b.scale.setTo(0.3, 0.3);
    boomerang3b.body.setCircle(160);
    boomerang3b.pivot.x = 400;
    boomerang3b.rotation += 3.1;

    baseboomerang4 = game.add.sprite(671, 225, 'baseboomerang');
    baseboomerang4.anchor.setTo(0.5, 0.5);
    baseboomerang4.scale.setTo(0.3, 0.3);

    boomerang4 = game.add.sprite(671, 225, 'boomerang');
    game.physics.enable(boomerang4, Phaser.Physics.ARCADE);
    boomerang4.body.enable = true;
    boomerang4.body.immovable = true;
    boomerang4.anchor.setTo(0.5, 0.5);
    boomerang4.scale.setTo(0.3, 0.3);
    boomerang4.body.setCircle(160);
    boomerang4.pivot.x = 400;

    boomerang4b = game.add.sprite(671, 225, 'boomerang');
    game.physics.enable(boomerang4b, Phaser.Physics.ARCADE);
    boomerang4b.body.enable = true;
    boomerang4b.body.immovable = true;
    boomerang4b.anchor.setTo(0.5, 0.5);
    boomerang4b.scale.setTo(0.3, 0.3);
    boomerang4b.body.setCircle(160);
    boomerang4b.pivot.x = 400;
    boomerang4b.rotation += 3.1;

    baseboomerang5 = game.add.sprite(159, 926, 'baseboomerang');
    baseboomerang5.anchor.setTo(0.5, 0.5);
    baseboomerang5.scale.setTo(0.3, 0.3);

    boomerang5 = game.add.sprite(159, 926, 'boomerang');
    game.physics.enable(boomerang5, Phaser.Physics.ARCADE);
    boomerang5.body.enable = true;
    boomerang5.body.immovable = true;
    boomerang5.anchor.setTo(0.5, 0.5);
    boomerang5.scale.setTo(0.3, 0.3);
    boomerang5.body.setCircle(160);
    boomerang5.pivot.x = 400;

    boomerang5b = game.add.sprite(159, 926, 'boomerang');
    game.physics.enable(boomerang5b, Phaser.Physics.ARCADE);
    boomerang5b.body.enable = true;
    boomerang5b.body.immovable = true;
    boomerang5b.anchor.setTo(0.5, 0.5);
    boomerang5b.scale.setTo(0.3, 0.3);
    boomerang5b.body.setCircle(160);
    boomerang5b.pivot.x = 400;
    boomerang5b.rotation += 3.1;

    baseboomerang6 = game.add.sprite(96, 1186, 'baseboomerang');
    baseboomerang6.anchor.setTo(0.5, 0.5);
    baseboomerang6.scale.setTo(0.3, 0.3);

    boomerang6 = game.add.sprite(96, 1186, 'boomerang');
    game.physics.enable(boomerang6, Phaser.Physics.ARCADE);
    boomerang6.body.enable = true;
    boomerang6.body.immovable = true;
    boomerang6.anchor.setTo(0.5, 0.5);
    boomerang6.scale.setTo(0.3, 0.3);
    boomerang6.body.setCircle(160);
    boomerang6.pivot.x = 400;

    boomerang6b = game.add.sprite(96, 1186, 'boomerang');
    game.physics.enable(boomerang6b, Phaser.Physics.ARCADE);
    boomerang6b.body.enable = true;
    boomerang6b.body.immovable = true;
    boomerang6b.anchor.setTo(0.5, 0.5);
    boomerang6b.scale.setTo(0.3, 0.3);
    boomerang6b.body.setCircle(160);
    boomerang6b.pivot.x = 400;
    boomerang6b.rotation += 3.1;

    baseboomerang7 = game.add.sprite(157, 1376, 'baseboomerang');
    baseboomerang7.anchor.setTo(0.5, 0.5);
    baseboomerang7.scale.setTo(0.3, 0.3);

    boomerang7 = game.add.sprite(157, 1376, 'boomerang');
    game.physics.enable(boomerang7, Phaser.Physics.ARCADE);
    boomerang7.body.enable = true;
    boomerang7.body.immovable = true;
    boomerang7.anchor.setTo(0.5, 0.5);
    boomerang7.scale.setTo(0.3, 0.3);
    boomerang7.body.setCircle(160);
    boomerang7.pivot.x = 400;

    boomerang7b = game.add.sprite(157, 1376, 'boomerang');
    game.physics.enable(boomerang7b, Phaser.Physics.ARCADE);
    boomerang7b.body.enable = true;
    boomerang7b.body.immovable = true;
    boomerang7b.anchor.setTo(0.5, 0.5);
    boomerang7b.scale.setTo(0.3, 0.3);
    boomerang7b.body.setCircle(160);
    boomerang7b.pivot.x = 400;
    boomerang7b.rotation += 3.1;

    baseboomerang8 = game.add.sprite(608, 1120, 'baseboomerang');
    baseboomerang8.anchor.setTo(0.5, 0.5);
    baseboomerang8.scale.setTo(0.3, 0.3);

    boomerang8 = game.add.sprite(608, 1120, 'boomerang');
    game.physics.enable(boomerang8, Phaser.Physics.ARCADE);
    boomerang8.body.enable = true;
    boomerang8.body.immovable = true;
    boomerang8.anchor.setTo(0.5, 0.5);
    boomerang8.scale.setTo(0.3, 0.3);
    boomerang8.body.setCircle(160);
    boomerang8.pivot.x = 400;

    boomerang8b = game.add.sprite(608, 1120, 'boomerang');
    game.physics.enable(boomerang8b, Phaser.Physics.ARCADE);
    boomerang8b.body.enable = true;
    boomerang8b.body.immovable = true;
    boomerang8b.anchor.setTo(0.5, 0.5);
    boomerang8b.scale.setTo(0.3, 0.3);
    boomerang8b.body.setCircle(160);
    boomerang8b.pivot.x = 400;
    boomerang8b.rotation += 3.1;

    baseboomerang9 = game.add.sprite(478, 707, 'baseboomerang');
    baseboomerang9.anchor.setTo(0.5, 0.5);
    baseboomerang9.scale.setTo(0.3, 0.3);

    boomerang9 = game.add.sprite(478, 707, 'boomerang');
    game.physics.enable(boomerang9, Phaser.Physics.ARCADE);
    boomerang9.body.enable = true;
    boomerang9.body.immovable = true;
    boomerang9.anchor.setTo(0.5, 0.5);
    boomerang9.scale.setTo(0.3, 0.3);
    boomerang9.body.setCircle(160);
    boomerang9.pivot.x = 400;640

    boomerang9b = game.add.sprite(478, 707, 'boomerang');
    game.physics.enable(boomerang9b, Phaser.Physics.ARCADE);
    boomerang9b.body.enable = true;
    boomerang9b.body.immovable = true;
    boomerang9b.anchor.setTo(0.5, 0.5);
    boomerang9b.scale.setTo(0.3, 0.3);
    boomerang9b.body.setCircle(160);
    boomerang9b.pivot.x = 400;
    boomerang9b.rotation += 3.1;

    baseboomerang10 = game.add.sprite(640, 543, 'baseboomerang');
    baseboomerang10.anchor.setTo(0.5, 0.5);
    baseboomerang10.scale.setTo(0.3, 0.3);

    boomerang10 = game.add.sprite(640, 543, 'boomerang');
    game.physics.enable(boomerang10, Phaser.Physics.ARCADE);
    boomerang10.body.enable = true;
    boomerang10.body.immovable = true;
    boomerang10.anchor.setTo(0.5, 0.5);
    boomerang10.scale.setTo(0.3, 0.3);
    boomerang10.body.setCircle(160);
    boomerang10.pivot.x = 400;

    boomerang10b = game.add.sprite(640, 543, 'boomerang');
    game.physics.enable(boomerang10b, Phaser.Physics.ARCADE);
    boomerang10b.body.enable = true;
    boomerang10b.body.immovable = true;
    boomerang10b.anchor.setTo(0.5, 0.5);
    boomerang10b.scale.setTo(0.3, 0.3);
    boomerang10b.body.setCircle(160);
    boomerang10b.pivot.x = 400;
    boomerang10b.rotation += 3.1;

    baseboomerang11 = game.add.sprite(1569, 414, 'baseboomerang');
    baseboomerang11.anchor.setTo(0.5, 0.5);
    baseboomerang11.scale.setTo(0.3, 0.3);

    boomerang11 = game.add.sprite(1569, 414, 'boomerang');
    game.physics.enable(boomerang11, Phaser.Physics.ARCADE);
    boomerang11.body.enable = true;
    boomerang11.body.immovable = true;
    boomerang11.anchor.setTo(0.5, 0.5);
    boomerang11.scale.setTo(0.3, 0.3);
    boomerang11.body.setCircle(160);
    boomerang11.pivot.x = 400;

    boomerang11b = game.add.sprite(1569, 414, 'boomerang');
    game.physics.enable(boomerang11b, Phaser.Physics.ARCADE);
    boomerang11b.body.enable = true;
    boomerang11b.body.immovable = true;
    boomerang11b.anchor.setTo(0.5, 0.5);
    boomerang11b.scale.setTo(0.3, 0.3);
    boomerang11b.body.setCircle(160);
    boomerang11b.pivot.x = 400;
    boomerang11b.rotation += 3.1;

    baseboomerang12 = game.add.sprite(1951, 1055, 'baseboomerang');
    baseboomerang12.anchor.setTo(0.5, 0.5);
    baseboomerang12.scale.setTo(0.3, 0.3);

    boomerang12 = game.add.sprite(1951, 1055, 'boomerang');
    game.physics.enable(boomerang12, Phaser.Physics.ARCADE);
    boomerang12.body.enable = true;
    boomerang12.body.immovable = true;
    boomerang12.anchor.setTo(0.5, 0.5);
    boomerang12.scale.setTo(0.3, 0.3);
    boomerang12.body.setCircle(160);
    boomerang12.pivot.x = 400;

    boomerang12b = game.add.sprite(1951, 1055, 'boomerang');
    game.physics.enable(boomerang12b, Phaser.Physics.ARCADE);
    boomerang12b.body.enable = true;
    boomerang12b.body.immovable = true;
    boomerang12b.anchor.setTo(0.5, 0.5);
    boomerang12b.scale.setTo(0.3, 0.3);
    boomerang12b.body.setCircle(160);
    boomerang12b.pivot.x = 400;
    boomerang12b.rotation += 3.1;

    baseboomerang13 = game.add.sprite(2017, 1374, 'baseboomerang');
    baseboomerang13.anchor.setTo(0.5, 0.5);
    baseboomerang13.scale.setTo(0.3, 0.3);

    boomerang13 = game.add.sprite(2017, 1374, 'boomerang');
    game.physics.enable(boomerang13, Phaser.Physics.ARCADE);
    boomerang13.body.enable = true;
    boomerang13.body.immovable = true;
    boomerang13.anchor.setTo(0.5, 0.5);
    boomerang13.scale.setTo(0.3, 0.3);
    boomerang13.body.setCircle(160);
    boomerang13.pivot.x = 400;

    boomerang13b = game.add.sprite(2017, 1374, 'boomerang');
    game.physics.enable(boomerang13b, Phaser.Physics.ARCADE);
    boomerang13b.body.enable = true;
    boomerang13b.body.immovable = true;
    boomerang13b.anchor.setTo(0.5, 0.5);
    boomerang13b.scale.setTo(0.3, 0.3);
    boomerang13b.body.setCircle(160);
    boomerang13b.pivot.x = 400;
    boomerang13b.rotation += 3.1;

    baseboomerang14 = game.add.sprite(1824, 1505, 'baseboomerang');
    baseboomerang14.anchor.setTo(0.5, 0.5);
    baseboomerang14.scale.setTo(0.3, 0.3);

    boomerang14 = game.add.sprite(1824, 1505, 'boomerang');
    game.physics.enable(boomerang14, Phaser.Physics.ARCADE);
    boomerang14.body.enable = true;
    boomerang14.body.immovable = true;
    boomerang14.anchor.setTo(0.5, 0.5);
    boomerang14.scale.setTo(0.3, 0.3);
    boomerang14.body.setCircle(160);
    boomerang14.pivot.x = 400;

    boomerang14b = game.add.sprite(1824, 1505, 'boomerang');
    game.physics.enable(boomerang14b, Phaser.Physics.ARCADE);
    boomerang14b.body.enable = true;
    boomerang14b.body.immovable = true;
    boomerang14b.anchor.setTo(0.5, 0.5);
    boomerang14b.scale.setTo(0.3, 0.3);
    boomerang14b.body.setCircle(160);
    boomerang14b.pivot.x = 400;
    boomerang14b.rotation += 3.1;

    baseboomerang15 = game.add.sprite(1567, 1443, 'baseboomerang');
    baseboomerang15.anchor.setTo(0.5, 0.5);
    baseboomerang15.scale.setTo(0.3, 0.3);

    boomerang15 = game.add.sprite(1567, 1443, 'boomerang');
    game.physics.enable(boomerang15, Phaser.Physics.ARCADE);
    boomerang15.body.enable = true;
    boomerang15.body.immovable = true;
    boomerang15.anchor.setTo(0.5, 0.5);
    boomerang15.scale.setTo(0.3, 0.3);
    boomerang15.body.setCircle(160);
    boomerang15.pivot.x = 400;

    boomerang15b = game.add.sprite(1567, 1443, 'boomerang');
    game.physics.enable(boomerang15b, Phaser.Physics.ARCADE);
    boomerang15b.body.enable = true;
    boomerang15b.body.immovable = true;
    boomerang15b.anchor.setTo(0.5, 0.5);
    boomerang15b.scale.setTo(0.3, 0.3);
    boomerang15b.body.setCircle(160);
    boomerang15b.pivot.x = 400;
    boomerang15b.rotation += 3.1;

    baseboomerang16 = game.add.sprite(1312, 1500, 'baseboomerang');
    baseboomerang16.anchor.setTo(0.5, 0.5);
    baseboomerang16.scale.setTo(0.3, 0.3);

    boomerang16 = game.add.sprite(1312, 1500, 'boomerang');
    game.physics.enable(boomerang16, Phaser.Physics.ARCADE);
    boomerang16.body.enable = true;
    boomerang16.body.immovable = true;
    boomerang16.anchor.setTo(0.5, 0.5);
    boomerang16.scale.setTo(0.3, 0.3);
    boomerang16.body.setCircle(160);
    boomerang16.pivot.x = 400;

    boomerang16b = game.add.sprite(1312, 1500, 'boomerang');
    game.physics.enable(boomerang16b, Phaser.Physics.ARCADE);
    boomerang16b.body.enable = true;
    boomerang16b.body.immovable = true;
    boomerang16b.anchor.setTo(0.5, 0.5);
    boomerang16b.scale.setTo(0.3, 0.3);
    boomerang16b.body.setCircle(160);
    boomerang16b.pivot.x = 400;
    boomerang16b.rotation += 3.1;

    musiconoff = game.add.button(330, 60, 'musiconoff', this.musicoffon, this, 1, 0);
    musiconoff.anchor.setTo(0.5, 0.5);
    musiconoff.scale.setTo(0.8, 0.8);
    musiconoff.fixedToCamera = true;
  },
  update: function(){
    sprite.rotation = game.physics.arcade.moveToPointer(sprite, 60, game.input.activePointer, 500);
    game.physics.arcade.collide(sprite, layer);
    game.physics.arcade.collide(sprite, portalwin, this.win);
    game.physics.arcade.collide(sprite, aplastador, this.dead);
    game.physics.arcade.collide(sprite, aplastador2, this.dead);
    game.physics.arcade.collide(sprite, aplastador3, this.dead);
    game.physics.arcade.collide(sprite, aplastador4, this.dead);
    game.physics.arcade.collide(sprite, sierra, this.dead);
    game.physics.arcade.collide(sprite, boomerang, this.dead);
    game.physics.arcade.collide(sprite, boomerangb, this.dead);
    game.physics.arcade.collide(sprite, boomerang2, this.dead);
    game.physics.arcade.collide(sprite, boomerang2b, this.dead);
    game.physics.arcade.collide(sprite, boomerang3, this.dead);
    game.physics.arcade.collide(sprite, boomerang3b, this.dead);
    game.physics.arcade.collide(sprite, boomerang4, this.dead);
    game.physics.arcade.collide(sprite, boomerang4b, this.dead);
    game.physics.arcade.collide(sprite, boomerang5, this.dead);
    game.physics.arcade.collide(sprite, boomerang5b, this.dead);
    game.physics.arcade.collide(sprite, boomerang6, this.dead);
    game.physics.arcade.collide(sprite, boomerang6b, this.dead);
    game.physics.arcade.collide(sprite, boomerang7, this.dead);
    game.physics.arcade.collide(sprite, boomerang7b, this.dead);
    game.physics.arcade.collide(sprite, boomerang8, this.dead);
    game.physics.arcade.collide(sprite, boomerang8b, this.dead);
    game.physics.arcade.collide(sprite, boomerang9, this.dead);
    game.physics.arcade.collide(sprite, boomerang9b, this.dead);
    game.physics.arcade.collide(sprite, boomerang10, this.dead);
    game.physics.arcade.collide(sprite, boomerang10b, this.dead);
    game.physics.arcade.collide(sprite, boomerang11, this.dead);
    game.physics.arcade.collide(sprite, boomerang11b, this.dead);
    game.physics.arcade.collide(sprite, boomerang12, this.dead);
    game.physics.arcade.collide(sprite, boomerang12b, this.dead);
    game.physics.arcade.collide(sprite, boomerang13, this.dead);
    game.physics.arcade.collide(sprite, boomerang13b, this.dead);
    game.physics.arcade.collide(sprite, boomerang14, this.dead);
    game.physics.arcade.collide(sprite, boomerang14b, this.dead);
    game.physics.arcade.collide(sprite, boomerang15, this.dead);
    game.physics.arcade.collide(sprite, boomerang15b, this.dead);
    game.physics.arcade.collide(sprite, boomerang16, this.dead);
    game.physics.arcade.collide(sprite, boomerang16b, this.dead);
    sierra.rotation -= 0.08;
    boomerang.rotation -= 0.05;
    boomerangb.rotation -= 0.05;
    boomerang2.rotation += 0.05;
    boomerang2b.rotation += 0.05;
    boomerang3.rotation += 0.05;
    boomerang3b.rotation += 0.05;
    boomerang4.rotation -= 0.05;
    boomerang4b.rotation -= 0.05;
    boomerang5.rotation -= 0.05;
    boomerang5b.rotation -= 0.05;
    boomerang6.rotation += 0.05;
    boomerang6b.rotation += 0.05;
    boomerang7.rotation -= 0.05;
    boomerang7b.rotation -= 0.05;
    boomerang8.rotation -= 0.05;
    boomerang8b.rotation -= 0.05;
    boomerang9.rotation += 0.05;
    boomerang9b.rotation += 0.05;
    boomerang10.rotation += 0.05;
    boomerang10b.rotation += 0.05;
    boomerang11.rotation += 0.05;
    boomerang11b.rotation += 0.05;
    boomerang12.rotation -= 0.05;
    boomerang12b.rotation -= 0.05;
    boomerang13.rotation += 0.05;
    boomerang13b.rotation += 0.05;
    boomerang14.rotation -= 0.05;
    boomerang14b.rotation -= 0.05;
    boomerang15.rotation += 0.05;
    boomerang15b.rotation += 0.05;
    boomerang16.rotation -= 0.05;
    boomerang16b.rotation -= 0.05;

  },

  render: function(){
      //game.debug.pointer( game.input.activePointer );
  },


dead: function(){
//2115 - 110
sprite.x = 2115;
sprite.y = 110;

},
win: function(){

  nivel = 18;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
game.state.start('Nivel18')

},

musicoffon: function(){

if (sonando == true){
  sonando = false;

  musiconoff.setFrames(1,0);
  musiconoff.frame = 0;
  redlvl.stop();
}else{


  musiconoff.setFrames(0,1);
  musiconoff.frame = 1;
  redlvl.play();
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
