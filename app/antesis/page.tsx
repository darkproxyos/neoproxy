import Link from 'next/link'
import AntesisApp from '@/components/antesis/AntesisApp'

const mono = "'Space Mono', monospace"
const ACCENT = '#d4b0ff', PINK = '#ff8fc8', CYAN = '#9fe8ff'
const H = ({ children, c = CYAN }: { children: React.ReactNode; c?: string }) => <div style={{ fontSize: 11.5, letterSpacing: 4, color: c, margin: '0 0 16px' }}>{children}</div>
const P = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 12.5, lineHeight: 2, color: '#a9bdd4', margin: '0 0 12px' }}>{children}</p>
const Card = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '2px 1px 1px 1px', borderColor: `${ACCENT} #ffffff12 #ffffff12 #ffffff12`, padding: '16px 18px 8px' }}>
    <div style={{ fontSize: 11, letterSpacing: 3, color: `${ACCENT}aa`, marginBottom: 6 }}>{n}</div>
    <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: '#fff', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)

export default function AntesisPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div className="an-layer" style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: `${ACCENT}aa`, marginBottom: 14 }}>NPX-ANTESIS // MECANISMO · <Link href="/geometrias" style={{ color: `${ACCENT}aa` }}>TALLER DE GEOMETRÍAS</Link></div>
        <h1 style={{ fontSize: 'clamp(36px, 9vw, 72px)', letterSpacing: 16, margin: '0 0 18px', lineHeight: 1.05, background: `linear-gradient(90deg,${ACCENT},#ffffff 55%,${PINK})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>ANTESIS</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: '#c8daf0', maxWidth: 900, margin: '0 0 10px' }}>
          Antesis es el momento en que una flor se abre. Aquí la flor es un mecanismo: una esfera de engranajes cónicos que giran todos juntos —gira uno y giran todos—, y sobre cada engranaje un pétalo o una corona que nace de una semilla.
          <b style={{ color: '#fff' }}> Cada pieza se imprime por separado y se arma</b>: núcleo, engranajes, pasadores y decoraciones.
        </p>
        <p style={{ fontSize: 11.5, lineHeight: 1.95, color: '#7f96b2', maxWidth: 900, margin: '0 0 26px' }}>
          Cada flor se calcula y se verifica en tu navegador: que los dientes no se traben en ninguna posición y que nada de lo que gira toque a un vecino en una vuelta entera. Arrastra para mirarla, separa las piezas para ver cómo se arma.
        </p>

        <AntesisApp />

        <section style={{ marginTop: 64 }}>
          <H>CÓMO FUNCIONA</H>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            <Card n="01" title="Conos que ruedan">
              <P>Un engranaje cónico es un cono que rueda sobre otro sin resbalar. Si todos los conos tienen el vértice en el centro de la esfera, cualquier par de vecinos se toca a lo largo de una línea que pasa por ese centro. Con ejes separados por un ángulo Σ, los semiángulos δA y δB suman Σ y cumplen NA · sen δB = NB · sen δA: de ahí sale la forma de cada cono a partir de sus dientes.</P>
            </Card>
            <Card n="02" title="Dos clases, una sola vuelta">
              <P>Los engranajes A solo tocan engranajes B y al revés. Por eso todos los ciclos de la red son pares y la red gira entera: los A en un sentido, los B en el otro. Los ejes salen de los sólidos platónicos: tetraedro (4 + 4), cubo y octaedro (6 + 8) o icosaedro (12 + 20).</P>
            </Card>
            <Card n="03" title="En fase">
              <P>Alrededor de cada A hay 3, 4 o 5 vecinos igualmente espaciados, y alrededor de cada B, 3. Si los dientes de A son múltiplo de esa cuenta y los de B múltiplo de 3, cada A puede mirar a todos sus vecinos con un diente y cada B con un hueco. Así engranan todas las uniones a la vez, y una vez armada la flor se mantiene en fase al girar.</P>
            </Card>
            <Card n="04" title="El diente">
              <P>El perfil es una evolvente sobre el cono trasero (la aproximación de Tredgold, la habitual en engranajes cónicos rectos), proyectada desde el centro: los flancos son superficies que pasan por el vértice. Las caras se cortan planas para apoyar el engranaje en la cama de la impresora.</P>
            </Card>
            <Card n="05" title="Nada choca">
              <P>Lo que gira sobre un eje barre, en una vuelta, un sólido de revolución: a cada distancia del centro ocupa un casquete alrededor de su eje. Dos vecinos no se tocan nunca si sus casquetes suman menos que el ángulo entre ejes. El espacio se reparte en capas: abajo, los pétalos se abren; arriba, se cierran y las coronas se abren. Cada forma se genera dentro de su casquete, con holgura para el juego de los ejes.</P>
            </Card>
            <Card n="06" title="Las piezas">
              <P>El núcleo es una esfera cortada por una cara plana en cada eje, donde apoya el buje del engranaje. Un pasador atraviesa el engranaje y se pega al núcleo; su cabeza queda escondida dentro del engranaje. La decoración encaja en un hexágono sobre el engranaje y gira con él.</P>
            </Card>
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <H c={PINK}>CÓMO SE ARMA</H>
          <ol style={{ margin: 0, padding: '0 0 0 20px', fontSize: 12, lineHeight: 2.1, color: '#a9bdd4', maxWidth: 940 }}>
            <li><b style={{ color: '#fff' }}>Imprime.</b> Un núcleo, los engranajes A y B, sus pasadores y sus decoraciones (el nombre de cada archivo dice cuántas copias). Los engranajes van con la cara grande sobre la cama; las decoraciones necesitan soportes bajo el plato.</li>
            <li><b style={{ color: '#fff' }}>Prueba un pasador.</b> Debe entrar justo en el agujero del núcleo y dejar girar libre al engranaje. Si el engranaje roza, lija el pasador; si baila en el núcleo, una gota de pegamento.</li>
            <li><b style={{ color: '#fff' }}>Engranajes, de a uno y siempre al lado de otro ya puesto.</b> Apoya el engranaje en su cara del núcleo, gíralo un poco hasta que los dientes entren en los del vecino y fíjalo con su pasador. Como cada nuevo engranaje toca solo engranajes ya conectados entre sí, siempre hay una posición en que engrana con todos.</li>
            <li><b style={{ color: '#fff' }}>Decoraciones al final.</b> Cada una encaja a presión en el hexágono de su engranaje (o con una gota de pegamento). Gira la flor después de cada una: no debería rozar nada.</li>
          </ol>
        </section>

        <section style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 28, alignItems: 'start' }}>
          <div>
            <H c="#7cf0b0">LO QUE ESTÁ MEDIDO</H>
            <P>Lo comprueba <code style={{ color: '#fff' }}>scripts/antesis/check.ts</code> en el repositorio.</P>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>Los conos ruedan sin resbalar.</b> NA · sen δB = NB · sen δA en todas las combinaciones de dientes, en los tres arreglos.</li>
              <li><b style={{ color: '#fff' }}>Todos los vecinos en fase.</b> En el marco de cada engranaje, cada vecino queda exactamente en un múltiplo del paso (error de redondeo, 10⁻¹⁶ rad).</li>
              <li><b style={{ color: '#fff' }}>El diente funciona.</b> Sin juego, dos engranajes girados paso a paso a lo largo de un diente entero se tocan sin trabarse (holgura mínima entre 0,0001 y 0,0004 mm). Con el juego de FDM la holgura mínima es 0,12 mm y con el de resina 0,07 mm, en todas las uniones a la vez: 12, 24 o 60.</li>
              <li><b style={{ color: '#fff' }}>La prueba detecta errores.</b> Con un engranaje desfasado medio diente, la misma medición encuentra el choque (−1,3 a −1,5 mm).</li>
              <li><b style={{ color: '#fff' }}>Nada choca al girar.</b> En 72 flores de prueba (tres arreglos, FDM y resina, seis semillas, pétalos en A o en B), lo que barren dos vecinos en una vuelta entera queda a 0,9 mm o más, también mientras se encaja cada decoración.</li>
              <li><b style={{ color: '#fff' }}>Piezas sólidas.</b> Todas las mallas salen cerradas (cada arista la comparten exactamente dos triángulos), con volumen positivo.</li>
              <li><b style={{ color: '#fff' }}>Reproducible.</b> La misma semilla y las mismas opciones dan exactamente las mismas piezas.</li>
            </ul>
          </div>
          <div>
            <H c="#ffb86b">LO QUE NO</H>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>Sin flor impresa todavía.</b> Las holguras son las habituales para cada proceso (0,25 mm de juego radial en FDM, 0,15 en resina), pero cada impresora es distinta: imprime primero un engranaje y un pasador de prueba.</li>
              <li><b style={{ color: '#fff' }}>Tredgold es una aproximación.</b> El perfil exacto de un engranaje cónico es una evolvente esférica; la diferencia es menor que el juego (la prueba sin juego lo muestra), pero existe.</li>
              <li><b style={{ color: '#fff' }}>El barrido es geométrico.</b> Se mide con las piezas en su lugar ideal. El juego de los ejes se cubre con un margen que crece con la distancia al eje (2° en FDM), no con una simulación del bamboleo.</li>
              <li><b style={{ color: '#fff' }}>Rozamiento y peso.</b> No se calcula cuánto cuesta girarla ni si los pétalos largos la desequilibran. Con 60 uniones (icosaedro), el rozamiento se suma.</li>
              <li><b style={{ color: '#fff' }}>Los pétalos se imprimen con soportes.</b> Son formas curvas al aire; en resina es lo normal, en FDM los soportes dejan marcas.</li>
              <li><b style={{ color: '#fff' }}>No es una idea nueva.</b> Las esferas de engranajes cónicos impresas en 3D existen hace años, y artistas como William Darrell (Floramorph) hacen esculturas florales que giran. Esto es un generador propio: no copia ninguna pieza. Lo suyo es que cada flor sale de una semilla, viene verificada y se puede imprimir.</li>
            </ul>
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <H>FUENTES</H>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11.5, lineHeight: 2, color: '#8fa8c4' }}>
            <li>Budynas, R. G. y Nisbett, J. K. (2015). <i>Shigley&apos;s Mechanical Engineering Design</i>, 10.ª ed. McGraw-Hill. Capítulo 13: engranajes cónicos y la aproximación de Tredgold.</li>
            <li>Litvin, F. L. y Fuentes, A. (2004). <i>Gear Geometry and Applied Theory</i>, 2.ª ed. Cambridge University Press. Capítulos sobre engranajes cónicos rectos.</li>
            <li>Dudley, D. W. (1984). <i>Handbook of Practical Gear Design</i>. McGraw-Hill.</li>
            <li>Coxeter, H. S. M. (1973). <i>Regular Polytopes</i>. Dover. (Los grupos de simetría de los sólidos platónicos.)</li>
            <li>Felzenszwalb, P. y Huttenlocher, D. (2012). Distance transforms of sampled functions. <i>Theory of Computing</i> 8. (La transformada de distancia que mide el barrido.)</li>
          </ul>
          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#6f86a3', margin: '18px 0 0' }}>
            Parte del taller de <Link href="/geometrias" style={{ color: CYAN }}>GEOMETRÍAS</Link>. También: <Link href="/especimenes" style={{ color: CYAN }}>ESPECÍMENES</Link> y la serie <Link href="/fenomenos" style={{ color: CYAN }}>FENÓMENOS</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
