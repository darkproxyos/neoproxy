# Material de referencia (2026-10-01)

Imágenes recibidas sin instrucción puntual — guardadas acá como mood
board, sin aplicar ningún cambio al código ni al canon actual.

- `roster-poster-v1.png`, `roster-poster-v2.png`: pósters de roster
  completo. Usan nombres distintos a los de `components/proxyverse/agents.ts`
  (Gennos en vez de Genos, Trizkter en vez de Trickster, Daemon en vez
  de D) y agregan un personaje nuevo, "Ángel", que no existe en el sitio.
- `darkproxy-zaphkiel-alt.png`: retrato de DarkProxy — composición muy
  similar al canon ya usado en `/manifesto` (`public/canon/darkproxy-v1.png`),
  posible versión alternativa/actualizada de esa misma pieza.
- `manifesto-wallpaper-sistema-ilusion.jpg`: pieza atmosférica con la
  frase "El sistema es ilusión. Solo tu consciencia decide."
- `spatial-ontology-os-infographic.png`, `signal-economy-infographic.png`:
  documentos de arquitectura conceptual (Spatial Ontology OS,
  economía de tokens SIGNAL). Corresponden a la visión Fase B/C que
  CLAUDE.md marca explícitamente como "NO implementar ahora".

Nada de esto está reconciliado con el estado real del repo. Antes de
usar cualquiera de estas piezas hay que decidir explícitamente: si
`roster-poster-v1/v2` implican renombrar agentes o sumar a Ángel, si
`darkproxy-zaphkiel-alt.png` reemplaza el canon actual, y si/cuándo se
aborda la arquitectura Signal/Ontology.

## Serie de máscaras mempo por agente (2026-11-16)

Cuatro renders de Gemini explorando una máscara mempo física (PLA +
resina) por agente, coloreada con la identidad de cada uno — evolución
de la idea original de un solo mempo estándar (negro + resina verde) a
una línea coleccionable completa. Guardadas acá a pedido explícito
("guardemoslo como referencia artística para futuros productos"), sin
aplicar nada todavía: ningún producto real, ninguna página de shop, nada
de esto está fabricado.

- `mempo-d-v1.jpg`: máscara de **D** (nombrada "Daemon" por Gemini —
  el nombre real del agente es solo "D", `components/proxyverse/agents.ts`;
  "Daemon"/"the anomaly" es lenguaje real de su propio tagline, no un error
  de fondo, pero no es el nombre). Color: biomecánico rojo sangre —
  coincide con precisión con `color: '#cc0000'` en agents.ts y con el
  canon real (`public/canon/d-v1.jpg`), hasta el glifo "D" en el mentón.
- `mempo-metatron-v1.jpg`: máscara de **Metatron**, nombre ya correcto.
  Color: dorado/geometría sagrada — coincide con `color: '#ffb800'` y
  con el canon real (`public/canon/metatron-v1.jpg`).
- `mempo-genos-v1.jpg`: máscara de **Genos** (nombrada "Gennos" por
  Gemini, doble N — el real es `genos`, una sola N). Color: azul cian
  brillante — cerca pero no exacto; el real es `color: '#5f95c9'`, un
  acero más apagado, no el cian saturado del render.
- `mempo-trickster-v1.jpg`: máscara de **Trickster** (nombrada
  "Trizkter" por Gemini — el real es `trickster`). Color: púrpura +
  verde ácido con naipes/bufón — interpretación libre, no estrictamente
  canon: el color real es `color: '#b400ff'`, violeta puro, sin verde en
  la paleta oficial.

Chequeo de fabricación (para cuando se retome): pintura, resina teñida
y un objeto real incrustado (la carta quemada de Trickster) son fáciles
con el proceso ya usado en el taller; el acabado cromado de Metatron y
Genos necesita un paso de post-proceso (spray cromado o vinilo, no sale
de PLA crudo) y la retroiluminación interna de Metatron/Genos/D implica
electrónica real (LED + batería) — un Genesis Node aparte a documentar,
no solo geometría.
