var sprite;
var Nivel23 = {
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
    game.load.image('bullet', 'assets/sprites/shmup-bullet.png');
    game.load.image('ship', 'assets/sprites/shmup-ship.png');
    game.load.tilemap('map','assets/map/nivel23.csv');
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

    portalwin = game.add.sprite(129, 1089, 'portalwin');
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

    bolapuas = game.add.sprite(800, 737, 'bolapuas');
    game.physics.enable(bolapuas, Phaser.Physics.ARCADE);
    bolapuas.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    bolapuas.body.setCircle(185);
    bolapuas.body.bounce.set(1);
    bolapuas.body.gravity.y = 100;
    bolapuas.body.velocity.set(-200, 100);

    bolapuas2 = game.add.sprite(1050, 737, 'bolapuas');
    game.physics.enable(bolapuas2, Phaser.Physics.ARCADE);
    bolapuas2.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas2.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    bolapuas2.body.setCircle(185);
    bolapuas2.body.bounce.set(1);
    bolapuas2.body.gravity.y = 100;
    bolapuas2.body.velocity.set(-200, 100);

    bolapuas3 = game.add.sprite(1830, 205, 'bolapuas');
    game.physics.enable(bolapuas3, Phaser.Physics.ARCADE);
    bolapuas3.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas3.anchor.setTo(0.5, 0.5);
    bolapuas.scale.setTo(0.8, 0.8);
    bolapuas3.body.setCircle(185);
    bolapuas3.body.bounce.set(1);
    bolapuas3.body.gravity.y = 100;
    bolapuas3.body.velocity.set(-200, 100);

    bolapuas4 = game.add.sprite(1830, 205, 'bolapuas');
    game.physics.enable(bolapuas4, Phaser.Physics.ARCADE);
    bolapuas4.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas4.anchor.setTo(0.5, 0.5);
    bolapuas4.scale.setTo(0.4, 0.4);
    bolapuas4.body.setCircle(185);
    bolapuas4.body.bounce.set(1);
    bolapuas4.body.gravity.y = 100;
    bolapuas4.body.velocity.set(-500, 100);

    bolapuas5 = game.add.sprite(1830, 205, 'bolapuas');
    game.physics.enable(bolapuas5, Phaser.Physics.ARCADE);
    bolapuas5.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas5.anchor.setTo(0.5, 0.5);
    bolapuas5.scale.setTo(0.4, 0.4);
    bolapuas5.body.setCircle(185);
    bolapuas5.body.bounce.set(1);
    bolapuas5.body.gravity.y = 100;
    bolapuas5.body.velocity.set(-500, 100);

    bolapuas6 = game.add.sprite(1830, 205, 'bolapuas');
    game.physics.enable(bolapuas6, Phaser.Physics.ARCADE);
    bolapuas6.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas6.anchor.setTo(0.5, 0.5);
    bolapuas6.scale.setTo(0.4, 0.4);
    bolapuas6.body.setCircle(185);
    bolapuas6.body.bounce.set(1);
    bolapuas6.body.gravity.y = 100;
    bolapuas6.body.velocity.set(-500, 100);

    bolapuas7 = game.add.sprite(1830, 205, 'bolapuas');
    game.physics.enable(bolapuas7, Phaser.Physics.ARCADE);
    bolapuas7.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas7.anchor.setTo(0.5, 0.5);
    bolapuas7.scale.setTo(0.6, 0.6);
    bolapuas7.body.setCircle(185);
    bolapuas7.body.bounce.set(1);
    bolapuas7.body.gravity.y = 100;
    bolapuas7.body.velocity.set(-500, 100);

    bolapuas8 = game.add.sprite(1830, 205, 'bolapuas');
    game.physics.enable(bolapuas8, Phaser.Physics.ARCADE);
    bolapuas8.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas8.anchor.setTo(0.5, 0.5);
    bolapuas8.scale.setTo(0.6, 0.6);
    bolapuas8.body.setCircle(185);
    bolapuas8.body.bounce.set(1);
    bolapuas8.body.gravity.y = 100;
    bolapuas8.body.velocity.set(-500, 100);

    bolapuas9 = game.add.sprite(1830, 205, 'bolapuas');
    game.physics.enable(bolapuas9, Phaser.Physics.ARCADE);
    bolapuas9.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas9.anchor.setTo(0.5, 0.5);
    bolapuas9.scale.setTo(0.6, 0.6);
    bolapuas9.body.setCircle(185);
    bolapuas9.body.bounce.set(1);
    bolapuas9.body.gravity.y = 100;
    bolapuas9.body.velocity.set(-500, 100);

    bolapuas10 = game.add.sprite(1830, 205, 'bolapuas');
    game.physics.enable(bolapuas10, Phaser.Physics.ARCADE);
    bolapuas10.body.enable = true;
  //  bolapuas.body.immovable = true;
    bolapuas10.anchor.setTo(0.5, 0.5);
    bolapuas10.scale.setTo(0.6, 0.6);
    bolapuas10.body.setCircle(185);
    bolapuas10.body.bounce.set(1);
    bolapuas10.body.gravity.y = 100;
    bolapuas10.body.velocity.set(-500, 100);

    sierra = game.add.sprite(1434, 1750, 'sierra');
    game.physics.enable(sierra, Phaser.Physics.ARCADE);
    sierra.body.enable = true;
    sierra.body.immovable = true;
    sierra.anchor.setTo(0.5, 0.5);
    sierra.scale.setTo(0.2, 0.2);
    sierra.body.setCircle(185);
    tween = game.add.tween(sierra).to({ x: 98 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    sierra2 = game.add.sprite(98, 1640, 'sierra');
    game.physics.enable(sierra2, Phaser.Physics.ARCADE);
    sierra2.body.enable = true;
    sierra2.body.immovable = true;
    sierra2.anchor.setTo(0.5, 0.5);
    sierra2.scale.setTo(0.2, 0.2);
    sierra2.body.setCircle(185);
    tween2 = game.add.tween(sierra2).to({ x: 1312 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);






    map = game.add.tilemap('map', 64, 64);

    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,1);


    map.setCollision(0);
    //map.setTileIndexCallback(0, this.dead, this);
    layer = map.createLayer(0);

    layer.resizeWorld();

    game.camera.follow(sprite);

    baseboomerang = game.add.sprite(1951, 1695, 'baseboomerang');
    baseboomerang.anchor.setTo(0.5, 0.5);
    baseboomerang.scale.setTo(0.3, 0.3);

    boomerang = game.add.sprite(1951, 1695, 'boomerang');
    game.physics.enable(boomerang, Phaser.Physics.ARCADE);
    boomerang.body.enable = true;
    boomerang.body.immovable = true;
    boomerang.anchor.setTo(0.5, 0.5);
    boomerang.scale.setTo(0.3, 0.3);
    boomerang.body.setCircle(160);
    boomerang.pivot.x = 400;

    boomerangb = game.add.sprite(1951, 1695, 'boomerang');
    game.physics.enable(boomerangb, Phaser.Physics.ARCADE);
    boomerangb.body.enable = true;
    boomerangb.body.immovable = true;
    boomerangb.anchor.setTo(0.5, 0.5);
    boomerangb.scale.setTo(0.3, 0.3);
    boomerangb.body.setCircle(160);
    boomerangb.pivot.x = 400;
    boomerangb.rotation += 3.1;

    baseboomerang2 = game.add.sprite(159, 1699, 'baseboomerang');
    baseboomerang2.anchor.setTo(0.5, 0.5);
    baseboomerang2.scale.setTo(0.3, 0.3);

    boomerang2 = game.add.sprite(159, 1699, 'boomerang');
    game.physics.enable(boomerang2, Phaser.Physics.ARCADE);
    boomerang2.body.enable = true;
    boomerang2.body.immovable = true;
    boomerang2.anchor.setTo(0.5, 0.5);
    boomerang2.scale.setTo(0.3, 0.3);
    boomerang2.body.setCircle(160);
    boomerang2.pivot.x = 400;

    boomerang2b = game.add.sprite(159, 1699, 'boomerang');
    game.physics.enable(boomerang2b, Phaser.Physics.ARCADE);
    boomerang2b.body.enable = true;
    boomerang2b.body.immovable = true;
    boomerang2b.anchor.setTo(0.5, 0.5);
    boomerang2b.scale.setTo(0.3, 0.3);
    boomerang2b.body.setCircle(160);
    boomerang2b.pivot.x = 400;
    boomerang2b.rotation += 3.1;

    baseboomerang3 = game.add.sprite(159, 1313, 'baseboomerang');
    baseboomerang3.anchor.setTo(0.5, 0.5);
    baseboomerang3.scale.setTo(0.3, 0.3);

    boomerang3 = game.add.sprite(159, 1313, 'boomerang');
    game.physics.enable(boomerang3, Phaser.Physics.ARCADE);
    boomerang3.body.enable = true;
    boomerang3.body.immovable = true;
    boomerang3.anchor.setTo(0.5, 0.5);
    boomerang3.scale.setTo(0.3, 0.3);
    boomerang3.body.setCircle(160);
    boomerang3.pivot.x = 400;

    boomerang3b = game.add.sprite(159, 1313, 'boomerang');
    game.physics.enable(boomerang3b, Phaser.Physics.ARCADE);
    boomerang3b.body.enable = true;
    boomerang3b.body.immovable = true;
    boomerang3b.anchor.setTo(0.5, 0.5);
    boomerang3b.scale.setTo(0.3, 0.3);
    boomerang3b.body.setCircle(160);
    boomerang3b.pivot.x = 400;
    boomerang3b.rotation += 3.1;

    baseboomerang4 = game.add.sprite(546, 1182, 'baseboomerang');
    baseboomerang4.anchor.setTo(0.5, 0.5);
    baseboomerang4.scale.setTo(0.3, 0.3);

    boomerang4 = game.add.sprite(546, 1182, 'boomerang');
    game.physics.enable(boomerang4, Phaser.Physics.ARCADE);
    boomerang4.body.enable = true;
    boomerang4.body.immovable = true;
    boomerang4.anchor.setTo(0.5, 0.5);
    boomerang4.scale.setTo(0.3, 0.3);
    boomerang4.body.setCircle(160);
    boomerang4.pivot.x = 400;

    boomerang4b = game.add.sprite(546, 1182, 'boomerang');
    game.physics.enable(boomerang4b, Phaser.Physics.ARCADE);
    boomerang4b.body.enable = true;
    boomerang4b.body.immovable = true;
    boomerang4b.anchor.setTo(0.5, 0.5);
    boomerang4b.scale.setTo(0.3, 0.3);
    boomerang4b.body.setCircle(160);
    boomerang4b.pivot.x = 400;
    boomerang4b.rotation += 3.1;

    musiconoff = game.add.button(330, 60, 'musiconoff', this.musicoffon, this, 1, 0);
    musiconoff.anchor.setTo(0.5, 0.5);
    musiconoff.scale.setTo(0.8, 0.8);
    musiconoff.fixedToCamera = true;
  },
  update: function(){
    sprite.rotation = game.physics.arcade.moveToPointer(sprite, 60, game.input.activePointer, 500);


    game.physics.arcade.collide(sprite, layer,this.dead);

    game.physics.arcade.collide(sprite, portalwin, this.win);
    game.physics.arcade.collide(bolapuas, sprite, this.dead);
    game.physics.arcade.collide(bolapuas2, sprite, this.dead);
    game.physics.arcade.collide(bolapuas3, sprite, this.dead);
    game.physics.arcade.collide(bolapuas4, sprite, this.dead);
    game.physics.arcade.collide(bolapuas5,sprite, this.dead);
    game.physics.arcade.collide(bolapuas6, sprite, this.dead);
    game.physics.arcade.collide(bolapuas7, sprite, this.dead);
    game.physics.arcade.collide(bolapuas8, sprite, this.dead);
    game.physics.arcade.collide(bolapuas9, sprite, this.dead);
    game.physics.arcade.collide(bolapuas10, sprite, this.dead);


    game.physics.arcade.collide(bolapuas, layer);
    game.physics.arcade.collide(bolapuas2, layer);
    game.physics.arcade.collide(bolapuas3, layer);
    game.physics.arcade.collide(bolapuas4, layer);
    game.physics.arcade.collide(bolapuas5, layer);
    game.physics.arcade.collide(bolapuas6, layer);
    game.physics.arcade.collide(bolapuas7, layer);
    game.physics.arcade.collide(bolapuas8, layer);
    game.physics.arcade.collide(bolapuas9, layer);
    game.physics.arcade.collide(bolapuas10, layer);
    game.physics.arcade.collide(bolapuas, bolapuas2);
    game.physics.arcade.collide(bolapuas, bolapuas3);
    game.physics.arcade.collide(bolapuas, bolapuas4);
    game.physics.arcade.collide(bolapuas, bolapuas5);
    game.physics.arcade.collide(bolapuas, bolapuas6);
    game.physics.arcade.collide(bolapuas, bolapuas7);
    game.physics.arcade.collide(bolapuas, bolapuas8);
    game.physics.arcade.collide(bolapuas, bolapuas9);
    game.physics.arcade.collide(bolapuas, bolapuas10);

    game.physics.arcade.collide(bolapuas2, bolapuas3);
    game.physics.arcade.collide(bolapuas2, bolapuas4);
    game.physics.arcade.collide(bolapuas2, bolapuas5);
    game.physics.arcade.collide(bolapuas2, bolapuas6);
    game.physics.arcade.collide(bolapuas2, bolapuas7);
    game.physics.arcade.collide(bolapuas2, bolapuas8);
    game.physics.arcade.collide(bolapuas2, bolapuas9);
    game.physics.arcade.collide(bolapuas2, bolapuas10);

    game.physics.arcade.collide(bolapuas3, bolapuas4);
    game.physics.arcade.collide(bolapuas3, bolapuas5);
    game.physics.arcade.collide(bolapuas3, bolapuas6);
    game.physics.arcade.collide(bolapuas3, bolapuas7);

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

    sierra.rotation -= 0.08;
    sierra2.rotation -= 0.08;

    boomerang.rotation += 0.05;
    boomerangb.rotation += 0.05;
    boomerang2.rotation += 0.05;
    boomerang2b.rotation += 0.05;
    boomerang3.rotation += 0.05;
    boomerang3b.rotation += 0.05;
    boomerang4.rotation -= 0.05;
    boomerang4b.rotation -= 0.05;


  },

  render: function(){
  //game.debug.pointer( game.input.activePointer );
    //game.debug.body(sierra);
    //game.debug.body(sierra2);

  },


dead: function(){

  sprite.x = 2430;
  sprite.y = 1815;




},
win: function(){
  nivel = 24;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
startLevel('Nivel24')

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
