var sprite;
var Nivel13 = {
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
    game.load.tilemap('map','assets/map/nivel13.csv');
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


  portalwin = game.add.sprite(894, 125, 'portalwin');
  game.physics.enable(portalwin, Phaser.Physics.ARCADE);
  var portalanim = portalwin.animations.add('portalanim');
  portalwin.animations.play('portalanim', 30, true);
  portalwin.body.enable = true;
  portalwin.anchor.setTo(0.5);

  sprite = game.add.sprite(2114, 128, 'arrow');
  game.physics.enable(sprite, Phaser.Physics.ARCADE);
   sprite.body.collideWorldBounds = true;
   sprite.body.enable = true;
   sprite.scale.setTo(1.3, 1.3);
   game.physics.enable(sprite, Phaser.Physics.ARCADE);
   sprite.body.setSize(18, 18, +13,+1);
   sprite.body.setCircle(16);
   sprite.anchor.setTo(0.5);
   sprite.body.allowRotation = true;

   aplastador = game.add.sprite(1984, 223, 'aplastador');
   game.physics.enable(aplastador, Phaser.Physics.ARCADE);
   aplastador.body.enable = true;
   aplastador.body.immovable = true;
   aplastador.anchor.setTo(0.5, 0.5);
   aplastador.scale.setTo(0.4, 0.4);
   tween = game.add.tween(aplastador).to({ y: 356 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween.repeatDelay(1000);

   aplastador2 = game.add.sprite(1599, 1370, 'aplastador');
   game.physics.enable(aplastador2, Phaser.Physics.ARCADE);
   aplastador2.body.enable = true;
   aplastador2.body.immovable = true;
   aplastador2.anchor.setTo(0.5, 0.5);
   aplastador2.scale.setTo(0.4, 0.4);
   tween2 = game.add.tween(aplastador2).to({ y: 1515 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween2.repeatDelay(1000);

   aplastador3 = game.add.sprite(1214, 1370, 'aplastador');
   game.physics.enable(aplastador3, Phaser.Physics.ARCADE);
   aplastador3.body.enable = true;
   aplastador3.body.immovable = true;
   aplastador3.anchor.setTo(0.5, 0.5);
   aplastador3.scale.setTo(0.4, 0.4);
   tween3 = game.add.tween(aplastador3).to({ y: 1515 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween3.repeatDelay(1000);

   aplastador4 = game.add.sprite(700, 1370, 'aplastador');
   game.physics.enable(aplastador4, Phaser.Physics.ARCADE);
   aplastador4.body.enable = true;
   aplastador4.body.immovable = true;
   aplastador4.anchor.setTo(0.5, 0.5);
   aplastador4.scale.setTo(0.4, 0.4);
   tween4 = game.add.tween(aplastador4).to({ y: 1515 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween4.repeatDelay(1000);

   aplastador5 = game.add.sprite(1086, 989, 'aplastador');
   game.physics.enable(aplastador5, Phaser.Physics.ARCADE);
   aplastador5.body.enable = true;
   aplastador5.body.immovable = true;
   aplastador5.anchor.setTo(0.5, 0.5);
   aplastador5.scale.setTo(0.4, 0.4);
   tween5 = game.add.tween(aplastador5).to({ y: 850 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween5.repeatDelay(1000);

   aplastador6 = game.add.sprite(1215, 989, 'aplastador');
   game.physics.enable(aplastador6, Phaser.Physics.ARCADE);
   aplastador6.body.enable = true;
   aplastador6.body.immovable = true;
   aplastador6.anchor.setTo(0.5, 0.5);
   aplastador6.scale.setTo(0.4, 0.4);
   tween6 = game.add.tween(aplastador6).to({ y: 850 }, 500, Phaser.Easing.Linear.None, true, 0, 1000, true);
   tween6.repeatDelay(1000);

   sierra = game.add.sprite(2113, 636, 'sierra');
   game.physics.enable(sierra, Phaser.Physics.ARCADE);
   sierra.body.enable = true;
   sierra.body.immovable = true;
   sierra.anchor.setTo(0.5, 0.5);
   sierra.scale.setTo(0.3, 0.3);
   sierra.body.setCircle(185);
   tween = game.add.tween(sierra).to({ y: 1022 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

   sierra2 = game.add.sprite(2113, 1471, 'sierra');
   game.physics.enable(sierra2, Phaser.Physics.ARCADE);
   sierra2.body.enable = true;
   sierra2.body.immovable = true;
   sierra2.anchor.setTo(0.5, 0.5);
   sierra2.scale.setTo(0.3, 0.3);
   sierra2.body.setCircle(185);
   tween2 = game.add.tween(sierra2).to({ y: 1150 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);






    map = game.add.tilemap('map', 64, 64);

    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,110);
    map.setTileIndexCallback(0, this.dead, this);
    map.setTileIndexCallback(1, this.win, this);
    map.setCollision(16);

    layer = map.createLayer(0);

    layer.resizeWorld();

    game.camera.follow(sprite);

    baseboomerang = game.add.sprite(1407, 1338, 'baseboomerang');
    baseboomerang.anchor.setTo(0.5, 0.5);
    baseboomerang.scale.setTo(0.3, 0.3);

    boomerang = game.add.sprite(1407, 1338, 'boomerang');
    game.physics.enable(boomerang, Phaser.Physics.ARCADE);
    boomerang.body.enable = true;
    boomerang.body.immovable = true;
    boomerang.anchor.setTo(0.5, 0.5);
    boomerang.scale.setTo(0.3, 0.3);
    boomerang.body.setCircle(160);
    boomerang.pivot.x = 400;

    baseboomerang2 = game.add.sprite(961, 1338, 'baseboomerang');
    baseboomerang2.anchor.setTo(0.5, 0.5);
    baseboomerang2.scale.setTo(0.3, 0.3);

    boomerang2 = game.add.sprite(961, 1338, 'boomerang');
    game.physics.enable(boomerang2, Phaser.Physics.ARCADE);
    boomerang2.body.enable = true;
    boomerang2.body.immovable = true;
    boomerang2.anchor.setTo(0.5, 0.5);
    boomerang2.scale.setTo(0.3, 0.3);
    boomerang2.body.setCircle(160);
    boomerang2.pivot.x = 400;

    baseboomerang3 = game.add.sprite(218, 1338, 'baseboomerang');
    baseboomerang3.anchor.setTo(0.5, 0.5);
    baseboomerang3.scale.setTo(0.3, 0.3);

    boomerang3 = game.add.sprite(218, 1338, 'boomerang');
    game.physics.enable(boomerang3, Phaser.Physics.ARCADE);
    boomerang3.body.enable = true;
    boomerang3.body.immovable = true;
    boomerang3.anchor.setTo(0.5, 0.5);
    boomerang3.scale.setTo(0.3, 0.3);
    boomerang3.body.setCircle(160);
    boomerang3.pivot.x = 400;

    baseboomerang4 = game.add.sprite(223, 1020, 'baseboomerang');
    baseboomerang4.anchor.setTo(0.5, 0.5);
    baseboomerang4.scale.setTo(0.3, 0.3);

    boomerang4 = game.add.sprite(223, 1020, 'boomerang');
    game.physics.enable(boomerang4, Phaser.Physics.ARCADE);
    boomerang4.body.enable = true;
    boomerang4.body.immovable = true;
    boomerang4.anchor.setTo(0.5, 0.5);
    boomerang4.scale.setTo(0.3, 0.3);
    boomerang4.body.setCircle(160);
    boomerang4.pivot.x = 400;

    baseboomerang5 = game.add.sprite(221, 731, 'baseboomerang');
    baseboomerang5.anchor.setTo(0.5, 0.5);
    baseboomerang5.scale.setTo(0.3, 0.3);

    boomerang5 = game.add.sprite(221, 731, 'boomerang');
    game.physics.enable(boomerang5, Phaser.Physics.ARCADE);
    boomerang5.body.enable = true;
    boomerang5.body.immovable = true;
    boomerang5.anchor.setTo(0.5, 0.5);
    boomerang5.scale.setTo(0.3, 0.3);
    boomerang5.body.setCircle(160);
    boomerang5.pivot.x = 400;

    baseboomerang6 = game.add.sprite(796, 604, 'baseboomerang');
    baseboomerang6.anchor.setTo(0.5, 0.5);
    baseboomerang6.scale.setTo(0.3, 0.3);

    boomerang6 = game.add.sprite(796, 604, 'boomerang');
    game.physics.enable(boomerang6, Phaser.Physics.ARCADE);
    boomerang6.body.enable = true;
    boomerang6.body.immovable = true;
    boomerang6.anchor.setTo(0.5, 0.5);
    boomerang6.scale.setTo(0.3, 0.3);
    boomerang6.body.setCircle(160);
    boomerang6.pivot.x = 400;

    baseboomerang7 = game.add.sprite(222, 350, 'baseboomerang');
    baseboomerang7.anchor.setTo(0.5, 0.5);
    baseboomerang7.scale.setTo(0.3, 0.3);

    boomerang7 = game.add.sprite(222, 350, 'boomerang');
    game.physics.enable(boomerang7, Phaser.Physics.ARCADE);
    boomerang7.body.enable = true;
    boomerang7.body.immovable = true;
    boomerang7.anchor.setTo(0.5, 0.5);
    boomerang7.scale.setTo(0.3, 0.3);
    boomerang7.body.setCircle(160);
    boomerang7.pivot.x = 400;

    baseboomerang8 = game.add.sprite(222, 222, 'baseboomerang');
    baseboomerang8.anchor.setTo(0.5, 0.5);
    baseboomerang8.scale.setTo(0.3, 0.3);

    boomerang8 = game.add.sprite(222, 222, 'boomerang');
    game.physics.enable(boomerang8, Phaser.Physics.ARCADE);
    boomerang8.body.enable = true;
    boomerang8.body.immovable = true;
    boomerang8.anchor.setTo(0.5, 0.5);
    boomerang8.scale.setTo(0.3, 0.3);
    boomerang8.body.setCircle(160);
    boomerang8.pivot.x = 400;

    baseboomerang9 = game.add.sprite(1693, 222, 'baseboomerang');
    baseboomerang9.anchor.setTo(0.5, 0.5);
    baseboomerang9.scale.setTo(0.3, 0.3);

    boomerang9 = game.add.sprite(1693, 222, 'boomerang');
    game.physics.enable(boomerang9, Phaser.Physics.ARCADE);
    boomerang9.body.enable = true;
    boomerang9.body.immovable = true;
    boomerang9.anchor.setTo(0.5, 0.5);
    boomerang9.scale.setTo(0.3, 0.3);
    boomerang9.body.setCircle(160);
    boomerang9.pivot.x = 400;

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
    game.physics.arcade.collide(sprite, aplastador5, this.dead);
    game.physics.arcade.collide(sprite, aplastador6, this.dead);
    game.physics.arcade.collide(sprite, sierra, this.dead);
    game.physics.arcade.collide(sprite, sierra2, this.dead);
    game.physics.arcade.collide(sprite, boomerang, this.dead);
    game.physics.arcade.collide(sprite, boomerang2, this.dead);
    game.physics.arcade.collide(sprite, boomerang3, this.dead);
    game.physics.arcade.collide(sprite, boomerang4, this.dead);
    game.physics.arcade.collide(sprite, boomerang5, this.dead);
    game.physics.arcade.collide(sprite, boomerang6, this.dead);
    game.physics.arcade.collide(sprite, boomerang7, this.dead);
    game.physics.arcade.collide(sprite, boomerang8, this.dead);
    game.physics.arcade.collide(sprite, boomerang9, this.dead);
    sierra.rotation -= 0.08;
    sierra2.rotation -= 0.08;
    boomerang.rotation += 0.05;
    boomerang2.rotation += 0.05;
    boomerang3.rotation += 0.05;
    boomerang4.rotation -= 0.05;
    boomerang5.rotation += 0.05;
    boomerang6.rotation += 0.05;
    boomerang7.rotation += 0.05;
    boomerang8.rotation += 0.05;
    boomerang9.rotation -= 0.05;

  },

  render: function(){
      //game.debug.pointer( game.input.activePointer );
      //game.debug.body(aplastador);
  },

dead: function(){

sprite.x = 2115;
sprite.y = 110;

},
win: function(){

  nivel = 14;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
game.state.start('Nivel14')

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
