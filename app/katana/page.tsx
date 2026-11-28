import Link from 'next/link'
import KatanaApp from '@/components/katana/KatanaApp'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff', AMBER = '#e0b070'
const H = ({ children, c = CYAN }: { children: React.ReactNode; c?: string }) => <div style={{ fontSize: 11.5, letterSpacing: 4, color: c, margin: '0 0 16px' }}>{children}</div>
const P = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 12.5, lineHeight: 2, color: '#a9bdd4', margin: '0 0 12px' }}>{children}</p>
const Card = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '2px 1px 1px 1px', borderColor: `${AMBER} #ffffff12 #ffffff12 #ffffff12`, padding: '16px 18px 8px' }}>
    <div style={{ fontSize: 11, letterSpacing: 3, color: `${AMBER}aa`, marginBottom: 6 }}>{n}</div>
    <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: '#fff', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)

export default function KatanaPage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: `${CYAN}aa`, marginBottom: 14 }}>NPX-KATANA // OBJETO · <Link href="/fabrication" style={{ color: `${CYAN}aa` }}>FABRICACIÓN</Link></div>
        <h1 style={{ fontSize: 'clamp(34px, 8.5vw, 70px)', letterSpacing: 14, margin: '0 0 18px', lineHeight: 1.05, background: `linear-gradient(90deg,${CYAN},#ffffff 55%,${AMBER})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>KATANA</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: '#c8daf0', maxWidth: 900, margin: '0 0 10px' }}>
          Un katana de exhibición con cuerpo de máquina: hoja curva con aletas disipadoras en el lomo, ventilas y un canal de luz con trazado de circuito; abrazaderas con tornillos sobre cada unión; tsuba de engranaje; mango con diamantes de cable y un hueco para electrónica; remate con lente de sensor.
          <b style={{ color: '#fff' }}> Se imprime en piezas, sin soportes, y encaja.</b>
        </p>
        <p style={{ fontSize: 11.5, lineHeight: 1.95, color: '#7f96b2', maxWidth: 900, margin: '0 0 26px' }}>
          Es una pieza para mirar, no un arma: el borde es romo (de ~1,2 mm) y el material no corta. Cada versión se calcula en tu navegador y se verifica: que las piezas sean sólidos cerrados, que quepan en tu cama, y que espigas, abrazaderas, tsuba, mango y remate encajen con holgura sin tocarse.
        </p>

        <KatanaApp />

        <section style={{ marginTop: 64 }}>
          <H c={AMBER}>CÓMO ESTÁ HECHO</H>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            <Card n="01" title="Una hoja en tres coordenadas">
              <P>La hoja es un arco de círculo. Cada punto del espacio tiene un largo de arco, una altura sobre la línea central y un espesor; en ellas la sección es la de un katana real: lomo plano, una arista (shinogi) a 62 % de la altura y un bisel hasta un borde romo. Aletas, ventilas, canal de luz, espigas y mortajas se suman o se restan de esa sección.</P>
            </Card>
            <Card n="02" title="Mitades planas, sin soportes">
              <P>La hoja es simétrica por su plano medio, así que cada segmento se imprime en dos mitades con la cara de corte sobre la cama: el bisel queda mirando hacia arriba y no hay voladizos. La mitad B es el espejo de la A (vienen las dos en la descarga). Se pegan con clavijas y se cierran con abrazaderas de tornillos. El mango se hace igual.</P>
            </Card>
            <Card n="03" title="Segmentos que caben en tu cama">
              <P>Según el lado de tu cama, la hoja se corta en segmentos unidos por una espiga con perno pasante. El primero es más corto, porque lleva la espiga larga que cruza tsuba, fuchi y mango. Cada pieza se mide ya orientada para imprimir.</P>
            </Card>
            <Card n="04" title="Holguras medidas, no supuestas">
              <P>Las holguras (0,25 mm en filamento, 0,12 mm en resina) se miden sobre las mallas reales: espiga contra mortaja, abrazadera contra hoja, espiga larga contra tsuba, fuchi y mango, y remate contra mango. Si una pieza interfiere con otra, la verificación lo marca.</P>
            </Card>
            <Card n="05" title="El hueco cyborg">
              <P>Cada mitad del mango trae un alojamiento para una ESP32-C3 supermini y una batería LiPo plana. El canal del hamon es una ranura de 0,8 mm de fondo donde cabe una tira de luz o resina translúcida. Los dos «sensores» hexagonales del mango se imprimen aparte y se pegan.</P>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
