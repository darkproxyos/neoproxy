var sprite;
var Nivel21 = {
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
    game.load.tilemap('map','assets/map/nivel21.csv');
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

    portalwin = game.add.sprite(1535, 768, 'portalwin');
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

    aplastador = game.add.sprite(765, 235, 'aplastador');
    game.physics.enable(aplastador, Phaser.Physics.ARCADE);
    aplastador.body.enable = true;
    aplastador.body.immovable = true;
    aplastador.anchor.setTo(0.5, 0.5);
    aplastador.scale.setTo(0.4, 0.4);
    tween = game.add.tween(aplastador).to({ y: 348 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
    tween.repeatDelay(1000);

    aplastador2 = game.add.sprite(1707, 680, 'aplastador');
    game.physics.enable(aplastador2, Phaser.Physics.ARCADE);
    aplastador2.body.enable = true;
    aplastador2.body.immovable = true;
    aplastador2.anchor.setTo(0.5, 0.5);
    aplastador2.scale.setTo(0.4, 0.4);
    tween2 = game.add.tween(aplastador2).to({ y: 802 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
    tween2.repeatDelay(1000);


    map = game.add.tilemap('map', 64, 64);

    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,110);
    map.setTileIndexCallback(0, this.dead, this);
    map.setTileIndexCallback(1, this.win, this);
    map.setCollision(16);

    layer = map.createLayer(0);

    layer.resizeWorld();

    game.camera.follow(sprite);

    baseboomerang = game.add.sprite(2016, 1249, 'baseboomerang');
    baseboomerang.anchor.setTo(0.5, 0.5);
    baseboomerang.scale.setTo(0.3, 0.3);

    boomerang = game.add.sprite(2016, 1249, 'boomerang');
    game.physics.enable(boomerang, Phaser.Physics.ARCADE);
    boomerang.body.enable = true;
    boomerang.body.immovable = true;
    boomerang.anchor.setTo(0.5, 0.5);
    boomerang.scale.setTo(0.3, 0.3);
    boomerang.body.setCircle(160);
    boomerang.pivot.x = 400;

    boomerangb = game.add.sprite(2016, 1249, 'boomerang');
    game.physics.enable(boomerangb, Phaser.Physics.ARCADE);
    boomerangb.body.enable = true;
    boomerangb.body.immovable = true;
    boomerangb.anchor.setTo(0.5, 0.5);
    boomerangb.scale.setTo(0.3, 0.3);
    boomerangb.body.setCircle(160);
    boomerangb.pivot.x = 400;
    boomerangb.rotation += 3.1;

    baseboomerang2 = game.add.sprite(1631, 1694, 'baseboomerang');
    baseboomerang2.anchor.setTo(0.5, 0.5);
    baseboomerang2.scale.setTo(0.3, 0.3);

    boomerang2 = game.add.sprite(1631, 1694, 'boomerang');
    game.physics.enable(boomerang2, Phaser.Physics.ARCADE);
    boomerang2.body.enable = true;
    boomerang2.body.immovable = true;
    boomerang2.anchor.setTo(0.5, 0.5);
    boomerang2.scale.setTo(0.3, 0.3);
    boomerang2.body.setCircle(160);
    boomerang2.pivot.x = 400;

    boomerang2b = game.add.sprite(1631, 1694, 'boomerang');
    game.physics.enable(boomerang2b, Phaser.Physics.ARCADE);
    boomerang2b.body.enable = true;
    boomerang2b.body.immovable = true;
    boomerang2b.anchor.setTo(0.5, 0.5);
    boomerang2b.scale.setTo(0.3, 0.3);
    boomerang2b.body.setCircle(160);
    boomerang2b.pivot.x = 400;
    boomerang2b.rotation += 3.1;

    baseboomerang3 = game.add.sprite(1248, 992, 'baseboomerang');
    baseboomerang3.anchor.setTo(0.5, 0.5);
    baseboomerang3.scale.setTo(0.3, 0.3);

    boomerang3 = game.add.sprite(1248, 992, 'boomerang');
    game.physics.enable(boomerang3, Phaser.Physics.ARCADE);
    boomerang3.body.enable = true;
    boomerang3.body.immovable = true;
    boomerang3.anchor.setTo(0.5, 0.5);
    boomerang3.scale.setTo(0.3, 0.3);
    boomerang3.body.setCircle(160);
    boomerang3.pivot.x = 400;

    boomerang3b = game.add.sprite(1248, 992, 'boomerang');
    game.physics.enable(boomerang3b, Phaser.Physics.ARCADE);
    boomerang3b.body.enable = true;
    boomerang3b.body.immovable = true;
    boomerang3b.anchor.setTo(0.5, 0.5);
    boomerang3b.scale.setTo(0.3, 0.3);
    boomerang3b.body.setCircle(160);
    boomerang3b.pivot.x = 400;
    boomerang3b.rotation += 3.1;

    baseboomerang4 = game.add.sprite(256, 1696, 'baseboomerang');
    baseboomerang4.anchor.setTo(0.5, 0.5);
    baseboomerang4.scale.setTo(0.3, 0.3);

    boomerang4 = game.add.sprite(256, 1696, 'boomerang');
    game.physics.enable(boomerang4, Phaser.Physics.ARCADE);
    boomerang4.body.enable = true;
    boomerang4.body.immovable = true;
    boomerang4.anchor.setTo(0.5, 0.5);
    boomerang4.scale.setTo(0.3, 0.3);
    boomerang4.body.setCircle(160);
    boomerang4.pivot.x = 400;

    boomerang4b = game.add.sprite(256, 1696, 'boomerang');
    game.physics.enable(boomerang4b, Phaser.Physics.ARCADE);
    boomerang4b.body.enable = true;
    boomerang4b.body.immovable = true;
    boomerang4b.anchor.setTo(0.5, 0.5);
    boomerang4b.scale.setTo(0.3, 0.3);
    boomerang4b.body.setCircle(160);
    boomerang4b.pivot.x = 400;
    boomerang4b.rotation += 3.1;

    weapon = game.add.weapon(30, 'bullet');
    weapon.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon.bulletLifespan = 1100;
    weapon.bulletSpeed = 600;
    weapon.fireRate = 1;

    canon = this.add.sprite(2402, 1375, 'canon');
    canon.anchor.set(0.5);
    canon.angle = -90;
    game.physics.arcade.enable(canon);
    canon.body.drag.set(70);
    canon.body.maxVelocity.set(200);
    weapon.trackSprite(canon, 0, 0, true);

    weapon2 = game.add.weapon(30, 'bullet');
    weapon2.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon2.bulletLifespan = 1400;
    weapon2.bulletSpeed = 600;
    weapon2.fireRate = 1;

    canon2 = this.add.sprite(2465, 927, 'canon');
    canon2.anchor.set(0.5);
    canon2.angle = -90;
    game.physics.arcade.enable(canon2);
    canon2.body.drag.set(70);
    canon2.body.maxVelocity.set(200);
    weapon2.trackSprite(canon2, 0, 0, true);

    weapon3 = game.add.weapon(30, 'bullet');
    weapon3.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon3.bulletLifespan = 1200;
    weapon3.bulletSpeed = 600;
    weapon3.fireRate = 1;

    canon3 = this.add.sprite(2079, 96, 'canon');
    canon3.anchor.set(0.5);
    canon3.angle = -180;
    game.physics.arcade.enable(canon3);
    canon3.body.drag.set(70);
    canon3.body.maxVelocity.set(200);
    weapon3.trackSprite(canon3, 0, 0, true);
/*
    weapon4 = game.add.weapon(30, 'bullet');
    weapon4.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon4.bulletLifespan = 1100;
    weapon4.bulletSpeed = 600;
    weapon4.fireRate = 1;

    canon4 = this.add.sprite(1568, 161, 'canon');
    canon4.anchor.set(0.5);
    canon4.angle = -180;
    game.physics.arcade.enable(canon4);
    canon4.body.drag.set(70);
    canon4.body.maxVelocity.set(200);
    weapon4.trackSprite(canon4, 0, 0, true);
*/
    weapon5 = game.add.weapon(30, 'bullet');
    weapon5.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon5.bulletLifespan = 1200;
    weapon5.bulletSpeed = 600;
    weapon5.fireRate = 1;

    canon5 = this.add.sprite(1121, 95, 'canon');
    canon5.anchor.set(0.5);
    canon5.angle = -180;
    game.physics.arcade.enable(canon5);
    canon5.body.drag.set(70);
    canon5.body.maxVelocity.set(200);
    weapon5.trackSprite(canon5, 0, 0, true);

    weapon6 = game.add.weapon(30, 'bullet');
    weapon6.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon6.bulletLifespan = 1100;
    weapon6.bulletSpeed = 600;
    weapon6.fireRate = 1;

    canon6 = this.add.sprite(351, 226, 'canon');
    canon6.anchor.set(0.5);
    canon6.angle = +90;
    game.physics.arcade.enable(canon6);
    canon6.body.drag.set(70);
    canon6.body.maxVelocity.set(200);
    weapon6.trackSprite(canon6, 0, 0, true);

    weapon7 = game.add.weapon(30, 'bullet');
    weapon7.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon7.bulletLifespan = 1300;
    weapon7.bulletSpeed = 600;
    weapon7.fireRate = 1;

    canon7 = this.add.sprite(289, 670, 'canon');
    canon7.anchor.set(0.5);
    canon7.angle = +90;
    game.physics.arcade.enable(canon7);
    canon7.body.drag.set(70);
    canon7.body.maxVelocity.set(200);
    weapon7.trackSprite(canon7, 0, 0, true);

    weapon8 = game.add.weapon(30, 'bullet');
    weapon8.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon8.bulletLifespan = 1300;
    weapon8.bulletSpeed = 600;
    weapon8.fireRate = 1;

    canon8 = this.add.sprite(545, 349, 'canon');
    canon8.anchor.set(0.5);
    //canon8.angle = +90;
    game.physics.arcade.enable(canon8);
    canon8.body.drag.set(70);
    canon8.body.maxVelocity.set(200);
    weapon8.trackSprite(canon8, 0, 0, true);

    weapon9 = game.add.weapon(30, 'bullet');
    weapon9.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon9.bulletLifespan = 1000;
    weapon9.bulletSpeed = 600;
    weapon9.fireRate = 1;

    canon9 = this.add.sprite(1823, 224, 'canon');
    canon9.anchor.set(0.5);
    canon9.angle = +90;
    game.physics.arcade.enable(canon9);
    canon9.body.drag.set(70);
    canon9.body.maxVelocity.set(200);
    weapon9.trackSprite(canon9, 0, 0, true);

    weapon10 = game.add.weapon(30, 'bullet');
    weapon10.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon10.bulletLifespan = 1300;
    weapon10.bulletSpeed = 600;
    weapon10.fireRate = 1;

    canon10 = this.add.sprite(1315, 1761, 'canon');
    canon10.anchor.set(0.5);
    canon10.angle = -180;
    game.physics.arcade.enable(canon10);
    canon10.body.drag.set(70);
    canon10.body.maxVelocity.set(200);
    weapon10.trackSprite(canon10, 0, 0, true);

    weapon11 = game.add.weapon(30, 'bullet');
    weapon11.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon11.bulletLifespan = 1200;
    weapon11.bulletSpeed = 600;
    weapon11.fireRate = 1;

    canon11 = this.add.sprite(95, 1307, 'canon');
    canon11.anchor.set(0.5);
    canon11.angle = -90;
    game.physics.arcade.enable(canon11);
    canon11.body.drag.set(70);
    canon11.body.maxVelocity.set(200);
    weapon11.trackSprite(canon11, 0, 0, true);

    weapon12 = game.add.weapon(30, 'bullet');
    weapon12.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    weapon12.bulletLifespan = 1300;
    weapon12.bulletSpeed = 600;
    weapon12.fireRate = 1;

    canon12 = this.add.sprite(160, 865, 'canon');
    canon12.anchor.set(0.5);
    canon12.angle = -90;
    game.physics.arcade.enable(canon12);
    canon12.body.drag.set(70);
    canon12.body.maxVelocity.set(200);
    weapon12.trackSprite(canon12, 0, 0, true);

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
    game.physics.arcade.collide(sprite, boomerang, this.dead);
    game.physics.arcade.collide(sprite, boomerangb, this.dead);
    game.physics.arcade.collide(sprite, boomerang2, this.dead);
    game.physics.arcade.collide(sprite, boomerang2b, this.dead);
    game.physics.arcade.collide(sprite, boomerang3, this.dead);
    game.physics.arcade.collide(sprite, boomerang3b, this.dead);
    game.physics.arcade.collide(sprite, boomerang4, this.dead);
    game.physics.arcade.collide(sprite, boomerang4b, this.dead);
    game.physics.arcade.collide(sprite, weapon.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon2.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon3.bullets,this.dead);
    //game.physics.arcade.collide(sprite, weapon4.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon5.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon6.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon7.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon8.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon9.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon10.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon11.bullets,this.dead);
    game.physics.arcade.collide(sprite, weapon12.bullets,this.dead);
    boomerang.rotation += 0.05;
    boomerangb.rotation += 0.05;
    boomerang2.rotation += 0.05;
    boomerang2b.rotation += 0.05;
    boomerang3.rotation -= 0.05;
    boomerang3b.rotation -= 0.05;
    boomerang4.rotation += 0.05;
    boomerang4b.rotation += 0.05;

  },

  render: function(){
      //game.debug.pointer( game.input.activePointer );

  },


  fire: function(){

  weapon.fire();
  weapon2.fire();
  weapon3.fire();
  //weapon4.fire();
  weapon5.fire();
  weapon6.fire();
  weapon7.fire();
  weapon8.fire();
  weapon9.fire();
  weapon10.fire();
  weapon11.fire();
  weapon12.fire();


  },

dead: function(){

sprite.x = 2430;
sprite.y = 1815;


},
win: function(){
  nivel = 22;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
game.state.start('Nivel22')

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
