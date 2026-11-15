var gameRatio = window.innerWidth/window.innerHeight;
var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, document.getElementById('game'));
var firstRunLandscape;

// Digiz 0.2: Nivel1..29 ya no se registran acá de entrada -- startLevel()
// (js/levelLoader.js) los agrega con game.state.add() recién cuando el
// script de ese nivel termina de cargar por primera vez.
game.state.add('Menu',Menu);
game.state.add('Menunivel',Menunivel);

game.state.start('Menu');

// Un solo detector de cambio de tamaño para todo el juego (antes se agregaba uno por nivel).
window.addEventListener('resize', function () { game.scale.refresh(); });
