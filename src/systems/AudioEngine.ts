/**
 * AudioEngine.ts
 * NeoProxy Audio System - Web Audio API Implementation
 * 
 * Provides reactive audio feedback for game events:
 * - Drone ambience modulated by global coherence
 * - Sweep effect on node absorb
 * - Glitch effect on corruption events
 */

export type AudioEventType = 'absorb' | 'corrupt' | 'resonate' | 'ambient';

interface AudioEngineConfig {
  masterVolume: number;
  coherenceFrequency: number;
  corruptionFrequency: number;
}

class AudioEngine {
  private static instance: AudioEngine | null = null;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOscillator: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isInitialized = false;
  private config: AudioEngineConfig = {
    masterVolume: 0.3,
    coherenceFrequency: 220, // A3
    corruptionFrequency: 110,  // A2
  };

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initialize audio context on first user gesture
   * Must be called after user interaction (click/touch)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.config.masterVolume;
      this.masterGain.connect(this.audioContext.destination);

      // Create drone (ambient coherence sound)
      this.createDrone();

      this.isInitialized = true;
      console.log('[AudioEngine] Initialized successfully');
    } catch (error) {
      console.error('[AudioEngine] Initialization failed:', error);
    }
  }

  /**
   * Create ambient drone that responds to coherence
   */
  private createDrone(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Main drone oscillator - sine wave for smooth texture
    this.droneOscillator = this.audioContext.createOscillator();
    this.droneOscillator.type = 'sine';
    this.droneOscillator.frequency.value = this.config.coherenceFrequency;

    // LFO for subtle modulation
    this.lfo = this.audioContext.createOscillator();
    this.lfo.type = 'triangle';
    this.lfo.frequency.value = 0.1; // Slow modulation

    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 5; // Modulation depth in Hz

    // Drone gain (starts silent, fades in)
    this.droneGain = this.audioContext.createGain();
    this.droneGain.gain.value = 0;

    // Connect LFO to modulate drone frequency
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.droneOscillator.frequency);

    // Connect drone to output
    this.droneOscillator.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    // Start oscillators
    this.droneOscillator.start();
    this.lfo.start();

    // Fade in drone slowly
    this.droneGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 2);
  }

  /**
   * Update coherence value - modulates drone frequency
   * @param coherence 0-100 scale
   */
  setCoherence(coherence: number): void {
    if (!this.isInitialized || !this.audioContext || !this.droneOscillator) return;

    // Map coherence (0-100) to frequency range (110Hz - 440Hz)
    const normalizedCoherence = Math.max(0, Math.min(100, coherence)) / 100;
    const baseFreq = 110 + (normalizedCoherence * 330);
    
    this.droneOscillator.frequency.setTargetAtTime(
      baseFreq,
      this.audioContext.currentTime,
      0.1 // Smooth transition
    );

    // Also modulate volume slightly
    if (this.droneGain) {
      const volume = 0.1 + (normalizedCoherence * 0.2);
      this.droneGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.2);
    }
  }

  /**
   * Play event sound effect
   */
  playEvent(type: AudioEventType): void {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) {
      console.warn('[AudioEngine] Not initialized - call initialize() first');
      return;
    }

    switch (type) {
      case 'absorb':
        this.playSweep();
        break;
      case 'corrupt':
        this.playGlitch();
        break;
      case 'resonate':
        this.playResonate();
        break;
      case 'ambient':
        // Ambient is handled by continuous drone
        break;
    }
  }

  /**
   * Sweep effect - rising frequency (node absorb)
   */
  private playSweep(): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.3);

    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);

    // Cleanup
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, 350);
  }

  /**
   * Glitch effect - filtered noise burst (corruption)
   */
  private playGlitch(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * 0.2; // 200ms
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    // Filter for glitchy character
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 10;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    noise.stop(this.audioContext.currentTime + 0.2);

    setTimeout(() => {
      noise.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, 250);
  }

  /**
   * Resonate effect - harmonic chime
   */
  private playResonate(): void {
    if (!this.audioContext || !this.masterGain) return;

    const fundamental = 523.25; // C5
    const harmonics = [1, 1.5, 2, 2.5, 3];

    harmonics.forEach((harmonic, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = fundamental * harmonic;

      const delay = index * 0.02;
      const duration = 0.5 - (index * 0.05);

      gain.gain.setValueAtTime(0, this.audioContext!.currentTime + delay);
      gain.gain.linearRampToValueAtTime(
        0.15 / harmonics.length,
        this.audioContext!.currentTime + delay + 0.05
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext!.currentTime + delay + duration
      );

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(this.audioContext!.currentTime + delay);
      osc.stop(this.audioContext!.currentTime + delay + duration);

      setTimeout(() => {
        osc.disconnect();
        gain.disconnect();
      }, (delay + duration) * 1000 + 50);
    });
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    if (!this.masterGain || !this.audioContext) return;
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setTargetAtTime(clampedVolume, this.audioContext.currentTime, 0.1);
  }

  /**
   * Mute/unmute audio
   */
  setMuted(muted: boolean): void {
    if (!this.masterGain || !this.audioContext) return;
    const targetVolume = muted ? 0 : this.config.masterVolume;
    this.masterGain.gain.setTargetAtTime(targetVolume, this.audioContext.currentTime, 0.1);
  }

  /**
   * Resume audio context (after browser suspension)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Dispose audio resources
   */
  dispose(): void {
    this.droneOscillator?.stop();
    this.lfo?.stop();
    this.audioContext?.close();
    
    this.droneOscillator = null;
    this.lfo = null;
    this.droneGain = null;
    this.masterGain = null;
    this.audioContext = null;
    this.isInitialized = false;
    AudioEngine.instance = null;
  }
}

export default AudioEngine;
