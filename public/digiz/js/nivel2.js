var sprite;
var Nivel2 = {
  preload: function(){
    game.stage.backgroundColor = '#000000';
    game.load.image('fondo', 'assets/map/fondo.png');
    game.load.spritesheet('portalwin', 'assets/sprites/portalwin.png', 64, 64, 8);
    game.load.image('arrow', 'assets/sprites/arrow.png');
    game.load.image('bolapuas', 'assets/sprites/bolapuaslvl1.png');
    game.load.image('baseboomerang', 'assets/sprites/baseboomerang.png');
    game.load.image('boomerang', 'assets/sprites/boomerang.png');
    game.load.tilemap('map','assets/map/nivel2.csv');
    game.load.image('tileset','assets/map/tilenivel1.png')
    game.load.spritesheet('musiconoff', 'assets/sprites/musiconoff.png', 64,64);


    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    firstRunLandscape = game.scale.isGameLandscape;
    game.scale.forceOrientation(false, true);
    game.scale.enterIncorrectOrientation.add(handleIncorrect);
    game.scale.leaveIncorrectOrientation.add(handleCorrect);
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.setShowAll();


    this.game.scale.refresh();


  },

  create: function(){

    if(greenlvl.isPlaying == false){
          greenlvl.play();
    };

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.add.tileSprite(0, 0, 1664, 1024, 'fondo');


    portalwin = game.add.sprite(100, 905, 'portalwin');
    game.physics.enable(portalwin, Phaser.Physics.ARCADE);
    var portalanim = portalwin.animations.add('portalanim');
    portalwin.animations.play('portalanim', 30, true);
    portalwin.body.enable = true;
    portalwin.anchor.setTo(0.5);


  sprite = game.add.sprite(100, 100, 'arrow');
  game.physics.enable(sprite, Phaser.Physics.ARCADE);
   sprite.body.collideWorldBounds = true;
   sprite.body.enable = true;
   sprite.scale.setTo(1.3, 1.3);
   game.physics.enable(sprite, Phaser.Physics.ARCADE);
   sprite.body.setSize(18, 18, +13,+1);
   sprite.body.setCircle(16);
   sprite.anchor.setTo(0.5);
   sprite.body.allowRotation = true;


   bolapuas3 = game.add.sprite(780, 990, 'bolapuas');
   game.physics.enable(bolapuas3, Phaser.Physics.ARCADE);
   bolapuas3.body.enable = true;
   bolapuas3.body.immovable = true;
   bolapuas3.anchor.setTo(0.5, 0.5);
   bolapuas3.scale.setTo(0.4, 0.4);
   bolapuas3.body.setCircle(185);
   tween3 = game.add.tween(bolapuas3).to({ y: 770 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true)

   bolapuas4 = game.add.sprite(1115, 770, 'bolapuas');
   game.physics.enable(bolapuas4, Phaser.Physics.ARCADE);
   bolapuas4.body.enable = true;
   bolapuas4.body.immovable = true;
   bolapuas4.anchor.setTo(0.5, 0.5);
   bolapuas4.scale.setTo(0.4, 0.4);
   bolapuas4.body.setCircle(185);
   tween4 = game.add.tween(bolapuas4).to({ y: 990 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true)

   bolapuas5 = game.add.sprite(440, 770, 'bolapuas');
   game.physics.enable(bolapuas5, Phaser.Physics.ARCADE);
   bolapuas5.body.enable = true;
   bolapuas5.body.immovable = true;
   bolapuas5.anchor.setTo(0.5, 0.5);
   bolapuas5.scale.setTo(0.4, 0.4);
   bolapuas5.body.setCircle(185);
   tween5 = game.add.tween(bolapuas5).to({ y: 990 }, 3000, Phaser.Easing.Linear.None, true, 0, 1000, true)

    map = game.add.tilemap('map', 64, 64);
    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,110);
    map.setTileIndexCallback(0, this.dead, this);
    map.setTileIndexCallback(1, this.win, this);
    map.setCollision(16);
    layer = map.createLayer(0);
    layer.resizeWorld();

    game.camera.follow(sprite);

    baseboomerang = game.add.sprite(960, 360, 'baseboomerang');
    baseboomerang.anchor.setTo(0.5, 0.5);
    baseboomerang.scale.setTo(0.3, 0.3);

    boomerang = game.add.sprite(960, 360, 'boomerang');
    game.physics.enable(boomerang, Phaser.Physics.ARCADE);
    boomerang.body.enable = true;
    boomerang.body.immovable = true;
    boomerang.anchor.setTo(0.5, 0.5);
    boomerang.scale.setTo(0.3, 0.3);
    boomerang.body.setCircle(160);
    boomerang.pivot.x = 400;

    baseboomerang2 = game.add.sprite(1390, 768, 'baseboomerang');
    baseboomerang2.anchor.setTo(0.5, 0.5);
    baseboomerang2.scale.setTo(0.3, 0.3);

    boomerang2 = game.add.sprite(1390, 768, 'boomerang');
    game.physics.enable(boomerang2, Phaser.Physics.ARCADE);
    boomerang2.body.enable = true;
    boomerang2.body.immovable = true;
    boomerang2.anchor.setTo(0.5, 0.5);
    boomerang2.scale.setTo(0.3, 0.3);
    boomerang2.body.setCircle(160);
    boomerang2.pivot.x = 400;

    baseboomerang3 = game.add.sprite(353, 223, 'baseboomerang');
    baseboomerang3.anchor.setTo(0.5, 0.5);
    baseboomerang3.scale.setTo(0.3, 0.3);

    boomerang3 = game.add.sprite(353, 223, 'boomerang');
    game.physics.enable(boomerang3, Phaser.Physics.ARCADE);
    boomerang3.body.enable = true;
    boomerang3.body.immovable = true;
    boomerang3.anchor.setTo(0.5, 0.5);
    boomerang3.scale.setTo(0.3, 0.3);
    boomerang3.body.setCircle(160);
    boomerang3.pivot.x = 400;

    baseboomerang4 = game.add.sprite(220, 415, 'baseboomerang');
    baseboomerang4.anchor.setTo(0.5, 0.5);
    baseboomerang4.scale.setTo(0.3, 0.3);

    boomerang4 = game.add.sprite(220, 415, 'boomerang');
    game.physics.enable(boomerang4, Phaser.Physics.ARCADE);
    boomerang4.body.enable = true;
    boomerang4.body.immovable = true;
    boomerang4.anchor.setTo(0.5, 0.5);
    boomerang4.scale.setTo(0.3, 0.3);
    boomerang4.body.setCircle(160);
    boomerang4.pivot.x = 400;

    musiconoff = game.add.button(330, 60, 'musiconoff', this.musicoffon, this, 1, 0);
    musiconoff.anchor.setTo(0.5, 0.5);
    musiconoff.scale.setTo(0.8, 0.8);
    musiconoff.fixedToCamera = true;


  },
  update: function(){
    sprite.rotation = game.physics.arcade.moveToPointer(sprite, 60, game.input.activePointer, 500);
    game.physics.arcade.collide(sprite, layer);
    game.physics.arcade.collide(sprite, portalwin, this.win);


    game.physics.arcade.collide(sprite, bolapuas3, this.dead);
    game.physics.arcade.collide(sprite, bolapuas4, this.dead);
    game.physics.arcade.collide(sprite, bolapuas5, this.dead);
    game.physics.arcade.collide(sprite, boomerang, this.dead);
    game.physics.arcade.collide(sprite, boomerang2, this.dead);
    game.physics.arcade.collide(sprite, boomerang3, this.dead);
    game.physics.arcade.collide(sprite, boomerang4, this.dead);
    boomerang.rotation += 0.05;
    boomerang2.rotation += 0.05;
    boomerang3.rotation += 0.05;
    boomerang4.rotation -= 0.05;

  },

  render: function(){
      //game.debug.pointer( game.input.activePointer );
      //game.debug.body(boomerang);
  },

dead: function(){

sprite.x = 100;
sprite.y = 100;

},
win: function(){
  nivel = 3;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
startLevel('Nivel3');

},

musicoffon: function(){

if (sonando == true){
  sonando = false;

  musiconoff.setFrames(1,0);
  musiconoff.frame = 0;
  greenlvl.stop();
}else{


  musiconoff.setFrames(0,1);
  musiconoff.frame = 1;
  greenlvl.play();
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
