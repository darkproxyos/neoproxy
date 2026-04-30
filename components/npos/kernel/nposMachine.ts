import { createMachine } from 'xstate';

// NeoProxy OS (NPos) Kernel
// States mapped directly from the Manifesto (Layers 01–05)

export const nposMachine = createMachine({
  id: 'npos-kernel',
  initial: 'idle',
  context: {
    specimenId: 0,
    seed: null as number | null,
    activeAlgorithm: 'lorenz',
    parameters: null as Record<string, number> | null,
    history: [] as string[],
  },
  states: {
    idle: {
      on: { BOOT: 'active' }
    },
    active: {
      on: {
        ENTER_LAB: 'resonant',
        ENTER_FABRICATION: 'portal',
      }
    },
    resonant: {
      on: {
        LEAVE_LAB: 'active',
        GENERATION_COMPLETE: 'resonant',
        EXPORT: 'portal',
      }
    },
    portal: {
      on: {
        UPLOAD_COMPLETE: 'active',
        RETURN: 'active',
      }
    }
  }
});
