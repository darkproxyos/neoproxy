import Link from 'next/link'
import ResonanciaApp from '@/components/resonancia/ResonanciaApp'
import MODES from '@/lib/resonancia/modes.json'
import { resonances, HZ_PER_LAMBDA } from '@/lib/resonancia/plate'

const mono = "'Space Mono', monospace"
const MINT = '#7cf0d0', CYAN = '#9fe8ff'
const H = ({ children, c = CYAN }: { children: React.ReactNode; c?: string }) => <div style={{ fontSize: 11.5, letterSpacing: 4, color: c, margin: '0 0 16px' }}>{children}</div>
const P = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 12.5, lineHeight: 2, color: '#a9bdd4', margin: '0 0 12px' }}>{children}</p>
const Card = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '2px 1px 1px 1px', borderColor: `${MINT} #ffffff12 #ffffff12 #ffffff12`, padding: '16px 18px 8px' }}>
    <div style={{ fontSize: 11, letterSpacing: 3, color: `${MINT}aa`, marginBottom: 6 }}>{n}</div>
    <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: '#fff', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)
const fmt = (n: number, d: number) => n.toFixed(d).replace('.', ',')

export default function ResonanciaPage() {
  const L = (MODES as { leissa: { leissa: number; ritz: number; err: number }[] }).leissa
  const worst = Math.max(...L.map((x) => Math.abs(x.err)))
  const nModes = (MODES as { modes: unknown[] }).modes.length
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div className="rs-layer" style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: `${MINT}aa`, marginBottom: 14 }}>NPX-RESONANCIA // SONIDO · <Link href="/fenomenos" style={{ color: `${MINT}aa` }}>SERIE FENÓMENOS</Link></div>
        <h1 style={{ fontSize: 'clamp(30px, 7vw, 58px)', letterSpacing: 9, margin: '0 0 18px', lineHeight: 1.05, background: 'linear-gradient(90deg,#7cf0d0,#9fb8ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>RESONANCIA</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: '#c8daf0', maxWidth: 880, margin: '0 0 10px' }}>
          Una placa de acero, arena encima y un parlante que la empuja. A casi cualquier nota la arena tiembla sin orden; en las <b style={{ color: '#fff' }}>resonancias</b> la placa se parte en zonas que se mueven en sentidos opuestos, separadas por líneas que no se mueven nunca, y la arena corre a juntarse ahí. Cada nota dibuja su figura.
        </p>
        <p style={{ fontSize: 11.5, lineHeight: 1.95, color: '#7f96b2', maxWidth: 880, margin: '0 0 26px' }}>
          Activa ♪ para oírla: suena la frecuencia que tendría una placa de acero de 24 cm y 1 mm. Las figuras se llaman de Chladni, por Ernst Chladni, que las mostró en 1787 frotando placas con un arco de violín.
        </p>

        <ResonanciaApp />

        <section style={{ marginTop: 64 }}>
          <H>CÓMO FUNCIONA</H>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            <Card n="01" title="Los modos de la placa">
              <P>Una placa libre tiene maneras propias de vibrar, cada una con su frecuencia. No hay fórmula exacta para la placa cuadrada libre: se calculan con el método de Rayleigh–Ritz, escribiendo la forma de la placa como suma de 256 productos de polinomios de Legendre y buscando la que equilibra la energía elástica con la de movimiento.</P>
            </Card>
            <Card n="02" title="Empujar en un punto">
              <P>El parlante empuja la placa en un punto a una frecuencia. La placa responde con la suma de sus modos: pesa más el que tiene su frecuencia cerca de la nota y el que se mueve mucho en el punto de empuje. Cerca de una resonancia domina un solo modo y aparece su figura.</P>
            </Card>
            <Card n="03" title="La arena">
              <P>Cada grano salta al azar, más lejos cuanto más vibra la placa bajo él. Donde la placa no se mueve los saltos casi desaparecen y la arena se acumula: así se dibujan las líneas nodales, sin que nadie las calcule por separado.</P>
            </Card>
            <Card n="04" title="Dos piezas">
              <P>La PLACA congela la arena como relieve sobre una baldosa de 100 mm. La COLUMNA apila un barrido de frecuencias: cada capa es la línea quieta a esa nota, y al subir se ve cómo una figura se transforma en la siguiente.</P>
            </Card>
          </div>
        </section>

        <section style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 28, alignItems: 'start' }}>
          <div>
            <H c="#7cf0b0">LO QUE ESTÁ MEDIDO</H>
            <P>Lo comprueba <code style={{ color: '#fff' }}>scripts/resonancia/check.ts</code> en el repositorio.</P>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>Las frecuencias coinciden con las tablas.</b> Las nueve primeras frecuencias de la placa libre (λ = {L.map((x) => fmt(x.leissa, 3)).join(' · ')}, Leissa 1969, ν = 0,3) salen con un error máximo de {fmt(100 * worst, 3)} %.</li>
              <li><b style={{ color: '#fff' }}>Convergencia.</b> Se guardan {nModes} modos: los que cambian menos de 0,1 % al pasar de 196 a 256 funciones de base.</li>
              <li><b style={{ color: '#fff' }}>La arena encuentra las líneas.</b> Partiendo de arena pareja, en una resonancia la fracción de granos sobre las líneas quietas sube de cerca de 30 % (lo que ocupan) a más de 60 % en 1200 saltos, unos 3 segundos en pantalla.</li>
              <li><b style={{ color: '#fff' }}>Piezas cerradas.</b> La baldosa es una malla cerrada por construcción; las columnas de prueba salen cerradas, con paredes de 1,3 a 1,7 mm, voladizo bajo el 3 % y puntajes de impresión de 0,93 a 0,99. Cuando la figura salta de golpe entre dos notas pueden quedar trozos sueltos (hasta un 4 % del volumen en las pruebas), que el STL no lleva.</li>
              <li><b style={{ color: '#fff' }}>Reproducible.</b> La misma nota y la misma semilla dan la misma arena, grano por grano, en V8 (Chrome) y JavaScriptCore (Safari): el enlace a una PLACA la reconstruye igual.</li>
              <li><b style={{ color: '#fff' }}>En hertz.</b> Para una placa de acero de 24 cm y 1 mm, λ = 1 equivale a {fmt(HZ_PER_LAMBDA, 2)} Hz: la primera resonancia que se oye desde el centro está en {Math.round(resonances('centro')[0].hz)} Hz.</li>
            </ul>
          </div>
          <div>
            <H c="#ffb86b">LO QUE NO</H>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>La arena es un modelo, no granos de verdad.</b> El salto proporcional a la vibración reproduce dónde se junta la arena, no cómo rebota cada grano. El polvo muy fino hace lo contrario y se junta en las zonas que más vibran, por corrientes de aire (Faraday, 1831); eso no está.</li>
              <li><b style={{ color: '#fff' }}>Una placa ideal.</b> Delgada (Kirchhoff), libre en los cuatro bordes y empujada en un punto sin peso. En los kits reales la placa va atornillada al parlante, y el tornillo cambia un poco las frecuencias.</li>
              <li><b style={{ color: '#fff' }}>El amortiguamiento es elegido.</b> El ancho de cada resonancia (factor de pérdida 0,012) no se midió en ninguna placa.</li>
              <li><b style={{ color: '#fff' }}>Sin pieza impresa todavía.</b> La baldosa no necesita soportes; la columna se estima imprimible, pero no se ha probado.</li>
            </ul>
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <H>FUENTES</H>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11.5, lineHeight: 2, color: '#8fa8c4' }}>
            <li>Chladni, E. F. F. (1787). <i>Entdeckungen über die Theorie des Klanges</i>. Leipzig.</li>
            <li>Faraday, M. (1831). On a peculiar class of acoustical figures. <i>Philosophical Transactions of the Royal Society</i> 121.</li>
            <li>Ritz, W. (1909). Theorie der Transversalschwingungen einer quadratischen Platte mit freien Rändern. <i>Annalen der Physik</i> 333.</li>
            <li>Leissa, A. W. (1969). <i>Vibration of Plates</i> (NASA SP-160). Washington: NASA.</li>
            <li>Gander, M. J. y Wanner, G. (2012). From Euler, Ritz, and Galerkin to modern computing. <i>SIAM Review</i> 54.</li>
          </ul>
          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#6f86a3', margin: '18px 0 0' }}>
            Parte de la serie <Link href="/fenomenos" style={{ color: CYAN }}>FENÓMENOS</Link>, junto a <Link href="/capas" style={{ color: CYAN }}>CAPAS</Link>, <Link href="/humo" style={{ color: CYAN }}>HUMO SÓLIDO</Link> y <Link href="/trenza" style={{ color: CYAN }}>TRENZA</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
