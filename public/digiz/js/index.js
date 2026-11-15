var gameRatio = window.innerWidth/window.innerHeight;
var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, document.getElementById('game'));
var firstRunLandscape;

game.state.add('Menu',Menu);
game.state.add('Menunivel',Menunivel);
game.state.add('Nivel1',Nivel1);
game.state.add('Nivel2',Nivel2);
game.state.add('Nivel3',Nivel3);
game.state.add('Nivel4',Nivel4);
game.state.add('Nivel5',Nivel5);
game.state.add('Nivel6',Nivel6);
game.state.add('Nivel7',Nivel7);
game.state.add('Nivel8',Nivel8);
game.state.add('Nivel9',Nivel9);
game.state.add('Nivel10',Nivel10);
game.state.add('Nivel11',Nivel11);
game.state.add('Nivel12',Nivel12);
game.state.add('Nivel13',Nivel13);
game.state.add('Nivel14',Nivel14);
game.state.add('Nivel15',Nivel15);
game.state.add('Nivel16',Nivel16);
game.state.add('Nivel17',Nivel17);
game.state.add('Nivel18',Nivel18);
game.state.add('Nivel19',Nivel19);
game.state.add('Nivel20',Nivel20);
game.state.add('Nivel21',Nivel21);
game.state.add('Nivel22',Nivel22);
game.state.add('Nivel23',Nivel23);
game.state.add('Nivel24',Nivel24);
game.state.add('Nivel25',Nivel25);
game.state.add('Nivel26',Nivel26);
game.state.add('Nivel27',Nivel27);
game.state.add('Nivel28',Nivel28);
game.state.add('Nivel29',Nivel29);

game.state.start('Menu');

// Un solo detector de cambio de tamaño para todo el juego (antes se agregaba uno por nivel).
window.addEventListener('resize', function () { game.scale.refresh(); });
