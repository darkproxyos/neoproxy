# NEOPROXY // AUTO_CURATOR ENGINE

## 🎯 Concepto

Sistema de curaduría automática para drops generativos de anillos NeoProxy con algoritmo de **diversidad forzada**. Transforma el proceso de selección subjetiva a un algoritmo sofisticado que garantiza variedad tipológica en cada drop.

## 🧠 Algoritmo de Diversidad

### **Universo de Seeds**
- **10,000 seeds aleatorias** generadas on-demand
- Cada seed produce parámetros únicos: diámetro, ancho, grosor, modificadores
- Sistema PRNG determinista para reproducibilidad

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

## ⚡ Sistema de Scoring Multi-Factor

### **Complejidad Óptima**
- **2-3 modificadores**: +16/+20 puntos (sweet spot)
- **4 modificadores**: +10 puntos (límite caos)
- **1 modificador**: -5 puntos (demasiado simple)

### **Proporciones Ideales**
- **Ratio width/diam**: 0.32-0.55 = +12 puntos
- **Ratio < 0.22 o > 0.65**: -10 puntos (desproporcionado)

### **Calidad por Modificador**

#### Spikes
- **Cantidad**: 8-16 = +10 puntos
- **Altura**: 0.8-1.8mm = +10 puntos
- **Excesos**: sc > 22 o sh > 2.2 = -8 puntos

#### Ondas
- **Frecuencia**: 2-5 = +8 puntos
- **Amplitud**: 0.4-0.9mm = +5 puntos

#### Voronoi
- **Intensidad**: 0.25-0.75mm = +12 puntos
- **Exceso**: vi > 0.9 = -6 puntos

#### Cortes
- **Cantidad**: 3-7 = +8 puntos
- **Exceso**: cn > 10 = -8 puntos

### **Bonus Adicionales**
- **Grosor pared**: 1.8-2.6mm = +8 puntos
- **Entropía**: ±3 puntos aleatorios

## 🛡️ Safety Rules (Nivel Industrial)

### **FAIL (Rechazo Automático)**
- `thick < 1.2mm` - Fractura garantizada

### **RISK (DROP 01: SAFE ONLY)**
- `thick < 1.5mm` - Posible fractura
- `spikes + sh > 2.5mm` - Demasiado frágil
- `spikes + sh > 1.8 + sc > 20` - Demasiados picos
- `voro + vi > 1.0mm` - Débil estructural
- `cuts + cn > 10` - Demasiados cortes
- `cuts + cn > 6 + thick < 1.8` - Riesgo combinado

## 🎭 Algoritmo de Selección en Dos Pasos

### **Pass 1 - Greedy con Restricciones**
```javascript
const MAX_PER_ARCHETYPE = 2
const MAX_SIMILAR_DIAM = 3

for(candidate in sorted_by_score) {
  // Rechazar si arquetipo tiene 2+ representantes
  if(archetypeCount[candidate.archetype] >= 2) continue
  
  // Rechazar si 3+ diámetros similares (<0.8mm diferencia)
  if(similarDiameterCount >= 3) continue
  
  selected.push(candidate)
}
```

### **Pass 2 - Relleno sin Restricciones**
- Si Pass 1 no alcanza 15 piezas
- Relaja constraints gradualmente
- Completa el drop con mejores restantes

## 📊 Pipeline de Ejecución

### **Phase 1 - Scan (45%)**
1. Generar 10,000 seeds aleatorias
2. Convertir seeds → parámetros
3. Aplicar safety rules
4. Calcular aesthetic score
5. Clasificar arquetipo

### **Phase 2 - Select (25%)**
1. Ordenar por score descendiente
2. Aplicar algoritmo diversidad
3. Seleccionar 15 piezas
4. Verificar arquetipo balance

### **Phase 3 - Render (30%)**
1. Generar 15 previsualizaciones 2D
2. Crear grid layout
3. Generar narrativa automática
4. Exportar manifest JSON

## 🎨 Sistema de Narrativa

### **Drop Storytelling**
- **Título**: "DROP 01 CORE"
- **Concepto**: Primera instancia física del universo
- **Filosofía**: Objetos emergidos del ruido paramétrico
- **Autenticidad**: Seeds como identidad permanente

