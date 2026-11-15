var nivel = 1;
var nivelg = localStorage.getItem("nivel");
if(nivelg < nivel){
  localStorage.setItem("nivel",nivel);
};
var datonivel = localStorage.getItem("nivel");
var greenlvl;
var orangelvl;
var redlvl;
var purplelvl;
var whitelvl;
var Menunivel = {
  preload: function(){
    game.stage.backgroundColor = '#000000';
    game.load.image("boton", "assets/sprites/boton.png");
    game.load.image("logo", "assets/map/digizlogo.png");
    game.load.image('fondomenu', 'assets/map/fondolvl2.png');

    game.load.audio('greenlvl', ['assets/audio/greenlvl.mp3']);
    game.load.audio('orangelvl', ['assets/audio/orangelvl.mp3']);
    game.load.audio('redlvl', ['assets/audio/redlvl.mp3']);
    game.load.audio('purplelvl', ['assets/audio/purplelvl.mp3']);
    game.load.audio('whitelvl', ['assets/audio/whitelvl.mp3']);
    game.load.audio('finallvl', ['assets/audio/finallvl.mp3']);
    game.load.audio('portalfx', ['assets/audio/portalfx.mp3']);


    game.load.image("nivel1", "assets/sprites/numnivel/1.png");
    game.load.image("nivel2", "assets/sprites/numnivel/2.png");
    game.load.image("nivel3", "assets/sprites/numnivel/3.png");
    game.load.image("nivel4", "assets/sprites/numnivel/4.png");
    game.load.image("nivel5", "assets/sprites/numnivel/5.png");
    game.load.image("nivel6", "assets/sprites/numnivel/6.png");
    game.load.image("nivel7", "assets/sprites/numnivel/7.png");
    game.load.image("nivel8", "assets/sprites/numnivel/8.png");
    game.load.image("nivel9", "assets/sprites/numnivel/9.png");
    game.load.image("nivel10", "assets/sprites/numnivel/10.png");
    game.load.image("nivel11", "assets/sprites/numnivel/11.png");
    game.load.image("nivel12", "assets/sprites/numnivel/12.png");
    game.load.image("nivel13", "assets/sprites/numnivel/13.png");
    game.load.image("nivel14", "assets/sprites/numnivel/14.png");
    game.load.image("nivel15", "assets/sprites/numnivel/15.png");
    game.load.image("nivel16", "assets/sprites/numnivel/16.png");
    game.load.image("nivel17", "assets/sprites/numnivel/17.png");
    game.load.image("nivel18", "assets/sprites/numnivel/18.png");
    game.load.image("nivel19", "assets/sprites/numnivel/19.png");
    game.load.image("nivel20", "assets/sprites/numnivel/20.png");
    game.load.image("nivel21", "assets/sprites/numnivel/21.png");
    game.load.image("nivel22", "assets/sprites/numnivel/22.png");
    game.load.image("nivel23", "assets/sprites/numnivel/23.png");
    game.load.image("nivel24", "assets/sprites/numnivel/24.png");
    game.load.image("nivel25", "assets/sprites/numnivel/25.png");
    game.load.image("nivel26", "assets/sprites/numnivel/26.png");
    game.load.image("nivel27", "assets/sprites/numnivel/27.png");
    game.load.image("nivel28", "assets/sprites/numnivel/28.png");
    game.load.image("nivel29", "assets/sprites/numnivel/29.png");
    game.load.image("nivel30", "assets/sprites/numnivel/30.png");


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

    game.add.tileSprite(0, 0, 1000, 1000, 'fondomenu');

greenlvl = game.add.audio('greenlvl');
orangelvl = game.add.audio('orangelvl');
redlvl = game.add.audio('redlvl');
purplelvl = game.add.audio('purplelvl');
whitelvl = game.add.audio('whitelvl');
finallvl = game.add.audio('finallvl');


    greenlvl.loop = true;
    orangelvl.loop = true;
    redlvl.loop = true;
    purplelvl.loop = true;
    whitelvl.loop = true;

  var boton1 = this.add.button(game.world.centerX-110,game.world.centerY-200,'nivel1',function(){startLevel('Nivel1')},this);
        boton1.anchor.setTo(0.5);

        var boton2 = this.add.button(game.world.centerX-65,game.world.centerY-200,'nivel2',function(){startLevel('Nivel2')},this);
        boton2.anchor.setTo(0.5);
        boton2.inputEnabled = false;
        boton2.alpha = 0.2;

        var boton3 = this.add.button(game.world.centerX-20,game.world.centerY-200,'nivel3',function(){startLevel('Nivel3')},this);
        boton3.anchor.setTo(0.5);
        boton3.inputEnabled = false;
        boton3.alpha = 0.2;

        var boton4 = this.add.button(game.world.centerX+25,game.world.centerY-200,'nivel4',function(){startLevel('Nivel4')},this);
        boton4.anchor.setTo(0.5);
        boton4.inputEnabled = false;
        boton4.alpha = 0.2;

        var boton5 = this.add.button(game.world.centerX+70,game.world.centerY-200,'nivel5',function(){startLevel('Nivel5')},this);
        boton5.anchor.setTo(0.5);
        boton5.inputEnabled = false;
        boton5.alpha = 0.2;

        var boton6 = this.add.button(game.world.centerX+115,game.world.centerY-200,'nivel6',function(){startLevel('Nivel6')},this);
        boton6.anchor.setTo(0.5);
        boton6.inputEnabled = false;
        boton6.alpha = 0.2;

        var boton7 = this.add.button(game.world.centerX-110,game.world.centerY-150,'nivel7',function(){startLevel('Nivel7')},this);
        boton7.anchor.setTo(0.5);
        boton7.inputEnabled = false;
        boton7.alpha = 0.2;

        var boton8 = this.add.button(game.world.centerX-65,game.world.centerY-150,'nivel8',function(){startLevel('Nivel8')},this);
        boton8.anchor.setTo(0.5);
        boton8.inputEnabled = false;
        boton8.alpha = 0.2;

        var boton9 = this.add.button(game.world.centerX-20,game.world.centerY-150,'nivel9',function(){startLevel('Nivel9')},this);
        boton9.anchor.setTo(0.5);
        boton9.inputEnabled = false;
        boton9.alpha = 0.2;

        var boton10 = this.add.button(game.world.centerX+25,game.world.centerY-150,'nivel10',function(){startLevel('Nivel10')},this);
        boton10.anchor.setTo(0.5);
        boton10.inputEnabled = false;
        boton10.alpha = 0.2;

        var boton11 = this.add.button(game.world.centerX+70,game.world.centerY-150,'nivel11',function(){startLevel('Nivel11')},this);
        boton11.anchor.setTo(0.5);
        boton11.inputEnabled = false;
        boton11.alpha = 0.2;

        var boton12 = this.add.button(game.world.centerX+115,game.world.centerY-150,'nivel12',function(){startLevel('Nivel12')},this);
        boton12.anchor.setTo(0.5);
        boton12.inputEnabled = false;
        boton12.alpha = 0.2;

        var boton13 = this.add.button(game.world.centerX-110,game.world.centerY-100,'nivel13',function(){startLevel('Nivel13')},this);
        boton13.anchor.setTo(0.5);
        boton13.inputEnabled = false;
        boton13.alpha = 0.2;

        var boton14 = this.add.button(game.world.centerX-65,game.world.centerY-100,'nivel14',function(){startLevel('Nivel14')},this);
        boton14.anchor.setTo(0.5);
        boton14.inputEnabled = false;
        boton14.alpha = 0.2;

        var boton15 = this.add.button(game.world.centerX-20,game.world.centerY-100,'nivel15',function(){startLevel('Nivel15')},this);
        boton15.anchor.setTo(0.5);
        boton15.inputEnabled = false;
        boton15.alpha = 0.2;

        var boton16 = this.add.button(game.world.centerX+25,game.world.centerY-100,'nivel16',function(){startLevel('Nivel16')},this);
        boton16.anchor.setTo(0.5);
        boton16.inputEnabled = false;
        boton16.alpha = 0.2;

        var boton17 = this.add.button(game.world.centerX+70,game.world.centerY-100,'nivel17',function(){startLevel('Nivel17')},this);
        boton17.anchor.setTo(0.5);
        boton17.inputEnabled = false;
        boton17.alpha = 0.2;

        var boton18 = this.add.button(game.world.centerX+115,game.world.centerY-100,'nivel18',function(){startLevel('Nivel18')},this);
        boton18.anchor.setTo(0.5);
        boton18.inputEnabled = false;
        boton18.alpha = 0.2;

        var boton19 = this.add.button(game.world.centerX-110,game.world.centerY-50,'nivel19',function(){startLevel('Nivel19')},this);
        boton19.anchor.setTo(0.5);
        boton19.inputEnabled = false;
        boton19.alpha = 0.2;

        var boton20 = this.add.button(game.world.centerX-65,game.world.centerY-50,'nivel20',function(){startLevel('Nivel20')},this);
        boton20.anchor.setTo(0.5);
        boton20.inputEnabled = false;
        boton20.alpha = 0.2;

        var boton21 = this.add.button(game.world.centerX-20,game.world.centerY-50,'nivel21',function(){startLevel('Nivel21')},this);
        boton21.anchor.setTo(0.5);
        boton21.inputEnabled = false;
        boton21.alpha = 0.2;

        var boton22 = this.add.button(game.world.centerX+25,game.world.centerY-50,'nivel22',function(){startLevel('Nivel22')},this);
        boton22.anchor.setTo(0.5);
        boton22.inputEnabled = false;
        boton22.alpha = 0.2;

        var boton23 = this.add.button(game.world.centerX+70,game.world.centerY-50,'nivel23',function(){startLevel('Nivel23')},this);
        boton23.anchor.setTo(0.5);
        boton23.inputEnabled = false;
        boton23.alpha = 0.2;

        var boton24 = this.add.button(game.world.centerX+115,game.world.centerY-50,'nivel24',function(){startLevel('Nivel24')},this);
        boton24.anchor.setTo(0.5);
        boton24.inputEnabled = false;
        boton24.alpha = 0.2;

        var boton25 = this.add.button(game.world.centerX-110,game.world.centerY,'nivel25',function(){startLevel('Nivel25')},this);
        boton25.anchor.setTo(0.5);
        boton25.inputEnabled = false;
        boton25.alpha = 0.2;

        var boton26 = this.add.button(game.world.centerX-65,game.world.centerY,'nivel26',function(){startLevel('Nivel26')},this);
        boton26.anchor.setTo(0.5);
        boton26.inputEnabled = false;
        boton26.alpha = 0.2;

        var boton27 = this.add.button(game.world.centerX-20,game.world.centerY,'nivel27',function(){startLevel('Nivel27')},this);
        boton27.anchor.setTo(0.5);
        boton27.inputEnabled = false;
        boton27.alpha = 0.2;

        var boton28 = this.add.button(game.world.centerX+25,game.world.centerY,'nivel28',function(){startLevel('Nivel28')},this);
        boton28.anchor.setTo(0.5);
        boton28.inputEnabled = false;
        boton28.alpha = 0.2;

        var boton29 = this.add.button(game.world.centerX+70,game.world.centerY,'nivel29',function(){startLevel('Nivel29')},this);
        boton29.anchor.setTo(0.5);
        boton29.inputEnabled = false;
        boton29.alpha = 0.2;

        var boton30 = this.add.button(game.world.centerX+115,game.world.centerY,'nivel30');
        boton30.anchor.setTo(0.5);
        boton30.inputEnabled = false;
        boton30.alpha = 0.2;


        for (var i = 0; i < parseInt(datonivel); i++) {
          var num = i+1;
       var botonn = eval("boton"+num);
          //  botonn.visible = true;
            botonn.inputEnabled = true;
            botonn.alpha = 1;
        }


  },
  render: function(){
      //game.debug.pointer( game.input.activePointer );
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
