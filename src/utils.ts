/**
 * Text-to-Speech vocalizer. Pronounces the given English word or phrase.
 */
export function speakWord(word: string, lang: 'en' | 'ru' = 'en') {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech so it speaks immediately on click
    window.speechSynthesis.cancel();

    const bcp47 = lang === 'ru' ? 'ru-RU' : 'en-US';
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = bcp47;
    // Friendly, playful pitch & speed suited for kids
    utterance.rate = 0.85;
    utterance.pitch = 1.15;

    // Pick a voice matching the requested language if available
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith(lang === 'ru' ? 'ru' : 'en-'));
    if (match) {
      utterance.voice = match;
    }

    window.speechSynthesis.speak(utterance);
  }
}

/**
 * Standard Levenshtein Distance for similarity scoring
 */
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

/**
 * Strip vowels to match pronunciation of consonants (e.g. apple -> ppl, panda -> pnd)
 */
export function consonantsOnly(word: string): string {
  return word
    .toLowerCase()
    .replace(/[aeiouy\s\-_'"]/g, '');
}

/**
 * Clean up strings for standard comparisons
 */
export function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Robust Speech Transcribing Matcher
 * Evaluates whether a spoken text represents the target word
 */
export function matchesWord(spoken: string, target: string, easeMode: boolean = false): boolean {
  const sSpoken = spoken.toLowerCase().trim();
  const sTarget = target.toLowerCase().trim();
  
  if (!sSpoken || !sTarget) return false;

  // If the target itself contains spaces, it's a phrase!
  if (sTarget.includes(' ')) {
    const cleanSpoken = sSpoken.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    const cleanTarget = sTarget.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');

    if (cleanSpoken === cleanTarget) return true;

    if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
      const ratio = Math.min(cleanSpoken.length, cleanTarget.length) / Math.max(cleanSpoken.length, cleanTarget.length);
      if (ratio >= 0.5) return true;
    }

    // Word overlap check: count how many words from cleanTarget are present in cleanSpoken
    const targetWords = cleanTarget.split(' ').filter(w => w.length > 2); // only count words > 2 chars
    if (targetWords.length === 0) {
      const allTargetWords = cleanTarget.split(' ').filter(Boolean);
      const spokenWords = cleanSpoken.split(' ').filter(Boolean);
      const matches = allTargetWords.filter(w => spokenWords.includes(w));
      return matches.length / allTargetWords.length >= 0.6;
    } else {
      const spokenWords = cleanSpoken.split(' ').filter(Boolean);
      const matches = targetWords.filter(w => spokenWords.some(sw => sw === w || sw.includes(w) || w.includes(sw)));
      return matches.length / targetWords.length >= 0.6; // 60% of words matched
    }
  }

  // 0. Multi-word transcript: test each spoken token individually (robust recognition #35)
  // Web Speech often returns padding like "i think cat" or "the apple please";
  // matching per token catches the intended word even with surrounding chatter.
  if (sSpoken.includes(' ')) {
    const tokens = sSpoken.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (token !== sSpoken && matchesWord(token, sTarget, easeMode)) {
        return true;
      }
    }
  }

  // 1. Direct Match
  if (sSpoken === sTarget) return true;
  
  // 2. Direct Substring (handles surrounding audio junk e.g. "I say apple" or "apple ok")
  if (sSpoken.includes(sTarget) || sTarget.includes(sSpoken)) {
    return true;
  }
  
  // Clean alphanumeric comparison
  const cSpoken = cleanWord(sSpoken);
  const cTarget = cleanWord(sTarget);
  if (cSpoken === cTarget || cSpoken.includes(cTarget) || cTarget.includes(cSpoken)) {
    return true;
  }
  
  // 3. Consonants Only Match (vowel stripping)
  const consSpoken = consonantsOnly(sSpoken);
  const consTarget = consonantsOnly(sTarget);
  if (consSpoken && consTarget) {
    if (consSpoken === consTarget || consSpoken.includes(consTarget) || consTarget.includes(consSpoken)) {
      return true;
    }
    
    // Levenshtein on consonant representation
    const consDist = levenshteinDistance(consSpoken, consTarget);
    if (consDist <= (easeMode ? 2 : 1)) {
      return true;
    }
  }
  
  // 4. Levenshtein on full words (with high threshold/leniency)
  const fullDist = levenshteinDistance(cSpoken, cTarget);
  const tolerance = easeMode ? Math.max(1, Math.floor(cTarget.length * 0.4)) : Math.max(1, Math.floor(cTarget.length * 0.25));
  if (fullDist <= tolerance) {
    return true;
  }
  
  return false;
}

/**
 * Generate synthetic sound effects using standard HTML5 Web Audio API
 * This keeps the game lightweight, self-contained, and working in any modern browser!
 */
export const speakSound = {
  playCoin: () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      
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
      osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.08); // E4
      osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.16); // G4
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.24); // C5
      
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
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.45);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  }
};
