var sprite;
var Nivel25 = {
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
    game.load.image('bolalenta', 'assets/sprites/bolalenta.png');
    game.load.image('bolarapida', 'assets/sprites/bolarapida.png');
    game.load.tilemap('map','assets/map/nivel25.csv');
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

    whitelvl.play();

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.add.tileSprite(0, 0, 3840, 1024, 'fondo');

    portalwin = game.add.sprite(3713, 513, 'portalwin');
    game.physics.enable(portalwin, Phaser.Physics.ARCADE);
    var portalanim = portalwin.animations.add('portalanim');
    portalwin.animations.play('portalanim', 30, true);
    portalwin.body.enable = true;
    portalwin.anchor.setTo(0.5);

   sprite = game.add.sprite(128, 513, 'arrow');
   game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.collideWorldBounds = true;
    sprite.body.enable = true;
    sprite.scale.setTo(1.3, 1.3);
    game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.setSize(18, 18, +13,+1);
    sprite.body.setCircle(16);
    sprite.anchor.setTo(0.5);
    sprite.body.allowRotation = true;

    bolalenta = game.add.sprite(3104, 351, 'bolalenta');
    game.physics.enable(bolalenta, Phaser.Physics.ARCADE);
    bolalenta.body.enable = true;
    bolalenta.anchor.setTo(0.5);
    bolalenta.body.immovable = true;
    bolalenta.body.setCircle(25);
    tween = game.add.tween(bolalenta).to({ y: 670 }, 1000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    bolarapida = game.add.sprite(3296, 351, 'bolarapida');
    game.physics.enable(bolarapida, Phaser.Physics.ARCADE);
    bolarapida.body.enable = true;
    bolarapida.anchor.setTo(0.5);
    tween2 = game.add.tween(bolarapida).to({ y: 670 }, 100, Phaser.Easing.Linear.None, true, 0, 1000, true);

    bolarapida2 = game.add.sprite(3490, 670, 'bolarapida');
    game.physics.enable(bolarapida2, Phaser.Physics.ARCADE);
    bolarapida2.body.enable = true;
    bolarapida2.anchor.setTo(0.5);
    tween3 = game.add.tween(bolarapida2).to({ y: 351 }, 100, Phaser.Easing.Linear.None, true, 0, 1000, true);


    map = game.add.tilemap('map', 64, 64);

    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,110);
    map.setTileIndexCallback(0, this.dead, this);
    map.setTileIndexCallback(1, this.win, this);
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
    game.physics.arcade.collide(sprite, bolalenta, this.dead);



  },

  render: function(){
    //  game.debug.pointer( game.input.activePointer );
      //game.debug.body(bolalenta);
  },

dead: function(){

sprite.x = 128;
sprite.y = 513;

},
win: function(){
  nivel = 26;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
startLevel('Nivel26')

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
