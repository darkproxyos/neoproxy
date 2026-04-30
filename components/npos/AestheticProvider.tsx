'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AestheticAgent } from '../../src/lib/agents/aesthetic';

interface AestheticContextType {
  tokens: any;
  updateAesthetics: (entropy: number, health: number) => Promise<void>;
}

const AestheticContext = createContext<AestheticContextType | undefined>(undefined);

export function AestheticProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<any>(null);

  const updateAesthetics = async (entropy: number, health: number) => {
    const genome = await AestheticAgent.generateGenome(entropy, health);
    setTokens(genome);
    
    // Apply to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--neo-primary', genome.palette.primary);
    root.style.setProperty('--neo-secondary', genome.palette.secondary);
    root.style.setProperty('--neo-background', genome.palette.background);
    root.style.setProperty('--neo-accent', genome.palette.accent);
    
    root.style.setProperty('--neo-glow', genome.lighting.glow);
    root.style.setProperty('--neo-intensity', genome.lighting.intensity.toString());
    
    root.style.setProperty('--neo-blur', genome.material.blur);
    root.style.setProperty('--neo-opacity', genome.material.opacity.toString());
    
    root.style.setProperty('--neo-rounding', genome.geometry.rounding);
    root.style.setProperty('--neo-border-width', genome.geometry.borderWidth);
  };

  useEffect(() => {
    // Initial call with baseline
    updateAesthetics(0.1, 1.0);
    
    // Poll for changes (simulating system awareness)
    const interval = setInterval(() => {
      // In a real scenario, this would fetch real entropy from Oracle
      const mockEntropy = Math.random();
      const mockHealth = 0.5 + Math.random() * 0.5;
      updateAesthetics(mockEntropy, mockHealth);
    }, 30000); // Pulse every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <AestheticContext.Provider value={{ tokens, updateAesthetics }}>
      {children}
    </AestheticContext.Provider>
  );
}

export const useAesthetics = () => {
  const context = useContext(AestheticContext);
  if (!context) throw new Error('useAesthetics must be used within AestheticProvider');
  return context;
};