### **Lore por Arquetipo**
- **THORN**: "geometría de defensa — picos como protocolo de separación"
- **ORGANIC**: "superficie viva — ruido voronoi como tejido sin centro"
- **GLITCH**: "error elevado a forma — incisiones donde la estructura falla"
- **BRUTAL**: "conflicto materializado — picos y cortes sin resolución"
- **WAVE**: "modulación pura — forma que respira en frecuencia constante"
- **NOISE**: "caos estructurado — voronoi sin atenuación"
- **HYBRID**: "instancia máxima — todos los sistemas activos simultáneamente"
- **MINIMAL**: "forma esencial — un solo modificador, sin ruido adicional"
- **CORE**: "instancia base — equilibrio entre todos los parámetros"

## 📦 Export System

### **Manifest JSON Completo**
```json
{
  "drop": "DROP_01",
  "name": "CORE",
  "algorithm": "diversity-score-v1",
  "universe_size": 10000,
  "count": 15,
  "items": [{
    "index": 1,
    "id": "NP-01234",
    "seed": 1234,
    "archetype": "THORN",
    "aesthetic_score": 87,
    "status": "SAFE",
    "lore": "geometría de defensa — picos como protocolo de separación",
    "params": {
      "diam_mm": 18.2,
      "width_mm": 8.0,
      "thick_mm": 2.0,
      "spikes": {"count": 12, "height_mm": 1.5},
      "waves": {"freq": 3, "amp_mm": 0.6},
      "voronoi": {"intensity_mm": 0.4},
      "cuts": {"count": 5}
    },
    "stl_filename": "NP-01234_d18.2mm_[CERT].stl",
    "url": "neoproxy.art?seed=1234",
    "ring_url": "np-ring.html?seed=1234"
  }]
}
```

## 🔧 Parámetros Generativos

### **Rangos Base**
- **Diámetro**: 16-20mm (step 0.1)
- **Ancho**: 5-11mm (step 0.5)
- **Grosor**: 1.4-3.4mm (step 0.1)

### **Modificadores**
- **Spikes**: count 6-26, height 0.3-3.1mm
- **Ondas**: freq 1-9, amp 0.1-1.3mm
- **Voronoi**: intensity 0-1.2mm
- **Cortes**: count 1-15

## 🚀 Integración con Ecosistema

### **Flujo Completo**
1. **Auto-curator** → Selección inteligente
2. **Manifest JSON** → Metadata estructurada
3. **Ring Generator** → STL individual
4. **Tarjetas** → Presentación comercial
5. **Impresora** → Producción física

### **URLs Integradas**
- `index.html` - Dashboard principal
- `np-autocurator.html` - Motor de curaduría
- `neoproxy-ring-generator.html` - Generador de anillos
- `np-ring.html?seed=1234` - Vista individual
- `np-cards.html?seeds=1,2,3` - Tarjetas de drop

## 💡 Innovaciones Técnicas

1. **Diversidad Forzada**: Algoritmo único que evita drops homogéneos
2. **Arquetipos Tipológicos**: Clasificación semántica de formas
3. **Safety Industrial**: Reglas basadas en física de impresión 3D
4. **Scoring Multi-factor**: Evaluación estética cuantificable
5. **Narrativa Automática**: Storytelling generativo
6. **Manifest Export**: Metadata completa para coleccionistas

## 🎯 Métricas de Éxito

- **Success Rate**: ~0.15% (15/10,000)
- **Arquetipo Balance**: Máx 2 por tipo
- **Score Range**: 60-95 (dependiendo de complejidad)
- **Safety Rate**: 100% (DROP 01: SAFE only)
- **Processing Time**: ~2-3 segundos para 10,000 seeds

## 📈 Roadmap Futuro

### **DROP 02 - RISK**
- Incluir piezas RISK con warnings
- Nuevos arquetipos experimentales
- Scoring ajustado para complejidad

### **DROP 03 - HYBRID**
- Combinaciones inéditas
- Algoritmo evolutivo
- Community voting system

---

**NEOPROXY AUTO_CURATOR** - Donde el ruido paramétrico se convierte en arte certificado.
