import Link from 'next/link'
import CapasApp from '@/components/capas/CapasApp'

const mono = "'Space Mono', monospace"
const ACCENT = '#ff8fb4'
const CYAN = '#9fe8ff'

const H = ({ children, c = CYAN }: { children: React.ReactNode; c?: string }) => (
  <div style={{ fontSize: 10, letterSpacing: 4, color: c, margin: '0 0 16px' }}>{children}</div>
)
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 11, lineHeight: 2, color: '#a9bdd4', margin: '0 0 12px' }}>{children}</p>
)
const Card = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: '#080c12', border: '1px solid #ffffff12', borderTop: `2px solid ${ACCENT}`, padding: '16px 18px 8px' }}>
    <div style={{ fontSize: 9, letterSpacing: 3, color: `${ACCENT}aa`, marginBottom: 6 }}>{n}</div>
    <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#fff', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)

export default function CapasPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 9, letterSpacing: 6, color: `${ACCENT}aa`, marginBottom: 14 }}>NPX-CAP // ESCULTURA DEL TIEMPO · <Link href="/fenomenos" style={{ color: `${ACCENT}aa` }}>SERIE FENÓMENOS</Link></div>
        <h1 style={{ fontSize: 'clamp(30px, 7vw, 56px)', letterSpacing: 8, color: ACCENT, textShadow: `0 0 44px ${ACCENT}44`, margin: '0 0 18px', lineHeight: 1.05 }}>CAPAS</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: '#c8daf0', maxWidth: 860, margin: '0 0 10px' }}>
          Un mundo plano gobernado por una ecuación real. Lo pintas, y su historia entera —cada instante apilado hacia arriba— se vuelve un sólido que se puede
          imprimir. <b style={{ color: '#fff' }}>La altura es el tiempo</b>: cada capa de resina será un momento del universo que tocaste.
        </p>
        <p style={{ fontSize: 10.5, lineHeight: 1.95, color: '#7f96b2', maxWidth: 860, margin: '0 0 22px' }}>
          Las ecuaciones, la pila de tiempo y la detección de islas son ideas conocidas. Lo que hay aquí es una forma de juntarlas sobre un mundo que se pinta en vivo:
          el estiramiento del tiempo se lee como una velocidad de la luz y el árbol de partes como la lista de soportes. Abajo está lo que se midió y lo que no sé.
        </p>
        <ol style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 26px', listStyle: 'none', padding: 0, margin: '0 0 30px', fontSize: 10, letterSpacing: 1.6, color: '#9fb4cc' }}>
          <li><b style={{ color: ACCENT }}>1 · PINTA</b> el mundo con clic o arrastre</li>
          <li><b style={{ color: ACCENT }}>2 · GIRA</b> la perilla mientras corre</li>
          <li><b style={{ color: ACCENT }}>3 · ARRASTRA</b> la línea de tiempo: el corte baja a ese instante</li>
          <li><b style={{ color: ACCENT }}>4 · IMPRIME</b>: descarga el STL o pídelo en resina</li>
        </ol>

        <CapasApp />

        <section style={{ marginTop: 64 }}>
          <H>CÓMO SE LEE LA PIEZA</H>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            <Card n="01" title="La altura es el tiempo">
              <P>Cada capa que ves apilarse es el mundo de la izquierda en un instante. El color también es tiempo: de la base, el pasado, a la cima, el presente. Si arrastras la línea de tiempo, el corte del sólido baja a ese instante y el plano brillante muestra el mundo tal como era.</P>
            </Card>
            <Card n="02" title="Imprimir es reproducir">
              <P>La pieza se imprime de pie, sin reorientar. Con capas de resina de 50 µm, cada capa de simulación equivale a varias decenas de capas de impresión (la ficha lo calcula). Cuando la impresora termina, el cabezal recorrió la historia completa del mundo. El botón «imprimir» de la línea de tiempo muestra ese viaje.</P>
            </Card>
            <Card n="03" title="La causalidad decide si se imprime">
              <P>La resina no cura en el aire: una superficie que se inclina más de 45° sobre la vertical necesita soporte. En el mundo, eso equivale a una señal que viaja más rápido que el estiramiento del tiempo. El <b style={{ color: '#fff' }}>aspecto causal</b> es el menor alto/ancho con el que como mucho el 3 % de la superficie queda en voladizo; por definición equivale a cuántas veces cruza el mundo, durante la pieza, la señal más rápida (el 97 % de la superficie se mueve más lento). Es la velocidad de la luz de ese universo.</P>
            </Card>
            <Card n="04" title="El linaje es la lista de soportes">
              <P>En cada capa se cuentan las partes conexas y se siguen de una capa a la siguiente. Una parte que aparece sin padre es una isla en el aire: un soporte (es la detección de islas de cualquier laminador, aquí calculada sobre la simulación). Una con dos hijas es una rama; con dos padres, un puente. Que cada capa descienda de la anterior es condición necesaria para imprimir sin soportes, no suficiente: además hay que respetar el ángulo, y de eso se ocupa el aspecto causal.</P>
            </Card>
            <Card n="05" title="La física también se esculpe">
              <P>La perilla de la ley se puede girar mientras el mundo corre. Queda registrada con su capa en la receta, así que la pieza guarda una cicatriz a la altura exacta del giro. Las pinceladas también: el enlace que copias reconstruye todo, en el orden en que ocurrió.</P>
            </Card>
          </div>
        </section>

        <section style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 28, alignItems: 'start' }}>
          <div>
            <H c="#7cf0b0">LO QUE ESTÁ MEDIDO</H>
            <P>Todo esto lo comprueba <code style={{ color: '#fff' }}>scripts/capas/check.ts</code> en el repositorio; no depende de que el dibujo se vea bien.</P>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>Dipolo exacto.</b> En DEFECTOS, un dipolo pintado en un campo uniforme suma exactamente un vórtice + y uno −, también cuando cruza el borde del toroide. La carga total, en cambio, vale 0 siempre en un toroide, para cualquier campo (incluso uno lleno de NaN): es una identidad de la cuenta y no prueba nada de la física; la página la muestra como contador, no como prueba.</li>
              <li><b style={{ color: '#fff' }}>El corte coincide con la capa.</b> El área de la sección horizontal de la malla (fórmula del cordón sobre los triángulos que cruzan el plano) se compara con el área simulada de esa capa. Con la malla de exportación normal: coral 0,1–0,6 %, espirales 0,8–1,5 %, mitosis 1,6–4,1 % (las manchas chicas pierden detalle). Es coherencia de mi malla con mi propio muestreo, no una validación física.</li>
              <li><b style={{ color: '#fff' }}>Reproducible entre motores.</b> La misma receta da la misma pila de capas, bit a bit, en V8 (Node y Chromium) y en JavaScriptCore (Bun, el motor de Safari): ocho recetas de referencia, con pinceladas y giros de perilla, dan las mismas huellas. No pude probar SpiderMonkey (Firefox) ni hardware ARM. Las ecuaciones solo usan suma, resta, producto, cociente y raíz, que el estándar IEEE fija exactamente; nada de senos ni exponenciales dentro del bucle, porque en un sistema caótico un dígito de diferencia se amplifica hasta otro universo.</li>
              <li><b style={{ color: '#fff' }}>Voladizo, pero no islas.</b> Con el aspecto causal automático, entre 1 % y 4 % de la superficie mira hacia abajo a menos de 45° de la vertical: es lo esperable, porque el solver apunta a ese 3 %. Lo que no limita son las islas: con la receta de fábrica nacen 0 partes en el aire en coral, 4 en mitosis, 7 en espirales y 107 en defectos (no cuentan las que nacen dentro de la base maciza: quedan apoyadas en ella). El aspecto causal además coincide (menos de 0,2 %) con el cuantil 97 % de cuántos anchos del mundo recorre cada trozo de superficie, calculado aparte; es una identidad de la definición, no una medición del frente de la ecuación.</li>
              <li><b style={{ color: '#fff' }}>Mundo finito.</b> Con pinceladas al azar en las cuatro leyes, ningún valor se vuelve NaN ni infinito, y reproducir la receta da la misma pila que la sesión pintada en vivo. Esa prueba existe porque el pincel de vórtices dividía por cero en una celda y el NaN se contagiaba a todo el mundo, y la «carga total = 0» lo dejó pasar. Además, las huellas de referencia están guardadas: si un cambio del motor las mueve, la prueba falla antes de que los enlaces viejos den otra pieza.</li>
            </ul>
          </div>
          <div>
            <H c="#ffb86b">LO QUE NO SÉ</H>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>¿Algo nunca visto?</b> No puedo afirmarlo. Apilar el tiempo como altura es una técnica conocida —el «cubo espacio-tiempo» viene de la geografía del tiempo de Hägerstrand (1970) y es corriente en visualización— y hay quien ha impreso en 3D patrones de reacción-difusión. «Nacimiento = soporte» es la detección de islas de cualquier laminador de resina (en topología, el grafo de Reeb de la altura), y el aspecto causal es la regla de los 45° con otro nombre. No conozco otra herramienta que a la vez deje pintar el mundo en vivo, calcule el estiramiento causal y lea el linaje como lista de soportes, pero no puedo descartar que exista: lo propio es la integración y el reencuadre, no un algoritmo nuevo.</li>
              <li><b style={{ color: '#fff' }}>El «cono de luz» depende de la condición inicial.</b> Coral y mitosis nacen de una semilla central y por eso salen en embudo; con otras semillas la forma cambia. La pendiente del embudo sí es la velocidad del frente; que haya un embudo, no.</li>
              <li><b style={{ color: '#fff' }}>No hay ninguna pieza impresa todavía.</b> El puntaje de impresión es una estimación geométrica, no un resultado de taller. La primera prueba real en resina está pendiente, y la ficha de fabricación lo dice.</li>
              <li><b style={{ color: '#fff' }}>DEFECTOS es la más difícil de imprimir.</b> Sus filamentos son finos y el puntaje baja; es la más salvaje de ver y la menos amable con la resina.</li>
              <li><b style={{ color: '#fff' }}>Son modelos, no mediciones.</b> Gray–Scott, Barkley y Ginzburg–Landau son modelos matemáticos de juguete de fenómenos reales (química, tejido cardíaco, superfluidos). Aquí no se calibran contra ningún experimento.</li>
              <li><b style={{ color: '#fff' }}>La silueta recorta un mundo toroidal.</b> El mundo simulado se cierra sobre sí mismo, pero la pieza tiene caras: una mancha que cruza el borde reaparece al otro lado y cuenta como una parte nueva.</li>
            </ul>
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <H>FUENTES</H>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 10.5, lineHeight: 2, color: '#8fa8c4' }}>
            <li>Gray, P. y Scott, S. K. (1984). Autocatalytic reactions in the isothermal, continuous stirred tank reactor. <i>Chem. Eng. Sci.</i> 39, 1087–1097.</li>
            <li>Pearson, J. E. (1993). Complex patterns in a simple system. <i>Science</i> 261, 189–192. · Sims, K. <i>Reaction-Diffusion Tutorial</i> (karlsims.com/rd.html), de donde salen las constantes del coral.</li>
            <li>Barkley, D. (1991). A model for fast computer simulation of waves in excitable media. <i>Physica D</i> 49, 61–70. · Winfree, A. T. (1972). Spiral waves of chemical activity. <i>Science</i> 175, 634–636.</li>
            <li>Aranson, I. S. y Kramer, L. (2002). The world of the complex Ginzburg–Landau equation. <i>Rev. Mod. Phys.</i> 74, 99–143. · Chaté, H. y Manneville, P. (1996). Phase diagram of the two-dimensional complex Ginzburg–Landau equation. <i>Physica A</i> 224, 348–368.</li>
            <li>Hägerstrand, T. (1970). What about people in regional science? <i>Papers of the Regional Science Association</i> 24, 7–21.</li>
          </ul>
          <p style={{ fontSize: 10, lineHeight: 1.9, color: '#5d7490', margin: '18px 0 0' }}>
            Hermana de <Link href="/especimenes" style={{ color: CYAN }}>ESPECÍMENES</Link> (formas que nacen, mutan y mueren) y de <Link href="/geometrias" style={{ color: CYAN }}>GEOMETRÍAS</Link> (objetos exactos con nombre y teorema). Aquí la forma no se evoluciona ni se calcula de una fórmula: se deja vivir un mundo y se guarda su historia. Primera de la serie <Link href="/fenomenos" style={{ color: CYAN }}>FENÓMENOS</Link>, con <Link href="/humo" style={{ color: CYAN }}>HUMO SÓLIDO</Link>, <Link href="/trenza" style={{ color: CYAN }}>TRENZA</Link> y <Link href="/resonancia" style={{ color: CYAN }}>RESONANCIA</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
