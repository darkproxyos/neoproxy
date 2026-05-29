import { useEffect, useRef, useState } from 'react';
import { StardustEngine, StardustConfig } from '../engine/StardustEngine';
import { useKernelStore } from '@/store/useKernelStore';
import { useEntityStore } from '@/store/useEntityStore';

export function useStardust(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineInstance = useRef<StardustEngine | null>(null);
  const [fps, setFps] = useState(60);
  const cpuLoad = useKernelStore((s) => s.state?.cpu.load || 0);
  const entities = useEntityStore((s) => s.entities);
  
  const [config, setConfig] = useState<StardustConfig>({
    density: 80,
    complexity: 50,
    scale: 1.0,
    chaos: 0.1,
    seed: "A8F20-X"
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new StardustEngine(canvasRef.current);
    engineInstance.current = engine;
    engine.generate(config);

    const interval = setInterval(() => {
      setFps(engine.getFps());
    }, 1000);

    return () => {
      clearInterval(interval);
      engine.dispose();
    };
  }, []);

  // Reactividad al Kernel (CPU Load)
  useEffect(() => {
    if (engineInstance.current && cpuLoad > 80) {
      engineInstance.current.applyChaos((cpuLoad - 80) / 20);
    } else if (engineInstance.current) {
        engineInstance.current.applyChaos(0);
    }
  }, [cpuLoad]);

  // Sincronización de Entidades
  useEffect(() => {
    if (engineInstance.current) {
      engineInstance.current.syncEntities(entities);
    }
  }, [entities]);

  const regenerate = (newConfig?: Partial<StardustConfig>) => {
    if (engineInstance.current) {
      const merged = { ...config, ...newConfig };
      setConfig(merged);
      engineInstance.current.generate(merged);
    }
  };

  return {
    fps,
    config,
    setConfig,
    regenerate
  };
}
