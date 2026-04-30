'use client'

import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useEffect } from 'react';
import styles from './network.module.css';

// Dynamic import to avoid SSR issues with Three.js
const NeoProxyNetwork = dynamic(() => import('../../components/ConstellationNavigation'), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner}></div>
      <p>Initializing NeoProxy Network...</p>
    </div>
  )
});

export default function NetworkPage() {
  useEffect(() => {
    // Listener para activar transformación de serpiente en scroll
    let hasActivatedSerpent = false;

    const handleScroll = () => {
      if (!hasActivatedSerpent && window.scrollY > 100) { // Activación después de 100px de scroll
        if ((window as any).activateSerpentTransformation) {
          (window as any).activateSerpentTransformation();
          hasActivatedSerpent = true;
        }
      }
    };

    // Agregar listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>NeoProxy Network - The Living Network</title>
        <meta name="description" content="Explore the NeoProxy living network - a 3D constellation of digital consciousness" />
      </Head>

      {/* HUD Overlay */}
      <div className={styles.hud}>
        <div className={styles.hudHeader}>
          <h1 className={styles.title}>NEOPROXY NETWORK</h1>
          <p className={styles.subtitle}>The Living Network</p>
        </div>

        <div className={styles.hudStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>NODES</span>
            <span className={styles.statValue}>6</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>CONNECTIONS</span>
            <span className={styles.statValue}>8</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>STATUS</span>
            <span className={styles.statValue} style={{ color: '#00ff9c' }}>LIVE</span>
          </div>
        </div>

        <div className={styles.hudInstructions}>
          <p>🖱️ Hover nodes to explore</p>
          <p>👆 Click to focus</p>
          <p>⚡ Watch the data flow</p>
          <p>🐍 Scroll down for Serpent transformation</p>
        </div>
      </div>

      {/* 3D Network */}
      <NeoProxyNetwork />

      {/* Boot Sequence Overlay */}
      <div className={styles.bootSequence} id="bootSequence">
        <div className={styles.bootContent}>
          <div className={styles.bootLogo}>
            <span className={styles.neoproxy}>NEO</span>
            <span className={styles.proxy}>PROXY</span>
          </div>
          <div className={styles.bootText}>
            <p>Initializing Living Network...</p>
            <div className={styles.bootProgress}>
              <div className={styles.progressBar}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}