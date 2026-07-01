export type VoiceLanguage = 'en' | 'ru';

export type SpeechRecognitionStatus =
  | 'unsupported'
  | 'idle'
  | 'listening'
  | 'error';

export interface SpeechStatus {
  status: SpeechRecognitionStatus;
  message: string;
}

export interface RacerMovementState {
  lane: 0 | 1 | 2;
  pendingLane: 0 | 1 | 2 | null;
  lastAppliedAt: number;
}

export function createInitialRacerMovementState(lane: 0 | 1 | 2 = 1): RacerMovementState {
  return {
    lane,
    pendingLane: null,
    lastAppliedAt: 0,
  };
}

export function isSpeechSynthesisActive(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  return window.speechSynthesis.speaking || window.speechSynthesis.pending;
}

export function speakWord(word: string, lang: VoiceLanguage = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  if (isSpeechSynthesisActive()) {
    window.speechSynthesis.cancel();
  }

  const bcp47 = lang === 'ru' ? 'ru-RU' : 'en-US';
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = bcp47;
  utterance.rate = 0.85;
  utterance.pitch = 1.15;

  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((voice) =>
    voice.lang.startsWith(lang === 'ru' ? 'ru' : 'en-'),
  );
  if (match) {
    utterance.voice = match;
  }

  window.speechSynthesis.speak(utterance);
}

export function levenshteinDistance(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();

  const costs: number[] = [];
  for (let i = 0; i <= a.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= b.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (a.charAt(i - 1) !== b.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[b.length] = lastValue;
    }
  }
  return costs[b.length];
}

export function consonantsOnly(word: string): string {
  return word.toLowerCase().replace(/[aeiouy\s\-_'".]/g, '');
}

export function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function matchesWord(
  spoken: string,
  target: string,
  easeMode: boolean = false,
): boolean {
  const sSpoken = spoken.toLowerCase().trim();
  const sTarget = target.toLowerCase().trim();

  if (!sSpoken || !sTarget) return false;

  if (sSpoken.includes(' ')) {
    const tokens = sSpoken.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (token !== sSpoken && matchesWord(token, sTarget, easeMode)) {
        return true;
      }
    }
  }

  if (sSpoken === sTarget) return true;

  if (sSpoken.includes(sTarget) || sTarget.includes(sSpoken)) {
    return true;
  }

  const cSpoken = cleanWord(sSpoken);
  const cTarget = cleanWord(sTarget);
  if (cSpoken === cTarget || cSpoken.includes(cTarget) || cTarget.includes(cSpoken)) {
    return true;
  }

  const consSpoken = consonantsOnly(sSpoken);
  const consTarget = consonantsOnly(sTarget);
  if (consSpoken && consTarget) {
    if (
      consSpoken === consTarget ||
      consSpoken.includes(consTarget) ||
      consTarget.includes(consSpoken)
    ) {
      return true;
    }

    const consDist = levenshteinDistance(consSpoken, consTarget);
    if (consDist <= (easeMode ? 2 : 1)) {
      return true;
    }
  }

  const fullDist = levenshteinDistance(cSpoken, cTarget);
  const tolerance = easeMode
    ? Math.max(1, Math.floor(cTarget.length * 0.4))
    : Math.max(1, Math.floor(cTarget.length * 0.25));
  return fullDist <= tolerance;
}

export function updateRacerMovement(
  state: RacerMovementState,
  requestedLane: 0 | 1 | 2 | null,
  now: number,
  cadenceMs: number = 180,
): RacerMovementState {
  if (requestedLane === null) {
    if (state.pendingLane === null) {
      return state;
    }
    if (now - state.lastAppliedAt >= cadenceMs) {
      return {
        lane: state.pendingLane,
        pendingLane: null,
        lastAppliedAt: now,
      };
    }
    return state;
  }

  if (requestedLane === state.lane) {
    return {
      lane: state.lane,
      pendingLane: state.pendingLane,
      lastAppliedAt: now,
    };
  }

  if (state.pendingLane === requestedLane) {
    if (now - state.lastAppliedAt >= cadenceMs) {
      return {
        lane: requestedLane,
        pendingLane: null,
        lastAppliedAt: now,
      };
    }
    return state;
  }

  if (state.pendingLane === null) {
    return {
      lane: state.lane,
      pendingLane: requestedLane,
      lastAppliedAt: state.lastAppliedAt,
    };
  }

  return {
    lane: state.lane,
    pendingLane: requestedLane,
    lastAppliedAt: state.lastAppliedAt,
  };
}

export const speakSound = {
  playCoin: () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  },

  playCrash: () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  },

  playSuccess: () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, ctx.currentTime);
      osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(392.0, ctx.currentTime + 0.16);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.24);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  },

  playMiss: () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  },

  playAccelerate: () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  },
};
