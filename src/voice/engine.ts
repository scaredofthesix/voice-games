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

  const isSpeaking = window.speechSynthesis.speaking;
  const isPending = window.speechSynthesis.pending;
  const globalActive = (window as any).speechSynthesisActive;
  const lastEndTime = (window as any).lastSpeechSynthesisEndTime || 0;
  const now = Date.now();

  return Boolean(isSpeaking || isPending || globalActive || (now - lastEndTime < 500));
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

  (window as any).speechSynthesisActive = true;
  (window as any).lastSpeechSynthesisEndTime = Date.now();

  const handleSpeechEnd = () => {
    (window as any).speechSynthesisActive = false;
    (window as any).lastSpeechSynthesisEndTime = Date.now();
  };

  utterance.onstart = () => {
    (window as any).speechSynthesisActive = true;
  };
  utterance.onend = handleSpeechEnd;
  utterance.onerror = handleSpeechEnd;

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

// Targets shorter than this are matched exactly: 2-3 letter words have too
// many one-edit neighbors (cat/cut/cap/car) for any fuzziness to be safe.
const FUZZY_MIN_TARGET_LENGTH = 4;

function normalizeToTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function fuzzyTolerance(targetLength: number, easeMode: boolean): number {
  if (targetLength < FUZZY_MIN_TARGET_LENGTH) return 0;
  if (targetLength <= (easeMode ? 5 : 6)) return 1;
  return 2;
}

function matchesSingleToken(
  spokenToken: string,
  target: string,
  easeMode: boolean,
): boolean {
  if (spokenToken === target) return true;

  const tolerance = fuzzyTolerance(target.length, easeMode);
  if (tolerance === 0) return false;
  // The leading sound is what the recognizer gets right most reliably;
  // requiring it keeps near-neighbor words (hat/cat, map/nap) from scoring.
  if (spokenToken[0] !== target[0]) return false;
  if (Math.abs(spokenToken.length - target.length) > tolerance) return false;

  return levenshteinDistance(spokenToken, target) <= tolerance;
}

// A false accept teaches a child that a wrong word was right, so this matcher
// prefers a false reject over a false accept: no substring matching, no
// consonant-skeleton matching, and fuzziness only on whole tokens with a
// tight, length-scaled edit budget.
export function matchesWord(
  spoken: string,
  target: string,
  easeMode: boolean = false,
): boolean {
  const spokenTokens = normalizeToTokens(spoken);
  const targetTokens = normalizeToTokens(target);
  if (spokenTokens.length === 0 || targetTokens.length === 0) return false;

  if (targetTokens.length === 1) {
    const targetToken = targetTokens[0];
    return spokenTokens.some((token) =>
      matchesSingleToken(token, targetToken, easeMode),
    );
  }

  // Multi-word target (phrase vocabulary): the recognizer may glue the phrase
  // into one token or keep it as separate words inside surrounding chatter.
  const joinedTarget = targetTokens.join('');
  if (
    spokenTokens.some((token) =>
      matchesSingleToken(token, joinedTarget, easeMode),
    )
  ) {
    return true;
  }
  for (let i = 0; i + targetTokens.length <= spokenTokens.length; i++) {
    const window = spokenTokens.slice(i, i + targetTokens.length);
    if (
      window.every((token, j) =>
        matchesSingleToken(token, targetTokens[j], easeMode),
      )
    ) {
      return true;
    }
    if (matchesSingleToken(window.join(''), joinedTarget, easeMode)) {
      return true;
    }
  }
  return false;
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
