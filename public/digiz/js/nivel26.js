var sprite;
var Nivel26 = {
  preload: function(){
    game.stage.backgroundColor = '#000000';
    game.load.image('fondo', 'assets/map/fondolvl5.png');
    game.load.spritesheet('portalwin', 'assets/sprites/portalwin.png', 64, 64, 8);
    game.load.image('arrow', 'assets/sprites/arrow.png');
    game.load.image('bolapuas', 'assets/sprites/bolapuaslvl4.png');
    game.load.image('baseboomerang', 'assets/sprites/baseboomeranglvl4.png');
    game.load.image('boomerang', 'assets/sprites/boomeranglvl4.png');
    game.load.image('sierra', 'assets/sprites/sierralvl4.png');
    game.load.image('aplastador', 'assets/sprites/aplastadorlvl4.png');
    game.load.image('bullet', 'assets/sprites/lazer.png');
    game.load.image('canon', 'assets/sprites/canon.png');
    game.load.image('cubo3x3', 'assets/sprites/nivel27/3x3.png');
    game.load.image('cubo2x2', 'assets/sprites/nivel27/2x2.png');
    game.load.image('cubo9x9', 'assets/sprites/nivel27/9x9.png');
    game.load.image('cubo5x5', 'assets/sprites/nivel27/5x5.png');
    game.load.image('cubo2x8', 'assets/sprites/nivel27/2x8.png');
    game.load.image('cubo2x6', 'assets/sprites/nivel27/2x6.png');
    game.load.tilemap('map','assets/map/nivel27.csv');
    game.load.image('tileset','assets/map/tilenivel5.png');
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

    game.add.tileSprite(0, 0, 2560, 1920, 'fondo');

    portalwin = game.add.sprite(2048, 1088, 'portalwin');
    game.physics.enable(portalwin, Phaser.Physics.ARCADE);
    var portalanim = portalwin.animations.add('portalanim');
    portalwin.animations.play('portalanim', 30, true);
    portalwin.body.immovable = true;
    portalwin.body.enable = true;
    portalwin.anchor.setTo(0.5);

   sprite = game.add.sprite(128, 991, 'arrow');
   game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.collideWorldBounds = true;
    sprite.body.enable = true;
    sprite.scale.setTo(1.3, 1.3);
    game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.setSize(18, 18, +13,+1);
    sprite.body.setCircle(16);
    sprite.anchor.setTo(0.5);
    sprite.body.allowRotation = true;

    cubo3x3 = game.add.sprite(546, 798, 'cubo3x3');
    game.physics.enable(cubo3x3, Phaser.Physics.ARCADE);
    cubo3x3.body.enable = true;
    cubo3x3.body.immovable = true;
    cubo3x3.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween = game.add.tween(cubo3x3).to({ y: 1185 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo3x3b = game.add.sprite(96, 543, 'cubo3x3');
    game.physics.enable(cubo3x3b, Phaser.Physics.ARCADE);
    cubo3x3b.body.enable = true;
    cubo3x3b.body.immovable = true;
    cubo3x3b.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween3x3b = game.add.tween(cubo3x3b).to({ x: 609 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo3x3c = game.add.sprite(609, 1440, 'cubo3x3');
    game.physics.enable(cubo3x3c, Phaser.Physics.ARCADE);
    cubo3x3c.body.enable = true;
    cubo3x3c.body.immovable = true;
    cubo3x3c.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween3x3c = game.add.tween(cubo3x3c).to({ x: 161 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x2 = game.add.sprite(128, 767, 'cubo2x2');
    game.physics.enable(cubo2x2, Phaser.Physics.ARCADE);
    cubo2x2.body.enable = true;
    cubo2x2.body.immovable = true;
    cubo2x2.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween2 = game.add.tween(cubo2x2).to({ x: 385 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x2b = game.add.sprite(831, 128, 'cubo2x2');
    game.physics.enable(cubo2x2b, Phaser.Physics.ARCADE);
    cubo2x2b.body.enable = true;
    cubo2x2b.body.immovable = true;
    cubo2x2b.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween2b = game.add.tween(cubo2x2b).to({ y: 574 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x2c = game.add.sprite(1024, 128, 'cubo2x2');
    game.physics.enable(cubo2x2c, Phaser.Physics.ARCADE);
    cubo2x2c.body.enable = true;
    cubo2x2c.body.immovable = true;
    cubo2x2c.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween2c = game.add.tween(cubo2x2c).to({ y: 574 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x2d = game.add.sprite(2433, 767, 'cubo2x2');
    game.physics.enable(cubo2x2d, Phaser.Physics.ARCADE);
    cubo2x2d.body.enable = true;
    cubo2x2d.body.immovable = true;
    cubo2x2d.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween2d = game.add.tween(cubo2x2d).to({ x: 1855 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x2e = game.add.sprite(128, 1216, 'cubo2x2');
    game.physics.enable(cubo2x2e, Phaser.Physics.ARCADE);
    cubo2x2e.body.enable = true;
    cubo2x2e.body.immovable = true;
    cubo2x2e.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween2e = game.add.tween(cubo2x2e).to({ x: 384 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo9x9 = game.add.sprite(993, 992, 'cubo9x9');
    game.physics.enable(cubo9x9, Phaser.Physics.ARCADE);
    cubo9x9.body.enable = true;
    cubo9x9.body.immovable = true;
    cubo9x9.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween3 = game.add.tween(cubo9x9).to({ x: 1504 }, 5000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo5x5 = game.add.sprite(1313, 478, 'cubo5x5');
    game.physics.enable(cubo5x5, Phaser.Physics.ARCADE);
    cubo5x5.body.enable = true;
    cubo5x5.body.immovable = true;
    cubo5x5.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween4 = game.add.tween(cubo5x5).to({ y: 226 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo5x5b = game.add.sprite(1696, 226, 'cubo5x5');
    game.physics.enable(cubo5x5b, Phaser.Physics.ARCADE);
    cubo5x5b.body.enable = true;
    cubo5x5b.body.immovable = true;
    cubo5x5b.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween4b = game.add.tween(cubo5x5b).to({ y: 478 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo5x5c = game.add.sprite(2081, 478, 'cubo5x5');
    game.physics.enable(cubo5x5c, Phaser.Physics.ARCADE);
    cubo5x5c.body.enable = true;
    cubo5x5c.body.immovable = true;
    cubo5x5c.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween4c = game.add.tween(cubo5x5c).to({ y: 226 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x8 = game.add.sprite(1729, 1407, 'cubo2x8');
    game.physics.enable(cubo2x8, Phaser.Physics.ARCADE);
    cubo2x8.body.enable = true;
    cubo2x8.body.immovable = true;
    cubo2x8.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween5 = game.add.tween(cubo2x8).to({ x: 1023 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x8b = game.add.sprite(1023, 1599, 'cubo2x8');
    game.physics.enable(cubo2x8b, Phaser.Physics.ARCADE);
    cubo2x8b.body.enable = true;
    cubo2x8b.body.immovable = true;
    cubo2x8b.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween5b = game.add.tween(cubo2x8b).to({ x: 1729 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x8c = game.add.sprite(1729, 1791, 'cubo2x8');
    game.physics.enable(cubo2x8c, Phaser.Physics.ARCADE);
    cubo2x8c.body.enable = true;
    cubo2x8c.body.immovable = true;
    cubo2x8c.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween5c = game.add.tween(cubo2x8c).to({ x: 1023 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x6 = game.add.sprite(2111, 1536, 'cubo2x6');
    game.physics.enable(cubo2x6, Phaser.Physics.ARCADE);
    cubo2x6.body.enable = true;
    cubo2x6.body.immovable = true;
    cubo2x6.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween6 = game.add.tween(cubo2x6).to({ x: 2240 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    cubo2x6b = game.add.sprite(2432, 1536, 'cubo2x6');
    game.physics.enable(cubo2x6b, Phaser.Physics.ARCADE);
    cubo2x6b.body.enable = true;
    cubo2x6b.body.immovable = true;
    cubo2x6b.anchor.setTo(0.5, 0.5);
    //bolapuas.scale.setTo(0.4, 0.4);
    tween6b = game.add.tween(cubo2x6b).to({ x: 2303 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true);




    map = game.add.tilemap('map', 64, 64);

    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,110);
    map.setTileIndexCallback(0, this.dead, this);
    map.setTileIndexCallback(1, this.dead, this);
    map.setCollision(16);

    layer = map.createLayer(0);

    layer.resizeWorld();

    game.camera.follow(sprite);

    musiconoff = game.add.button(330, 60, 'musiconoff', this.musicoffon, this, 1, 0);
    musiconoff.anchor.setTo(0.5, 0.5);
    musiconoff.scale.setTo(0.8, 0.8);
    musiconoff.fixedToCamera = true;

  },
  update: function(){
    sprite.rotation = game.physics.arcade.moveToPointer(sprite, 60, game.input.activePointer, 500);

    game.physics.arcade.collide(sprite, layer);
    game.physics.arcade.collide(sprite, portalwin, this.win);
    game.physics.arcade.collide(cubo3x3, sprite, this.dead);
    game.physics.arcade.collide(cubo3x3b, sprite, this.dead);
    game.physics.arcade.collide(cubo3x3c, sprite, this.dead);
    game.physics.arcade.collide(cubo2x2, sprite, this.dead);
    game.physics.arcade.collide(cubo2x2b, sprite, this.dead);
    game.physics.arcade.collide(cubo2x2c, sprite, this.dead);
    game.physics.arcade.collide(cubo2x2d, sprite, this.dead);
    game.physics.arcade.collide(cubo2x2e, sprite, this.dead);
    game.physics.arcade.collide(cubo9x9, sprite, this.dead);
    game.physics.arcade.collide(cubo5x5, sprite, this.dead);
    game.physics.arcade.collide(cubo5x5b, sprite, this.dead);
    game.physics.arcade.collide(cubo5x5c, sprite, this.dead);
    game.physics.arcade.collide(cubo2x8, sprite, this.dead);
    game.physics.arcade.collide(cubo2x8b, sprite, this.dead);
    game.physics.arcade.collide(cubo2x8c, sprite, this.dead);
    game.physics.arcade.collide(cubo2x6, sprite, this.dead);
    game.physics.arcade.collide(cubo2x6b, sprite, this.dead);


  },

  render: function(){
      //game.debug.pointer( game.input.activePointer );
      game.debug.body(cubo3x3b);
  },

dead: function(){

sprite.x = 128;
sprite.y = 991;

},
win: function(){
  nivel = 27;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
game.state.start('Nivel27');

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
