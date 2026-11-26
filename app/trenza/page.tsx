import Link from 'next/link'
import TrenzaApp from '@/components/trenza/TrenzaApp'
import { ORBITS } from '@/lib/trenza/orbit'

const mono = "'Space Mono', monospace"
const GOLD = '#ffc75a', CYAN = '#9fe8ff'
const H = ({ children, c = CYAN }: { children: React.ReactNode; c?: string }) => <div style={{ fontSize: 10.5, letterSpacing: 4, color: c, margin: '0 0 16px' }}>{children}</div>
const P = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 11.5, lineHeight: 2, color: '#a9bdd4', margin: '0 0 12px' }}>{children}</p>
const Card = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '2px 1px 1px 1px', borderColor: `${GOLD} #ffffff12 #ffffff12 #ffffff12`, padding: '16px 18px 8px' }}>
    <div style={{ fontSize: 9.5, letterSpacing: 3, color: `${GOLD}aa`, marginBottom: 6 }}>{n}</div>
    <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: '#fff', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)
const sci = (x: number) => { const [m, e] = x.toExponential(0).split('e'); return `${m}·10${e.replace('-', '⁻').replace('+', '').split('').map((ch) => ({ '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' } as Record<string, string>)[ch] ?? ch).join('')}` }

export default function TrenzaPage() {
  const worstClose = Math.max(...ORBITS.map((o) => o.returnError)), worstE = Math.max(...ORBITS.map((o) => o.energyDrift))
  const pubMin = Math.min(...ORBITS.map((o) => o.published.returnError)), pubMax = Math.max(...ORBITS.map((o) => o.published.returnError))
  const stable = ORBITS.filter((o) => o.diverge.eps6 === null).map((o) => o.name.toLowerCase())
  const fragile = ORBITS.filter((o) => o.diverge.eps6 !== null).sort((a, b) => a.diverge.eps6! - b.diverge.eps6!)
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div className="tr-layer" style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 9.5, letterSpacing: 6, color: `${GOLD}aa`, marginBottom: 14 }}>NPX-TRENZA // GRAVEDAD · <Link href="/fenomenos" style={{ color: `${GOLD}aa` }}>SERIE FENÓMENOS</Link></div>
        <h1 style={{ fontSize: 'clamp(34px, 8vw, 64px)', letterSpacing: 12, margin: '0 0 18px', lineHeight: 1.05, background: 'linear-gradient(90deg,#5fe3ff,#ff4fa3 55%,#ffc75a)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>TRENZA</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: '#c8daf0', maxWidth: 880, margin: '0 0 10px' }}>
          Tres soles que se atraen por gravedad casi siempre terminan en caos. Pero hay órbitas excepcionales donde bailan para siempre sin chocar.
          Si el tiempo se vuelve altura, ese baile es <b style={{ color: '#fff' }}>una trenza</b> — y una trenza se puede imprimir.
        </p>
        <p style={{ fontSize: 10.5, lineHeight: 1.95, color: '#7f96b2', maxWidth: 880, margin: '0 0 26px' }}>
          {ORBITS.length} órbitas periódicas publicadas, recalculadas aquí. ◎ DANZA las muestra desde arriba; ⟰ TRENZA levanta el tiempo; ◆ PIEZA la solidifica; ✶ CAOS corre la misma órbita dos veces con una diferencia minúscula y deja ver cuándo se separan.
        </p>

        <TrenzaApp />

        <section style={{ marginTop: 64 }}>
          <H>CÓMO FUNCIONA</H>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            <Card n="01" title="Newton, sin atajos">
              <P>Tres masas iguales en un plano, cada una atraída por las otras dos con la ley de Newton. No hay fórmula cerrada para su movimiento (Poincaré lo mostró en 1890): se integra paso a paso con un método de Dormand–Prince que achica el paso cuando dos soles se acercan.</P>
            </Card>
            <Card n="02" title="Órbitas que cierran">
              <P>Las condiciones iniciales vienen de los catálogos publicados con 6 cifras. Con 6 cifras la órbita no cierra del todo; aquí se corrigen con el método de Gauss–Newton hasta que, tras un período, los tres soles vuelven a su punto de partida.</P>
            </Card>
            <Card n="03" title="El tiempo como altura">
              <P>Cada sol deja una línea de mundo: su posición en el plano, subida según el tiempo. Las tres líneas se enroscan sin tocarse nunca (los soles no chocan), y la forma en que se cruzan es una palabra en el grupo de trenzas de Artin, la huella topológica de la órbita.</P>
            </Card>
            <Card n="04" title="De trenza a pieza">
              <P>Cada línea es un tubo que engorda donde el sol va lento. Los tres tubos se funden con una unión suave donde los soles se acercan y se apoyan en una base. La superficie se extrae de un campo de distancia, así que la malla sale cerrada aunque los tubos se toquen.</P>
            </Card>
          </div>
        </section>

        <section style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 28, alignItems: 'start' }}>
          <div>
            <H c="#7cf0b0">LO QUE ESTÁ MEDIDO</H>
            <P>Lo comprueba <code style={{ color: '#fff' }}>scripts/trenza/check.ts</code> en el repositorio.</P>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>Las órbitas cierran.</b> Con las cifras publicadas, tras un período los soles quedan a entre {sci(pubMin)} y {sci(pubMax)} de su punto de partida. Refinadas, a menos de {sci(worstClose)} (el navegador integra con una tolerancia un poco mayor y las cierra a menos de 3·10⁻⁸).</li>
              <li><b style={{ color: '#fff' }}>La energía se conserva.</b> En un período la energía total cambia como máximo en {sci(worstE)} de su valor.</li>
              <li><b style={{ color: '#fff' }}>La trenza del ocho.</b> El ocho (Moore 1993; Chenciner y Montgomery 2000) da la palabra (σ₁ σ₂⁻¹)³: seis cruces alternados.</li>
              <li><b style={{ color: '#fff' }}>Estabilidad.</b> Con una diferencia de 10⁻⁶ en la velocidad inicial, {stable.length} órbitas siguen juntas más de 40 vueltas ({stable.join(', ')}); la más frágil, {fragile[0]?.name.toLowerCase()}, se separa a la vuelta {fragile[0]?.diverge.eps6?.toString().replace('.', ',')}.</li>
              <li><b style={{ color: '#fff' }}>Sólido cerrado.</b> Las piezas salen de una sola pieza, cerradas y manifold, con puntajes de impresión de 0,8 a 0,93 en las pruebas (base, alto 1,6 veces el ancho).</li>
              <li><b style={{ color: '#fff' }}>Reproducible.</b> Solo sumas, productos, divisiones y raíces (exactas en IEEE): la misma órbita da los mismos números en V8 (Chrome) y JavaScriptCore (Safari).</li>
            </ul>
          </div>
          <div>
            <H c="#ffb86b">LO QUE NO</H>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>Un universo de juguete.</b> Masas puntuales e iguales, en un plano, sin relatividad. Ningún sistema estelar conocido sigue estas órbitas; son soluciones matemáticas exactas, no astronomía.</li>
              <li><b style={{ color: '#fff' }}>&ldquo;Estable&rdquo; es lo medido, no lo demostrado.</b> Que una órbita aguante 40 vueltas con una diferencia de 10⁻⁶ no prueba que sea estable para siempre. Del ocho sí se sabe que es linealmente estable.</li>
              <li><b style={{ color: '#fff' }}>Tres órbitas quedaron fuera.</b> Mariposa IV y yin-yang IIa y IIb pasan casi por una colisión (los soles a menos de 0,0002) y el refinamiento no las cierra con la misma precisión.</li>
              <li><b style={{ color: '#fff' }}>La palabra depende del punto de vista.</b> Se mide proyectando sobre el eje x; mirada desde otro ángulo, la misma trenza se escribe con otra palabra equivalente.</li>
              <li><b style={{ color: '#fff' }}>Sin pieza impresa todavía.</b> Los puntajes son estimaciones geométricas. Con TAPA la barra de arriba necesita soportes.</li>
            </ul>
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <H>FUENTES</H>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 10.5, lineHeight: 2, color: '#8fa8c4' }}>
            <li>Poincaré, H. (1890). Sur le problème des trois corps et les équations de la dynamique. <i>Acta Mathematica</i> 13.</li>
            <li>Artin, E. (1925). Theorie der Zöpfe. <i>Abh. Math. Sem. Univ. Hamburg</i> 4.</li>
            <li>Moore, C. (1993). Braids in classical dynamics. <i>Physical Review Letters</i> 70.</li>
            <li>Chenciner, A. y Montgomery, R. (2000). A remarkable periodic solution of the three-body problem in the case of equal masses. <i>Annals of Mathematics</i> 152.</li>
            <li>Šuvakov, M. y Dmitrašinović, V. (2013). Three classes of Newtonian three-body planar periodic orbits. <i>Physical Review Letters</i> 110.</li>
            <li>Li, X. y Liao, S. (2017). More than six hundred new families of Newtonian periodic planar collisionless three-body orbits. <i>Science China Physics, Mechanics &amp; Astronomy</i> 60.</li>
            <li>Dormand, J. R. y Prince, P. J. (1980). A family of embedded Runge–Kutta formulae. <i>Journal of Computational and Applied Mathematics</i> 6.</li>
          </ul>
          <p style={{ fontSize: 10, lineHeight: 1.9, color: '#5d7490', margin: '18px 0 0' }}>
            Tercera de una línea: en <Link href="/capas" style={{ color: CYAN }}>CAPAS</Link> el tiempo de un mundo plano se apila en altura; en <Link href="/humo" style={{ color: CYAN }}>HUMO SÓLIDO</Link> un instante de un fluido se congela; aquí el tiempo entero de una órbita se vuelve una trenza. Toda la serie, en <Link href="/fenomenos" style={{ color: CYAN }}>FENÓMENOS</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
