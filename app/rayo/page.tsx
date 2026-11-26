import Link from 'next/link'
import RayoApp from '@/components/rayo/RayoApp'

const mono = "'Space Mono', monospace"
const VIO = '#a9b8ff', CYAN = '#9fe8ff'
const H = ({ children, c = CYAN }: { children: React.ReactNode; c?: string }) => <div style={{ fontSize: 10.5, letterSpacing: 4, color: c, margin: '0 0 16px' }}>{children}</div>
const P = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 11.5, lineHeight: 2, color: '#a9bdd4', margin: '0 0 12px' }}>{children}</p>
const Card = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '2px 1px 1px 1px', borderColor: `${VIO} #ffffff12 #ffffff12 #ffffff12`, padding: '16px 18px 8px' }}>
    <div style={{ fontSize: 9.5, letterSpacing: 3, color: `${VIO}aa`, marginBottom: 6 }}>{n}</div>
    <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: '#fff', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)

export default function RayoPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div className="ry-layer" style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 9.5, letterSpacing: 6, color: `${VIO}aa`, marginBottom: 14 }}>NPX-RAYO // ELECTRICIDAD · <Link href="/fenomenos" style={{ color: `${VIO}aa` }}>SERIE FENÓMENOS</Link></div>
        <h1 style={{ fontSize: 'clamp(36px, 9vw, 72px)', letterSpacing: 16, margin: '0 0 18px', lineHeight: 1.05, background: 'linear-gradient(90deg,#a9b8ff,#ffffff 60%,#a9b8ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>RAYO</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: '#c8daf0', maxWidth: 880, margin: '0 0 10px' }}>
          Una descarga eléctrica no elige su camino al azar: avanza, paso a paso, hacia donde el campo eléctrico es más fuerte, y cada rama nueva cambia el campo para las demás. Así se dibujan los rayos y las figuras de Lichtenberg.
          Cuando toca tierra, el canal principal se enciende. <b style={{ color: '#fff' }}>Dado vuelta, el rayo es un árbol</b>, y el árbol se imprime.
        </p>
        <p style={{ fontSize: 10.5, lineHeight: 1.95, color: '#7f96b2', maxWidth: 880, margin: '0 0 26px' }}>
          Activa ♪ para el chisporroteo y el trueno. Cada rayo es reproducible: la misma ramificación y el mismo número dan la misma descarga.
        </p>

        <RayoApp />

        <section style={{ marginTop: 64 }}>
          <H>CÓMO FUNCIONA</H>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            <Card n="01" title="El campo entre la nube y la tierra">
              <P>El aire entre una nube cargada y el suelo es una caja de 64 × 64 × 96 celdas. La descarga es un conductor: su potencial es el del punto de partida. En el resto del espacio el potencial cumple la ecuación de Laplace, que se resuelve en la grilla por relajación.</P>
            </Card>
            <Card n="02" title="Un paso, una rama">
              <P>En cada paso la descarga se extiende a una celda vecina, elegida al azar con probabilidad proporcional al potencial elevado a η. Es el modelo de ruptura dieléctrica de Niemeyer, Pietronero y Wiesmann (1984). Las puntas que sobresalen ven un campo más intenso y tienden a seguir creciendo.</P>
            </Card>
            <Card n="03" title="El impacto">
              <P>Cuando una punta toca el otro electrodo, el camino que la une con el origen es el canal principal: por ahí pasaría la corriente de retorno, la que hace la luz y el trueno. Las ramas que no llegaron se apagan.</P>
            </Card>
            <Card n="04" title="De rayo a árbol">
              <P>Cada tramo es un tubo que engorda con la cantidad de descarga que cuelga de él, como un río con sus afluentes. Las ramitas mínimas se podan. La raíz se apoya en una base: la pieza se imprime de pie.</P>
            </Card>
          </div>
        </section>

        <section style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 28, alignItems: 'start' }}>
          <div>
            <H c="#7cf0b0">LO QUE ESTÁ MEDIDO</H>
            <P>Lo comprueba <code style={{ color: '#fff' }}>scripts/rayo/check.ts</code> en el repositorio.</P>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>La dimensión fractal coincide.</b> Crecido desde un punto en el plano con η = 1, el mismo código da D = 1,74 ± 0,02 (seis semillas). Niemeyer y colaboradores midieron 1,75 ± 0,02; la agregación limitada por difusión, que es el mismo caso, da 1,71.</li>
              <li><b style={{ color: '#fff' }}>En tres dimensiones, cerca.</b> En el espacio da D = 2,42 ± 0,11 contra el ≈ 2,5 publicado para ese caso (Meakin, 1983). La diferencia cabe en el ruido de cúmulos chicos (unos 5000 sitios).</li>
              <li><b style={{ color: '#fff' }}>η controla las ramas.</b> En el plano, con η = 2 la dimensión baja a 1,26 ± 0,10: menos ramas, más rayo.</li>
              <li><b style={{ color: '#fff' }}>La relajación no cambia el resultado.</b> Resolver Laplace en toda la grilla en cada paso o cada 8 pasos da la misma dimensión dentro del ruido.</li>
              <li><b style={{ color: '#fff' }}>Piezas de una sola pieza.</b> Los rayos de prueba (η de 2 a 3) salen cerrados, de una pieza, con paredes de 1,4 a 1,7 mm, voladizo de 7 a 9 % y puntajes de impresión de 0,90 a 0,93.</li>
              <li><b style={{ color: '#fff' }}>Reproducible.</b> La misma η y la misma semilla dan el mismo rayo, celda por celda, en V8 (Chrome) y JavaScriptCore (Safari).</li>
            </ul>
          </div>
          <div>
            <H c="#ffb86b">LO QUE NO</H>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>No es plasma.</b> Un rayo de verdad avanza en saltos (el líder escalonado), con cargas, corrientes y calor. El modelo solo reproduce la forma estadística de las ramas, no la física del canal.</li>
              <li><b style={{ color: '#fff' }}>Una grilla se nota.</b> La descarga va de celda en celda (con diagonales); en una grilla de 64 × 64 × 96 los ángulos quedan algo cuantizados.</li>
              <li><b style={{ color: '#fff' }}>Laplace aproximado.</b> El potencial se relaja cerca de cada paso nuevo y en toda la caja cada pocos pasos; no se resuelve exacto en cada paso.</li>
              <li><b style={{ color: '#fff' }}>El sonido es sintetizado.</b> El trueno y el chisporroteo son ruido filtrado, no se calculan del rayo.</li>
              <li><b style={{ color: '#fff' }}>No es una idea nueva.</b> Este modelo se usa para animar rayos en gráficos por computador desde hace años (Kim y Lin, 2007). Lo propio es convertirlo en pieza, con la medida a la vista.</li>
              <li><b style={{ color: '#fff' }}>Sin pieza impresa todavía.</b> Pensada para resina traslúcida iluminada desde la base; no probada.</li>
            </ul>
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <H>FUENTES</H>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 10.5, lineHeight: 2, color: '#8fa8c4' }}>
            <li>Lichtenberg, G. C. (1777). De nova methodo naturam ac motum fluidi electrici investigandi. <i>Novi Commentarii Societatis Regiae Scientiarum Gottingensis</i> 8.</li>
            <li>Witten, T. A. y Sander, L. M. (1981). Diffusion-limited aggregation, a kinetic critical phenomenon. <i>Physical Review Letters</i> 47.</li>
            <li>Meakin, P. (1983). Formation of fractal clusters and networks by irreversible diffusion-limited aggregation. <i>Physical Review Letters</i> 51.</li>
            <li>Niemeyer, L., Pietronero, L. y Wiesmann, H. J. (1984). Fractal dimension of dielectric breakdown. <i>Physical Review Letters</i> 52.</li>
            <li>Rakov, V. A. y Uman, M. A. (2003). <i>Lightning: Physics and Effects</i>. Cambridge University Press.</li>
            <li>Kim, T. y Lin, M. C. (2007). Fast animation of lightning using an adaptive mesh. <i>IEEE Transactions on Visualization and Computer Graphics</i> 13.</li>
          </ul>
          <p style={{ fontSize: 10, lineHeight: 1.9, color: '#5d7490', margin: '18px 0 0' }}>
            Quinto de la serie <Link href="/fenomenos" style={{ color: CYAN }}>FENÓMENOS</Link>, con <Link href="/capas" style={{ color: CYAN }}>CAPAS</Link>, <Link href="/humo" style={{ color: CYAN }}>HUMO SÓLIDO</Link>, <Link href="/trenza" style={{ color: CYAN }}>TRENZA</Link> y <Link href="/resonancia" style={{ color: CYAN }}>RESONANCIA</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
