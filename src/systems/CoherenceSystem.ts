export type CoherenceState = 'STABLE' | 'CRITICAL' | 'DISSOLVED';

export class CoherenceSystem {
  private coherence = 100;
  private maxCoherence = 100;
  private state: CoherenceState = 'STABLE';
  private decayTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.decayTimer = setInterval(() => {
      if (this.coherence > 0) {
        this.coherence = Math.max(0, this.coherence - 2);
        this.updateState();
      }
    }, 1000);
  }

  public reset(): void {
    this.coherence = this.maxCoherence;
    this.updateState();
  }

  public dispose(): void {
    clearInterval(this.decayTimer);
  }

  private updateState(): void {
    if (this.coherence <= 0) this.state = 'DISSOLVED';
    else if (this.coherence < 40) this.state = 'CRITICAL';
    else this.state = 'STABLE';
  }

  public absorbNode(amount: number): void {
    this.coherence = Math.min(this.maxCoherence, Math.max(0, this.coherence + amount));
    this.updateState();
  }

  public getCoherence(): number { return this.coherence; }
  public getState(): CoherenceState { return this.state; }
}
