import { createMachine } from 'xstate';

// NeoProxy OS (NPos) Kernel
// Mapped directly from the Manifesto Layer 02 (Agent Layer) and Layer 03 (Geometry Layer)

export const nposMachine = createMachine({
  id: 'npos-kernel',
  initial: 'idle',
  context: {
    specimenId: 0,
    seed: null,
    activeAlgorithm: 'lorenz',
    parameters: null,
    history: []
  },
  states: {
    idle: {
      on: {
        BOOT: 'active',
      }
    },
    active: {
      // The state of active navigation in the OS (Surface / Memory)
      on: {
        ENTER_LAB: 'resonant',
        ENTER_FABRICATION: 'portal'
      }
    },
    resonant: {
      // Generative Lab State. High computation, geometry engine active.
      on: {
        LEAVE_LAB: 'active',
        GENERATION_COMPLETE: 'resonant',
        EXPORT: 'portal'
      }
    },
    portal: {
      // Fabrication State. Data bridging to the physical world.
      on: {
        UPLOAD_COMPLETE: 'active',
        RETURN: 'active'
      }
    }
  }
});
