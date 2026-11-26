import type { ExperimentId } from '../../lib/humo/vortex'
// la misma elección por defecto que la página (components/humo/HumoApp.tsx)
export const EXP_PEDESTAL: Record<ExperimentId, boolean> = { leapfrog: true, choque: false, oblicuo: true, nudo: false }
