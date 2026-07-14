/**
 * Client-Side Audio Synthesizer using Web Audio API
 * Generates instant sound effects for game states without external files.
 */

import { createGameAudioContext } from '../voice/engine';

class AudioSynthesizer {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = createGameAudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playFlap() {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Synth failed", e);
    }
  }

  playSentenceComplete() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Joyful chord (C-major major 7)
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Ascending chime
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.06 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.6);
      });
    } catch (e) {
      console.warn("Synth failed", e);
    }
  }

}

export const synths = new AudioSynthesizer();
