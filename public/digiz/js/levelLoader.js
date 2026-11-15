// Antes: index.html metía los 29 scripts de nivel como <script> fijos y
// index.js los registraba todos con game.state.add() de entrada -- se
// parseaban los 29 aunque jugaras solo el nivel 1 (~tanto JS como todo el
// resto del sitio junto). Ahora cada nivel se carga recién cuando se
// elige, vía un <script> inyectado dinámicamente -- el resto del juego
// (menunivel.js, cada nivelN.js) llama startLevel('NivelN') en vez de
// game.state.start('NivelN') directo.
var __loadedStates = { Menu: true, Menunivel: true };

function startLevel(name) {
  if (__loadedStates[name]) {
    game.state.start(name);
    return;
  }
  var num = name.match(/\d+/)[0];
  var script = document.createElement('script');
  script.src = 'js/nivel' + num + '.js';
  script.onload = function () {
    game.state.add(name, window[name]);
    __loadedStates[name] = true;
    game.state.start(name);
  };
  script.onerror = function () {
    console.error('Digiz: no se pudo cargar ' + script.src);
  };
  document.body.appendChild(script);
}
