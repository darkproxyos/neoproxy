'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './espada.module.css';

const EspadaProxy = dynamic(() => import('../../components/EspadaProxy'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Cargando Espada Proxy...</div>
});

export default function EspadaPage() {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('concept');

  const phases = [
    { id: 'concept', name: 'Concepto IA', icon: '🎨', description: 'Generado con Midjourney' },
    { id: 'modeling', name: 'Modelado 3D', icon: '⚙️', description: 'Blender + Fusion 360' },
    { id: 'printing', name: 'Impresión 3D', icon: '🏭', description: '5 días continuos' },
    { id: 'assembly', name: 'Ensamblaje', icon: '🔌', description: 'Electrónica + testing' },
    { id: 'complete', name: 'Completado', icon: '✨', description: 'Lista para batalla' }
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.cyber}>🗡️</span>
          <span className={styles.main}>Espada Proxy</span>
          <span className={styles.quantum}>⚡</span>
        </h1>
        <p className={styles.subtitle}>
          Interface física para acceso a la red NeoProxy
        </p>
      </div>

      {/* Visualización 3D */}
      <div className={styles.viewport}>
        <div className={styles.scene}>
          <EspadaProxy 
            position={[0, 0, 0]} 
            scale={0.3}
            active={isActive}
          />
        </div>
        
        {/* Controles */}
        <div className={styles.controls}>
          <button 
            className={`${styles.activateBtn} ${isActive ? styles.active : ''}`}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? '⚡ Desactivar' : '🔋 Activar'} Sistema
          </button>
        </div>
      </div>

      {/* Workflow Timeline */}
      <div className={styles.workflow}>
        <h2 className={styles.workflowTitle}>Protocolo de Creación</h2>
        
        <div className={styles.timeline}>
          {phases.map((phase, index) => (
            <div 
              key={phase.id}
              className={`${styles.phase} ${currentPhase === phase.id ? styles.active : ''}`}
              onClick={() => setCurrentPhase(phase.id)}
            >
              <div className={styles.phaseIcon}>{phase.icon}</div>
              <div className={styles.phaseInfo}>
                <h3 className={styles.phaseName}>{phase.name}</h3>
                <p className={styles.phaseDesc}>{phase.description}</p>
              </div>
              <div className={styles.phaseConnector} />
            </div>
          ))}
        </div>
      </div>

      {/* Especificaciones Técnicas */}
      <div className={styles.specs}>
        <h2 className={styles.specsTitle}>Especificaciones</h2>
        
        <div className={styles.specsGrid}>
          <div className={styles.specCard}>
            <h3>⚡ Energía</h3>
            <ul>
              <li>Batería Li-ion 18650</li>
              <li>Autonomía: 48 horas</li>
              <li>Carga rápida USB-C</li>
              <li>LEDs RGB programables</li>
            </ul>
          </div>
          
          <div className={styles.specCard}>
            <h3>🏭 Materiales</h3>
            <ul>
              <li>Hoja: PLA Translúcido</li>
              <li>Mango: PETG Carbon Fiber</li>
              <li>Guardia: Resina UV</li>
              <li>Vaina: ABS con LEDs</li>
            </ul>
          </div>
          
          <div className={styles.specCard}>
            <h3>🔌 Electrónica</h3>
            <ul>
              <li>Arduino Nano</li>
              <li>Sensor táctil capacitivo</li>
              <li>Bluetooth 5.0</li>
              <li>Display OLED integrado</li>
            </ul>
          </div>
          
          <div className={styles.specCard}>
            <h3>📏 Dimensiones</h3>
            <ul>
              <li>Longitud: 103cm total</li>
              <li>Hoja: 73cm</li>
              <li>Mango: 28cm</li>
              <li>Peso: 1.1kg</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className={styles.cta}>
        <h2>🚀 Crea tu propia Espada Proxy</h2>
        <div className={styles.ctaButtons}>
          <button className={styles.ctaBtn}>
            🆓 Descargar STL Gratis
          </button>
          <button className={styles.ctaBtn}>
            💎 Comprar Versión Premium
          </button>
          <button className={styles.ctaBtn}>
            🏭 Encargar Impresa
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>Protocolo NeoProxy - Forjando el futuro, capa por capa</p>
      </div>
    </div>
  );
}
