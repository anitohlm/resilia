/**
 * Emergency Acoustic Alert System (Web Audio API Synthesizer)
 * Offline Synthesizer, Zero Network Dependency.
 * Generates standardized Emergency Alert System (EAS) dual-tone frequencies
 * and evacuation sirens for acoustic notification during critical disasters.
 */

type SirenType = 'EAS_ALERT' | 'EVACUATION_WAIL' | 'CHIME' | 'PULSED_ALARM';

class EmergencyAudioService {
  private ctx: AudioContext | null = null;
  private activeNodes: { stop: () => void }[] = [];
  private currentPlayingType: SirenType | null = null;
  private autoStopTimer: any = null;

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isPlaying(): boolean {
    return this.activeNodes.length > 0;
  }

  public getCurrentType(): SirenType | null {
    return this.currentPlayingType;
  }

  public stop(): void {
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // ignore already stopped nodes
      }
    });
    this.activeNodes = [];
    this.currentPlayingType = null;
  }

  /**
   * Play Emergency Sound
   * @param type SirenType
   * @param durationSeconds default 6 seconds
   */
  public play(type: SirenType = 'EAS_ALERT', durationSeconds: number = 6): void {
    this.stop();
    const ctx = this.initContext();
    this.currentPlayingType = type;

    try {
      if (type === 'EAS_ALERT') {
        // Official Emergency Alert System (EAS) Dual-Tone: 853 Hz + 960 Hz
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(853, ctx.currentTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(960, ctx.currentTime);

        // Modulate gain to create authoritative attention tone
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.1);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        this.activeNodes.push({
          stop: () => {
            try {
              gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
              setTimeout(() => {
                osc1.stop();
                osc2.stop();
                osc1.disconnect();
                osc2.disconnect();
              }, 60);
            } catch {
              // ignore
            }
          },
        });
      } else if (type === 'EVACUATION_WAIL') {
        // High-low sweeping siren 600 Hz -> 1150 Hz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);

        const now = ctx.currentTime;
        const cycle = 1.2; // 1.2s per sweep
        const cycles = Math.ceil(durationSeconds / cycle);

        for (let i = 0; i < cycles; i++) {
          const t = now + i * cycle;
          osc.frequency.setValueAtTime(600, t);
          osc.frequency.linearRampToValueAtTime(1150, t + cycle * 0.5);
          osc.frequency.linearRampToValueAtTime(600, t + cycle);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        this.activeNodes.push({
          stop: () => {
            try {
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
              setTimeout(() => {
                osc.stop();
                osc.disconnect();
              }, 60);
            } catch {
              // ignore
            }
          },
        });
      } else if (type === 'CHIME') {
        // 3-note emergency bulletin chime C5 -> E5 -> G5
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = ctx.currentTime + idx * 0.25;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.001, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.3, noteStart + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.45);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteStart);
          osc.stop(noteStart + 0.5);

          this.activeNodes.push({
            stop: () => {
              try {
                osc.stop();
                osc.disconnect();
              } catch {}
            },
          });
        });
      } else if (type === 'PULSED_ALARM') {
        // Rapid warning pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);

        const now = ctx.currentTime;
        for (let t = now; t < now + durationSeconds; t += 0.3) {
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.setValueAtTime(0.001, t + 0.15);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        this.activeNodes.push({
          stop: () => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {}
          },
        });
      }

      this.autoStopTimer = setTimeout(() => {
        this.stop();
      }, durationSeconds * 1000);
    } catch (err) {
      console.warn('Audio playback error (browser user-gesture policy may require click):', err);
      this.stop();
    }
  }
}

export const emergencyAudio = new EmergencyAudioService();
