# NEOPROXY // CREATIVE OPERATING SYSTEM

## 🎯 Concepto

NeoProxy es un sistema operativo creativo que combina arquitectura empresarial, experiencia 3D inmersiva, y fabricación digital. Un ecosistema completo que transforma pensamiento en geometría, geometría en materia, y materia en experiencia.

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

**Required Variables:**
- `NEOPROXY_API_URL` - API endpoint for wake signals (default: http://localhost:3000)
- `EVENT_DB_PATH` - Path to SQLite database (default: ./sqlite.db)

## 🛠️ Herramientas Generativas

### **Ring Generator** (`/ring-generator`)
Generador paramétrico de anillos 3D con estética cyberpunk/glitch.
- 4 modificadores: spikes, ondas, voronoi noise, cortes glitch
- Export STL 1:1 para impresión 3D
- Seed-based reproducibilidad

### **Auto Curator** (`/auto-curator`)
Sistema de curaduría automática con algoritmo de diversidad forzada.
- Analiza 10,000 seeds y selecciona 15 piezas únicas
- 9 arquetipos tipológicos (THORN, ORGANIC, GLITCH, etc.)
- Safety rules industriales y scoring multi-factor
- Export Manifest JSON completo

### **Generative Lab** (`/lab`)
Laboratorio de geometría con Babylon.js 3D.
- Experimentos procedurales
- Visualización de algoritmos
- Zona científica de exploración pura

### **Fabrication Lab** (`/fabrication`)
Conexión con el taller físico.
- Pipeline de impresión 3D
- Monitoreo IoT
- Control de calidad automatizado

## 🧠 Algoritmo de Auto Curator

### **9 Arquetipos Tipológicos**

| Arquetipo | Características | Sweet Spot |
|-----------|----------------|------------|
| **THORN** | Picos dominantes sin ruido | sh > 1.2, sc ≥ 10, !voro |
| **ORGANIC** | Voronoi + ondas, orgánico | voro + waves + !spikes |
| **GLITCH** | Cortes sin picos, error elevado | cuts + cn ≥ 4 + !spikes |
| **BRUTAL** | Picos + cortes, conflicto | spikes + cuts + sc ≥ 12 |
| **WAVE** | Ondas puras, modulación | waves + !spikes + !cuts + wf ≥ 3 |
| **NOISE** | Voronoi solo, caos estructurado | voro + !waves + vi > 0.4 |
| **HYBRID** | 4 modificadores, instancia máxima | 4 modificadores activos |
| **MINIMAL** | 1 modificador, esencial | ≤ 1 modificador |
| **CORE** | Catch-all, equilibrio | Default |

### **Sistema de Scoring**
- **Complejidad óptima**: 2-3 modificadores = +16/+20 puntos
- **Proporciones ideales**: ratio width/diam 0.32-0.55 = +12 puntos
- **Safety rules**: grosor mínimo 1.5mm, restricciones de fragilidad
- **Diversidad forzada**: máximo 2 piezas por arquetipo

## 🎨 Stack Tecnológico

- **Frontend**: Next.js 16, React 18, TypeScript
- **3D**: Babylon.js, Three.js, React Three Fiber
- **Estilos**: TailwindCSS, CSS custom properties
- **Deploy**: Vercel, GitHub Pages
- **Hardware**: ESP32, Arduino, 3D printers (Ender 3, Photon Mono 2)

## 📦 Estructura del Proyecto

```
├── app/
│   ├── page.tsx              # Dashboard principal
│   ├── ring-generator/page.tsx  # Generador de anillos
│   ├── auto-curator/page.tsx     # Auto curaduría
│   ├── lab/page.tsx              # Laboratorio 3D
│   └── layout.tsx                # Layout principal
├── components/
│   └── kernel/                    # Componentes del sistema
├── public/                       # Assets estáticos
└── package.json                  # Dependencias
```

## � Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 💡 Innovaciones Técnicas

1. **Diversidad Forzada**: Algoritmo único que evita drops homogéneos
2. **Arquetipos Tipológicos**: Clasificación semántica de formas
3. **Safety Industrial**: Reglas basadas en física de impresión 3D
4. **Scoring Multi-factor**: Evaluación estética cuantificable
5. **Narrativa Automática**: Storytelling generativo
6. **Manifest Export**: Metadata completa para coleccionistas

---

**NEOPROXY OS** - Donde el ruido paramétrico se convierte en arte certificado.
