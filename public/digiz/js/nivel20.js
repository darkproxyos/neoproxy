var sprite;
var Nivel20 = {
  preload: function(){
    game.stage.backgroundColor = '#000000';
    game.load.image('fondo', 'assets/map/fondolvl4.png');
    game.load.spritesheet('portalwin', 'assets/sprites/portalwin.png', 64, 64, 8);
    game.load.image('arrow', 'assets/sprites/arrow.png');
    game.load.image('bolapuas', 'assets/sprites/bolapuaslvl4.png');
    game.load.image('baseboomerang', 'assets/sprites/baseboomeranglvl4.png');
    game.load.image('boomerang', 'assets/sprites/boomeranglvl4.png');
    game.load.image('sierra', 'assets/sprites/sierralvl4.png');
    game.load.image('aplastador', 'assets/sprites/aplastadorlvl4.png');
    game.load.image('bullet', 'assets/sprites/lazer.png');
    game.load.image('canon', 'assets/sprites/canon.png');
    game.load.tilemap('map','assets/map/nivel20.csv');
    game.load.image('tileset','assets/map/tilenivel4.png');
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

    if(purplelvl.isPlaying == false){
          purplelvl.play();
    };

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.add.tileSprite(0, 0, 2560, 1920, 'fondo');

    portalwin = game.add.sprite(1983, 831, 'portalwin');
    game.physics.enable(portalwin, Phaser.Physics.ARCADE);
    var portalanim = portalwin.animations.add('portalanim');
    portalwin.animations.play('portalanim', 30, true);
    portalwin.body.enable = true;
    portalwin.anchor.setTo(0.5);

   sprite = game.add.sprite(2430, 1815, 'arrow');
   game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.collideWorldBounds = true;
    sprite.body.enable = true;
    sprite.scale.setTo(1.3, 1.3);
    game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.setSize(18, 18, +13,+1);
    sprite.body.setCircle(16);
    sprite.anchor.setTo(0.5);
    sprite.body.allowRotation = true;

    aplastador = game.add.sprite(1790, 1704, 'aplastador');
    game.physics.enable(aplastador, Phaser.Physics.ARCADE);
    aplastador.body.enable = true;
    aplastador.body.immovable = true;
    aplastador.anchor.setTo(0.5, 0.5);
    aplastador.scale.setTo(0.4, 0.4);
    tween = game.add.tween(aplastador).to({ y: 1823 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
    tween.repeatDelay(1000);

    aplastador2 = game.add.sprite(978, 511, 'aplastador');
    game.physics.enable(aplastador2, Phaser.Physics.ARCADE);
    aplastador2.body.enable = true;
    aplastador2.body.immovable = true;
    aplastador2.anchor.setTo(0.5, 0.5);
    aplastador2.scale.setTo(0.4, 0.4);
    aplastador2.angle += 90;
    tween2 = game.add.tween(aplastador2).to({ x: 859 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
    tween2.repeatDelay(1000);

    aplastador3 = game.add.sprite(1793, 740, 'aplastador');
    game.physics.enable(aplastador3, Phaser.Physics.ARCADE);
    aplastador3.body.enable = true;
    aplastador3.body.immovable = true;
    aplastador3.anchor.setTo(0.5, 0.5);
    aplastador3.scale.setTo(0.4, 0.4);
    tween3 = game.add.tween(aplastador3).to({ y: 866 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
    tween3.repeatDelay(1000);

    sierra = game.add.sprite(126, 383, 'sierra');
    game.physics.enable(sierra, Phaser.Physics.ARCADE);
    sierra.body.enable = true;
    sierra.body.immovable = true;
    sierra.anchor.setTo(0.5, 0.5);
    sierra.scale.setTo(0.3, 0.3);
    sierra.body.setCircle(185);
    tween = game.add.tween(sierra).to({ y: 830 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    sierra2 = game.add.sprite(577, 830, 'sierra');
    game.physics.enable(sierra2, Phaser.Physics.ARCADE);
    sierra2.body.enable = true;
    sierra2.body.immovable = true;
    sierra2.anchor.setTo(0.5, 0.5);
    sierra2.scale.setTo(0.3, 0.3);
    sierra2.body.setCircle(185);
    tween2 = game.add.tween(sierra2).to({ y: 319 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);




    map = game.add.tilemap('map', 64, 64);

    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,110);
    map.setTileIndexCallback(0, this.dead, this);
    map.setTileIndexCallback(1, this.win, this);
    map.setCollision(16);

    layer = map.createLayer(0);

    layer.resizeWorld();

    game.camera.follow(sprite);

    baseboomerang = game.add.sprite(1343, 1566, 'baseboomerang');
    baseboomerang.anchor.setTo(0.5, 0.5);
    baseboomerang.scale.setTo(0.3, 0.3);

    boomerang = game.add.sprite(1343, 1566, 'boomerang');
    game.physics.enable(boomerang, Phaser.Physics.ARCADE);
    boomerang.body.enable = true;
    boomerang.body.immovable = true;
    boomerang.anchor.setTo(0.5, 0.5);
    boomerang.scale.setTo(0.3, 0.3);
    boomerang.body.setCircle(160);
    boomerang.pivot.x = 400;

    boomerangb = game.add.sprite(1343, 1566, 'boomerang');
    game.physics.enable(boomerangb, Phaser.Physics.ARCADE);
    boomerangb.body.enable = true;
    boomerangb.body.immovable = true;
    boomerangb.anchor.setTo(0.5, 0.5);
    boomerangb.scale.setTo(0.3, 0.3);
    boomerangb.body.setCircle(160);
    boomerangb.pivot.x = 400;
    boomerangb.rotation += 3.1;

    baseboomerang2 = game.add.sprite(1725, 1243, 'baseboomerang');
    baseboomerang2.anchor.setTo(0.5, 0.5);
    baseboomerang2.scale.setTo(0.3, 0.3);

    boomerang2 = game.add.sprite(1725, 1243, 'boomerang');
    game.physics.enable(boomerang2, Phaser.Physics.ARCADE);
    boomerang2.body.enable = true;
    boomerang2.body.immovable = true;
    boomerang2.anchor.setTo(0.5, 0.5);
    boomerang2.scale.setTo(0.3, 0.3);
    boomerang2.body.setCircle(160);
    boomerang2.pivot.x = 400;

    boomerang2b = game.add.sprite(1725, 1243, 'boomerang');
    game.physics.enable(boomerang2b, Phaser.Physics.ARCADE);
    boomerang2b.body.enable = true;
    boomerang2b.body.immovable = true;
    boomerang2b.anchor.setTo(0.5, 0.5);
    boomerang2b.scale.setTo(0.3, 0.3);
    boomerang2b.body.setCircle(160);
    boomerang2b.pivot.x = 400;
    boomerang2b.rotation += 3.1;

    baseboomerang3 = game.add.sprite(382, 288, 'baseboomerang');
    baseboomerang3.anchor.setTo(0.5, 0.5);
    baseboomerang3.scale.setTo(0.3, 0.3);

    boomerang3 = game.add.sprite(382, 288, 'boomerang');
    game.physics.enable(boomerang3, Phaser.Physics.ARCADE);
    boomerang3.body.enable = true;
    boomerang3.body.immovable = true;
    boomerang3.anchor.setTo(0.5, 0.5);
    boomerang3.scale.setTo(0.3, 0.3);
    boomerang3.body.setCircle(160);
    boomerang3.pivot.x = 400;

    boomerang3b = game.add.sprite(382, 288, 'boomerang');
    game.physics.enable(boomerang3b, Phaser.Physics.ARCADE);
    boomerang3b.body.enable = true;
    boomerang3b.body.immovable = true;
    boomerang3b.anchor.setTo(0.5, 0.5);
    boomerang3b.scale.setTo(0.3, 0.3);
    boomerang3b.body.setCircle(160);
    boomerang3b.pivot.x = 400;
    boomerang3b.rotation += 3.1;

    baseboomerang4 = game.add.sprite(800, 1442, 'baseboomerang');
    baseboomerang4.anchor.setTo(0.5, 0.5);
    baseboomerang4.scale.setTo(0.3, 0.3);

    boomerang4 = game.add.sprite(800, 1442, 'boomerang');
    game.physics.enable(boomerang4, Phaser.Physics.ARCADE);
    boomerang4.body.enable = true;
    boomerang4.body.immovable = true;
    boomerang4.anchor.setTo(0.5, 0.5);
    boomerang4.scale.setTo(0.3, 0.3);
    boomerang4.body.setCircle(160);
    boomerang4.pivot.x = 400;

    boomerang4b = game.add.sprite(800, 1442, 'boomerang');
    game.physics.enable(boomerang4b, Phaser.Physics.ARCADE);
    boomerang4b.body.enable = true;
    boomerang4b.body.immovable = true;
    boomerang4b.anchor.setTo(0.5, 0.5);
    boomerang4b.scale.setTo(0.3, 0.3);
    boomerang4b.body.setCircle(160);
    boomerang4b.pivot.x = 400;
    boomerang4b.rotation += 3.1;

    baseboomerang5 = game.add.sprite(1120, 1087, 'baseboomerang');
    baseboomerang5.anchor.setTo(0.5, 0.5);
    baseboomerang5.scale.setTo(0.3, 0.3);

    boomerang5 = game.add.sprite(1120, 1087, 'boomerang');
    game.physics.enable(boomerang5, Phaser.Physics.ARCADE);
    boomerang5.body.enable = true;
    boomerang5.body.immovable = true;
    boomerang5.anchor.setTo(0.5, 0.5);
    boomerang5.scale.setTo(0.3, 0.3);
    boomerang5.body.setCircle(160);
    boomerang5.pivot.x = 400;

    boomerang5b = game.add.sprite(1120, 1087, 'boomerang');
    game.physics.enable(boomerang5b, Phaser.Physics.ARCADE);
    boomerang5b.body.enable = true;
    boomerang5b.body.immovable = true;
    boomerang5b.anchor.setTo(0.5, 0.5);
    boomerang5b.scale.setTo(0.3, 0.3);
    boomerang5b.body.setCircle(160);
    boomerang5b.pivot.x = 400;
    boomerang5b.rotation += 3.1;

    baseboomerang6 = game.add.sprite(2273, 226, 'baseboomerang');
    baseboomerang6.anchor.setTo(0.5, 0.5);
    baseboomerang6.scale.setTo(0.3, 0.3);

    boomerang6 = game.add.sprite(2273, 226, 'boomerang');
    game.physics.enable(boomerang6, Phaser.Physics.ARCADE);
    boomerang6.body.enable = true;
    boomerang6.body.immovable = true;
    boomerang6.anchor.setTo(0.5, 0.5);
    boomerang6.scale.setTo(0.3, 0.3);
    boomerang6.body.setCircle(160);
    boomerang6.pivot.x = 400;

    boomerang6b = game.add.sprite(2273, 226, 'boomerang');
    game.physics.enable(boomerang6b, Phaser.Physics.ARCADE);
    boomerang6b.body.enable = true;
    boomerang6b.body.immovable = true;
    boomerang6b.anchor.setTo(0.5, 0.5);
    boomerang6b.scale.setTo(0.3, 0.3);
    boomerang6b.body.setCircle(160);
    boomerang6b.pivot.x = 400;
    boomerang6b.rotation += 3.1;

    baseboomerang7 = game.add.sprite(2017, 225, 'baseboomerang');
    baseboomerang7.anchor.setTo(0.5, 0.5);
    baseboomerang7.scale.setTo(0.3, 0.3);

    boomerang7 = game.add.sprite(2017, 225, 'boomerang');
    game.physics.enable(boomerang7, Phaser.Physics.ARCADE);
    boomerang7.body.enable = true;
    boomerang7.body.immovable = true;
    boomerang7.anchor.setTo(0.5, 0.5);
    boomerang7.scale.setTo(0.3, 0.3);
    boomerang7.body.setCircle(160);
    boomerang7.pivot.x = 400;

    boomerang7b = game.add.sprite(2017, 225, 'boomerang');
    game.physics.enable(boomerang7b, Phaser.Physics.ARCADE);
    boomerang7b.body.enable = true;
    boomerang7b.body.immovable = true;
    boomerang7b.anchor.setTo(0.5, 0.5);
    boomerang7b.scale.setTo(0.3, 0.3);
    boomerang7b.body.setCircle(160);
    boomerang7b.pivot.x = 400;
    boomerang7b.rotation += 3.1;

    weapon = game.add.weapon(30, 'bullet');
    weapon.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon.bulletLifespan = 1600;
    weapon.bulletSpeed = 600;
    weapon.fireRate = 1;

    canon = this.add.sprite(2465, 1117, 'canon');
    canon.anchor.set(0.5);
    canon.angle = -90;
    game.physics.arcade.enable(canon);
    canon.body.drag.set(70);
    canon.body.maxVelocity.set(200);
    weapon.trackSprite(canon, 0, 0, true);

    weapon2 = game.add.weapon(30, 'bullet');
    weapon2.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon2.bulletLifespan = 1300;
    weapon2.bulletSpeed = 600;
    weapon2.fireRate = 1;

    canon2 = this.add.sprite(1887, 97, 'canon');
    canon2.anchor.set(0.5);
    canon2.angle = -180;
    game.physics.arcade.enable(canon2);
    canon2.body.drag.set(70);
    canon2.body.maxVelocity.set(200);
    weapon2.trackSprite(canon2, 0, 0, true);

    weapon3 = game.add.weapon(30, 'bullet');
    weapon3.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon3.bulletLifespan = 1100;
    weapon3.bulletSpeed = 600;
    weapon3.fireRate = 1;

    canon3 = this.add.sprite(159, 927, 'canon');
    canon3.anchor.set(0.5);
    canon3.angle = -90;
    game.physics.arcade.enable(canon3);
    canon3.body.drag.set(70);
    canon3.body.maxVelocity.set(200);
    weapon3.trackSprite(canon3, 0, 0, true);

    weapon4 = game.add.weapon(30, 'bullet');
    weapon4.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon4.bulletLifespan = 1800;
    weapon4.bulletSpeed = 600;
    weapon4.fireRate = 1;

    canon4 = this.add.sprite(607, 227, 'canon');
    canon4.anchor.set(0.5);
    canon4.angle = +90;
    game.physics.arcade.enable(canon4);
    canon4.body.drag.set(70);
    canon4.body.maxVelocity.set(200);
    weapon4.trackSprite(canon4, 0, 0, true);

    weapon5 = game.add.weapon(30, 'bullet');
    weapon5.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon5.bulletLifespan = 800;
    weapon5.bulletSpeed = 600;
    weapon5.fireRate = 1;

    canon5 = this.add.sprite(672, 1120, 'canon');
    canon5.anchor.set(0.5);
    canon5.angle = +90;
    game.physics.arcade.enable(canon5);
    canon5.body.drag.set(70);
    canon5.body.maxVelocity.set(200);
    weapon5.trackSprite(canon5, 0, 0, true);

    weapon6 = game.add.weapon(30, 'bullet');
    weapon6.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon6.bulletLifespan = 1600;
    weapon6.bulletSpeed = 600;
    weapon6.fireRate = 1;

    canon6 = this.add.sprite(802, 349, 'canon');
    canon6.anchor.set(0.5);
    //canon6.angle = -180;
    game.physics.arcade.enable(canon6);
    canon6.body.drag.set(70);
    canon6.body.maxVelocity.set(200);
    weapon6.trackSprite(canon6, 0, 0, true);

    weapon7 = game.add.weapon(30, 'bullet');
    weapon7.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon7.bulletLifespan = 1100;
    weapon7.bulletSpeed = 600;
    weapon7.fireRate = 1;

    canon7 = this.add.sprite(1635, 224, 'canon');
    canon7.anchor.set(0.5);
    canon7.angle = +90;
    game.physics.arcade.enable(canon7);
    canon7.body.drag.set(70);
    canon7.body.maxVelocity.set(200);
    weapon7.trackSprite(canon7, 0, 0, true);

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
    game.physics.arcade.collide(sprite, aplastador, this.dead);
    game.physics.arcade.collide(sprite, aplastador2, this.dead);
    game.physics.arcade.collide(sprite, aplastador3, this.dead);
    game.physics.arcade.collide(sprite, sierra, this.dead);
    game.physics.arcade.collide(sprite, sierra2, this.dead);
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
    game.physics.arcade.collide(sprite, weapon.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon2.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon3.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon4.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon5.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon6.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon7.bullets,this.dead);
    sierra.rotation -= 0.08;
    sierra2.rotation -= 0.08;
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
    boomerang6.rotation -= 0.05;
    boomerang6b.rotation -= 0.05;
    boomerang7.rotation += 0.05;
    boomerang7b.rotation += 0.05;

  },

  render: function(){
      //game.debug.pointer( game.input.activePointer );

  },
  fire: function(){

  weapon.fire();
  weapon2.fire();
  weapon3.fire();
  weapon4.fire();
  weapon5.fire();
  weapon6.fire();
  weapon7.fire();



  },

dead: function(){

sprite.x = 2430;
sprite.y = 1815;


},
win: function(){
  nivel = 21;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
game.state.start('Nivel21')

},

musicoffon: function(){

if (sonando == true){
  sonando = false;

  musiconoff.setFrames(1,0);
  musiconoff.frame = 0;
  purplelvl.stop();
}else{


  musiconoff.setFrames(0,1);
  musiconoff.frame = 1;
  purplelvl.play();
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
