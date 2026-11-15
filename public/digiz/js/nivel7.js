var sprite;
var Nivel7 = {
  preload: function(){
    game.stage.backgroundColor = '#000000';
    game.load.image('fondo', 'assets/map/fondolvl2.png');
    game.load.spritesheet('portalwin', 'assets/sprites/portalwin.png', 64, 64, 8);
    game.load.image('arrow', 'assets/sprites/arrow.png');
    game.load.image('baseboomerang', 'assets/sprites/baseboomeranglvl2.png');
    game.load.image('boomerang', 'assets/sprites/boomeranglvl2.png');
    game.load.image('sierra', 'assets/sprites/sierra.png');
    game.load.tilemap('map','assets/map/nivel7.csv');
    game.load.image('tileset','assets/map/tilenivel2.png')
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

      orangelvl.play();


    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.add.tileSprite(0, 0, 1920, 1280, 'fondo');

    portalwin = game.add.sprite(1622, 702, 'portalwin');
    game.physics.enable(portalwin, Phaser.Physics.ARCADE);
    var portalanim = portalwin.animations.add('portalanim');
    portalwin.animations.play('portalanim', 30, true);
    portalwin.body.enable = true;
    portalwin.anchor.setTo(0.5);

  sprite = game.add.sprite(125, 1170, 'arrow');
  game.physics.enable(sprite, Phaser.Physics.ARCADE);
   sprite.body.collideWorldBounds = true;
   sprite.body.enable = true;
   sprite.scale.setTo(1.3, 1.3);
   game.physics.enable(sprite, Phaser.Physics.ARCADE);
   sprite.body.setSize(18, 18, +13,+1);
   sprite.body.setCircle(16);
   sprite.anchor.setTo(0.5);
   sprite.body.allowRotation = true;

   sierra = game.add.sprite(130, 577, 'sierra');
   game.physics.enable(sierra, Phaser.Physics.ARCADE);
   sierra.body.enable = true;
   sierra.body.immovable = true;
   sierra.anchor.setTo(0.5, 0.5);
   sierra.scale.setTo(0.3, 0.3);
   sierra.body.setCircle(185);
   tween = game.add.tween(sierra).to({ y: 1015 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

   sierra2 = game.add.sprite(1792, 1145, 'sierra');
   game.physics.enable(sierra2, Phaser.Physics.ARCADE);
   sierra2.body.enable = true;
   sierra2.body.immovable = true;
   sierra2.anchor.setTo(0.5, 0.5);
   sierra2.scale.setTo(0.3, 0.3);
   sierra2.body.setCircle(185);
   tween2 = game.add.tween(sierra2).to({ y: 677 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);



    map = game.add.tilemap('map', 64, 64);

    map.addTilesetImage('tileset');
    map.setCollisionBetween(0,110);
    map.setTileIndexCallback(0, this.dead, this);
    map.setTileIndexCallback(1, this.win, this);
    map.setCollision(16);

    layer = map.createLayer(0);

    layer.resizeWorld();

    game.camera.follow(sprite);

    baseboomerang = game.add.sprite(674, 223, 'baseboomerang');
    baseboomerang.anchor.setTo(0.5, 0.5);
    baseboomerang.scale.setTo(0.3, 0.3);

    boomerang = game.add.sprite(674, 223, 'boomerang');
    game.physics.enable(boomerang, Phaser.Physics.ARCADE);
    boomerang.body.enable = true;
    boomerang.body.immovable = true;
    boomerang.anchor.setTo(0.5, 0.5);
    boomerang.scale.setTo(0.3, 0.3);
    boomerang.body.setCircle(160);
    boomerang.pivot.x = 400;

    baseboomerang2 = game.add.sprite(674, 1056, 'baseboomerang');
    baseboomerang2.anchor.setTo(0.5, 0.5);
    baseboomerang2.scale.setTo(0.3, 0.3);

    boomerang2 = game.add.sprite(674, 1056, 'boomerang');
    game.physics.enable(boomerang2, Phaser.Physics.ARCADE);
    boomerang2.body.enable = true;
    boomerang2.body.immovable = true;
    boomerang2.anchor.setTo(0.5, 0.5);
    boomerang2.scale.setTo(0.3, 0.3);
    boomerang2.body.setCircle(160);
    boomerang2.pivot.x = 400;

    baseboomerang3 = game.add.sprite(1050, 220, 'baseboomerang');
    baseboomerang3.anchor.setTo(0.5, 0.5);
    baseboomerang3.scale.setTo(0.3, 0.3);

    boomerang3 = game.add.sprite(1050, 220, 'boomerang');
    game.physics.enable(boomerang3, Phaser.Physics.ARCADE);
    boomerang3.body.enable = true;
    boomerang3.body.immovable = true;
    boomerang3.anchor.setTo(0.5, 0.5);
    boomerang3.scale.setTo(0.3, 0.3);
    boomerang3.body.setCircle(160);
    boomerang3.pivot.x = 400;

    musiconoff = game.add.button(330, 60, 'musiconoff', this.musicoffon, this, 1, 0);
    musiconoff.anchor.setTo(0.5, 0.5);
    musiconoff.scale.setTo(0.8, 0.8);
    musiconoff.fixedToCamera = true;

  },
  update: function(){
    sprite.rotation = game.physics.arcade.moveToPointer(sprite, 60, game.input.activePointer, 500);
    game.physics.arcade.collide(sprite, layer);
    game.physics.arcade.collide(sprite, portalwin, this.win);
    game.physics.arcade.collide(sprite, sierra, this.dead);
    game.physics.arcade.collide(sprite, sierra2, this.dead);
    game.physics.arcade.collide(sprite, boomerang, this.dead);
    game.physics.arcade.collide(sprite, boomerang2, this.dead);
    game.physics.arcade.collide(sprite, boomerang3, this.dead);
    sierra.rotation -= 0.08;
    sierra2.rotation -= 0.08;
    boomerang.rotation += 0.05;
    boomerang2.rotation -= 0.05;
    boomerang3.rotation += 0.05;

  },

  render: function(){
      //game.debug.pointer( game.input.activePointer );
      //game.debug.body(sierra);
  },


dead: function(){

sprite.x = 125;
sprite.y = 1170;

},
win: function(){
  nivel = 8;
    var nivelg = localStorage.getItem("nivel");
    if(nivelg < nivel){
      localStorage.setItem("nivel",nivel);
    }
startLevel('Nivel8')

},

musicoffon: function(){

if (sonando == true){
  sonando = false;

  musiconoff.setFrames(1,0);
  musiconoff.frame = 0;
  orangelvl.stop();
}else{


  musiconoff.setFrames(0,1);
  musiconoff.frame = 1;
  orangelvl.play();
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
