import Link from 'next/link'
import VerticeApp from '@/components/arsenal/VerticeApp'

const mono = "'Space Mono', monospace"
const CRIMSON = '#ff4d5e', AMBER = '#e0b070', CYAN = '#00d4ff'
const H = ({ children, c = CRIMSON }: { children: React.ReactNode; c?: string }) => <div style={{ fontSize: 11.5, letterSpacing: 4, color: c, margin: '0 0 16px' }}>{children}</div>
const P = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 12.5, lineHeight: 2, color: '#a9bdd4', margin: '0 0 12px' }}>{children}</p>
const Card = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: '#080c12', borderStyle: 'solid', borderWidth: '2px 1px 1px 1px', borderColor: `${CRIMSON} #ffffff12 #ffffff12 #ffffff12`, padding: '16px 18px 8px' }}>
    <div style={{ fontSize: 11, letterSpacing: 3, color: `${CRIMSON}aa`, marginBottom: 6 }}>{n}</div>
    <div style={{ fontSize: 12.5, letterSpacing: 1.5, color: '#fff', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)

export default function VerticePage() {
  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative', overflowX: 'hidden' }}>
      <div className="crt-scanlines" /><div className="tech-grid" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1360, margin: '0 auto', padding: '104px 24px 100px' }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: `${CRIMSON}cc`, marginBottom: 14 }}>
          <Link href="/arsenal/espadas" style={{ color: `${CRIMSON}cc` }}>ARSENAL · ESPADAS</Link>{' // NPX-02 · v2.0'}
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 9vw, 76px)', letterSpacing: 14, margin: '0 0 18px', lineHeight: 1.05, background: `linear-gradient(90deg,${CRIMSON},#ffffff 55%,${CYAN})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>VÉRTICE</h1>
        <p style={{ fontSize: 13, lineHeight: 2, color: '#c8daf0', maxWidth: 940, margin: '0 0 10px' }}>
          Una espada de una mano y media hecha como una máquina: núcleo de dos láminas con ventanas que dejan ver la varilla interior, filo biselado de otro color, blindajes que tapan y atan cada unión, guarda de garras con un dial de reactor que se enciende, mango de dos manos y una manguera al pomo.
          <b style={{ color: '#fff' }}> Cada pieza se imprime plana, en su color, sin soportes, y encaja.</b>
        </p>
        <p style={{ fontSize: 11.5, lineHeight: 1.95, color: '#7f96b2', maxWidth: 940, margin: '0 0 26px' }}>
          Pieza de exhibición, no un arma: el filo es romo (1,2 mm). Se calcula en tu navegador repartida en varios hilos y se verifica sola: mallas cerradas, que cada pieza quepa en tu cama, y que colas de milano, filo, blindajes, espiga, mango, pomo, dial y varilla encajen con su holgura.
        </p>

        <VerticeApp />

        <section style={{ marginTop: 64 }}>
          <H>CÓMO ESTÁ HECHA</H>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            <Card n="01" title="Aristas vivas">
              <P>La v1 se mallaba con surface nets: cada canto salía redondeado. Esta usa dual contouring: en cada celda, el vértice va al punto que mejor cumple los planos de las caras que la cruzan, con la normal exacta del campo. Las caras planas quedan planas y los cantos, cantos. Después se simplifica (métricas de error cuadrático): una cara plana queda en pocos triángulos y el STL pesa poco.</P>
            </Card>
            <Card n="02" title="Dos láminas desfasadas">
              <P>El núcleo es una placa de ~7,4 mm partida por su plano medio en las láminas A y B, cada una en tramos que caben en tu cama (en diagonal si hace falta). Las uniones de A están corridas respecto de las de B: al pegar una lámina sobre la otra, cada unión queda tapada por un tramo entero. Cada unión es una cola de milano en el plano, que encaja de arriba.</P>
            </Card>
            <Card n="03" title="Filo, blindajes y varilla">
              <P>El filo es una franja biselada hasta 1,2 mm que entra al núcleo con colas de milano chicas. Los blindajes, sobre las dos caras, tapan cada par de uniones y las atan con clavijas de filamento. Entre las dos láminas corre una varilla de 4 mm de la punta al pomo: se ve por las ventanas.</P>
            </Card>
            <Card n="04" title="El reactor">
              <P>La guarda tiene adentro un compartimento para una pila CR2032 y un LED bajo el dial, que va a presión (se saca para cambiar la pila). El LED alimenta una fibra óptica de brillo lateral de 2 mm que corre por un canal en cada cara del núcleo. Impreso en PETG translúcido, el dial también brilla.</P>
            </Card>
            <Card n="05" title="Holguras medidas">
              <P>Las holguras (0,25 mm en filamento, 0,12 mm en resina) se miden sobre las mallas reales contra el campo exacto de la otra pieza. Al descargar se recalcula todo con malla de 0,4 mm y se vuelve a medir; el resultado va en el JSON junto con colores, herrajes y el orden de armado. Cada pieza lleva su rótulo de armado grabado en la cara de corte.</P>
            </Card>
          </div>
        </section>
        <p style={{ fontSize: 11, lineHeight: 1.9, color: '#6f86a3', marginTop: 28 }}>
          Diseño original de NeoProxy. Toma el lenguaje visual del mecha (bloques de color, paneles, ventanas, piezas mecánicas a la vista), no una espada en particular. <Link href="/arsenal/espadas" style={{ color: AMBER }}>← Volver al arsenal</Link>
        </p>
      </div>
    </div>
  )
}
