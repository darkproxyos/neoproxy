import Link from 'next/link'
import HumoApp from '@/components/humo/HumoApp'

const mono = "'Space Mono', monospace"
const PINK = '#ff8fc4', CYAN = '#9fe8ff'
const H = ({ children, c = CYAN }: { children: React.ReactNode; c?: string }) => <div style={{ fontSize: 10.5, letterSpacing: 4, color: c, margin: '0 0 16px' }}>{children}</div>
const P = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 11.5, lineHeight: 2, color: '#a9bdd4', margin: '0 0 12px' }}>{children}</p>
const Card = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '2px 1px 1px 1px', borderColor: `${PINK} #ffffff12 #ffffff12 #ffffff12`, padding: '16px 18px 8px' }}>
    <div style={{ fontSize: 9.5, letterSpacing: 3, color: `${PINK}aa`, marginBottom: 6 }}>{n}</div>
    <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: '#fff', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)

export default function HumoPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div className="humo-layer" style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 9.5, letterSpacing: 6, color: `${PINK}aa`, marginBottom: 14 }}>NPX-HUMO // FÍSICA DE FLUIDOS · <Link href="/fenomenos" style={{ color: `${PINK}aa` }}>SERIE FENÓMENOS</Link></div>
        <h1 style={{ fontSize: 'clamp(30px, 7vw, 56px)', letterSpacing: 8, margin: '0 0 18px', lineHeight: 1.05, background: 'linear-gradient(90deg,#5fe3ff,#ff4fa3)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>HUMO SÓLIDO</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: '#c8daf0', maxWidth: 860, margin: '0 0 10px' }}>
          Anillos de humo calculados con la física real de los vórtices: se adelantan uno a otro, chocan, se abren en coronas, se anudan.
          Cuando un instante te guste, lo <b style={{ color: '#fff' }}>congelas</b>: el humo se vuelve un sólido que se puede imprimir.
        </p>
        <p style={{ fontSize: 10.5, lineHeight: 1.95, color: '#7f96b2', maxWidth: 860, margin: '0 0 26px' }}>
          Cian y magenta son el humo de cada anillo; las líneas claras, los núcleos de vórtice que lo mueven todo. El MODO REEL pone la escena en vertical y la corre sola, para grabarla con el teléfono.
        </p>

        <HumoApp />

        <section style={{ marginTop: 64 }}>
          <H>CÓMO FUNCIONA</H>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            <Card n="01" title="El giro vive en tubos">
              <P>En un fluido sin viscosidad, el giro (la vorticidad) queda atrapado en tubos que viajan con el fluido: lo demostró Helmholtz en 1858. Un anillo de humo es uno de esos tubos cerrado sobre sí mismo. Aquí cada tubo es una curva de nodos.</P>
            </Card>
            <Card n="02" title="Todo lo demás se deduce">
              <P>La velocidad en cualquier punto sale de los tubos con la ley de Biot–Savart, la misma que da el campo magnético de un cable. Cada tubo empuja a los otros y a sí mismo; así un anillo avanza solo y dos anillos bailan.</P>
            </Card>
            <Card n="03" title="El humo es un testigo">
              <P>El humo no empuja nada: son miles de partículas que el flujo arrastra y enrolla, como en un laboratorio con humo de verdad. Su color dice de qué anillo salieron.</P>
            </Card>
            <Card n="04" title="Congelar es medir">
              <P>Al congelar, las partículas se reparten en una grilla y se extrae la superficie de humo de densidad constante. Con peana, cada trozo importante del humo recibe su propia varilla hasta un disco, y los jirones sueltos se quitan: la pieza sale de una sola pieza y queda de pie.</P>
            </Card>
          </div>
        </section>

        <section style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 28, alignItems: 'start' }}>
          <div>
            <H c="#7cf0b0">LO QUE ESTÁ MEDIDO</H>
            <P>Lo comprueba <code style={{ color: '#fff' }}>scripts/humo/check.ts</code> en el repositorio.</P>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>Velocidad de un anillo.</b> Un anillo solo avanza a la velocidad que predice la fórmula de Kelvin para su núcleo, con un 3–4 % de diferencia (el error de discretizar la curva).</li>
              <li><b style={{ color: '#fff' }}>Impulso.</b> El impulso del flujo es un invariante exacto de un fluido ideal. A lo largo de cada experimento se conserva con una deriva máxima de 0,8 % (nudo), 5,4 % (salto de rana), 5,7 % (choque frontal) y 12,6 % (choque oblicuo, en su tramo final, que es donde el método deja de valer).</li>
              <li><b style={{ color: '#fff' }}>Reproducible.</b> La misma receta da la misma nube de humo, partícula por partícula, en V8 (Chrome, Node) y en JavaScriptCore (Safari, Bun). Las curvas iniciales se construyen sin senos ni cosenos; Firefox no se probó.</li>
              <li><b style={{ color: '#fff' }}>Sólido cerrado.</b> La pieza de cada experimento es una malla cerrada. Sobre peana, el salto de rana y el choque oblicuo salen de una sola pieza con puntaje de impresión 0,89 y 0,90 (se quita un 3–7 % de jirones sueltos); sin peana, la corona y el nudo quedan cerca de 0,3 porque necesitan soportes.</li>
            </ul>
          </div>
          <div>
            <H c="#ffb86b">LO QUE NO</H>
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 11, lineHeight: 2, color: '#a9bdd4' }}>
              <li><b style={{ color: '#fff' }}>Sin reconexión ni viscosidad.</b> En un fluido real, cuando dos núcleos se tocan se cortan y se vuelven a unir (así se desata el nudo y se funden los anillos del choque oblicuo). Este método no lo hace: por eso cada experimento termina antes de ese momento.</li>
              <li><b style={{ color: '#fff' }}>Un suavizado necesario.</b> Para que las curvas no se arruguen en pliegues más finos que el núcleo, se suavizan levemente en cada paso. Es la principal causa de la deriva del impulso.</li>
              <li><b style={{ color: '#fff' }}>No es una idea nueva.</b> El humo con filamentos de vórtice es una técnica conocida en gráficos por computador (Weißmann y Pinkall, 2010). Lo propio es congelarlo como pieza imprimible, con la física a la vista.</li>
              <li><b style={{ color: '#fff' }}>Sin pieza impresa todavía.</b> Los puntajes son estimaciones geométricas. Las piezas son macizas: conviene vaciarlas con drenajes en el laminador.</li>
            </ul>
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <H>FUENTES</H>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 10.5, lineHeight: 2, color: '#8fa8c4' }}>
            <li>Helmholtz, H. (1858). Über Integrale der hydrodynamischen Gleichungen, welche den Wirbelbewegungen entsprechen. <i>J. reine angew. Math.</i> 55.</li>
            <li>Kelvin, Lord (Thomson, W.) (1867). On vortex atoms. <i>Proc. R. Soc. Edinburgh</i> 6. · Saffman, P. G. (1992). <i>Vortex Dynamics</i>. Cambridge University Press.</li>
            <li>Yamada, H. y Matsui, T. (1978). Preliminary study of mutual slip-through of a pair of vortices. <i>Physics of Fluids</i> 21.</li>
            <li>Lim, T. T. y Nickels, T. B. (1992). Instability and reconnection in the head-on collision of two vortex rings. <i>Nature</i> 357.</li>
            <li>Kida, S., Takaoka, M. y Hussain, F. (1991). Collision of two vortex rings. <i>Journal of Fluid Mechanics</i> 230.</li>
            <li>Kleckner, D. e Irvine, W. T. M. (2013). Creation and dynamics of knotted vortices. <i>Nature Physics</i> 9.</li>
            <li>Weißmann, S. y Pinkall, U. (2010). Filament-based smoke with vortex shedding and variational reconnection. <i>ACM Transactions on Graphics</i> 29.</li>
          </ul>
          <p style={{ fontSize: 10, lineHeight: 1.9, color: '#5d7490', margin: '18px 0 0' }}>
            Hermana de <Link href="/capas" style={{ color: CYAN }}>CAPAS</Link>: allí el tiempo de un mundo plano se apila en altura; aquí un instante de un fluido en tres dimensiones se congela. Parte de la serie <Link href="/fenomenos" style={{ color: CYAN }}>FENÓMENOS</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
