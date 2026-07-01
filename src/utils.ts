/**
 * Text-to-Speech vocalizer. Pronounces the given English word or phrase.
 */
export function speakWord(word: string, lang: 'en' | 'ru' = 'en') {
  if ('speechSynthesis' in window) {
    // Reset global flags before cancelling to be safe
    (window as any).speechSynthesisActive = false;
    (window as any).lastSpeechSynthesisEndTime = Date.now();
    window.speechSynthesis.cancel();

    const bcp47 = lang === 'ru' ? 'ru-RU' : 'en-US';
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = bcp47;
    // Friendly, playful pitch & speed suited for kids
    utterance.rate = 0.85;
    utterance.pitch = 1.15;

    // Track speaking status globally to avoid microphone feedback
    (window as any).speechSynthesisActive = true;
    (window as any).lastSpeechSynthesisEndTime = Date.now();
    (window as any).activeUtterance = utterance;

    const handleSpeechEnd = () => {
      (window as any).speechSynthesisActive = false;
      (window as any).lastSpeechSynthesisEndTime = Date.now();
      (window as any).activeUtterance = null;
    };

    utterance.onstart = () => {
      (window as any).speechSynthesisActive = true;
    };
    utterance.onend = handleSpeechEnd;
    utterance.onerror = handleSpeechEnd;

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
 * Check if speech synthesis is actively speaking or just completed speaking,
 * to prevent the microphone from capturing synthesized audio output.
 */
export function isSpeechSynthesisActive(): boolean {
  if (typeof window === 'undefined') return false;
  const isSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
  const globalActive = (window as any).speechSynthesisActive;
  const lastEndTime = (window as any).lastSpeechSynthesisEndTime || 0;
  const now = Date.now();
  
  // Cooldown of 500ms to allow recognition audio buffers to clear
  return Boolean(isSpeaking || globalActive || (now - lastEndTime < 500));
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
/**
 * Robust Speech Transcribing Matcher
 * Evaluates whether a spoken text represents the target word
 */
export function matchesWord(spoken: string, target: string, easeMode: boolean = false): boolean {
  const sSpoken = spoken.toLowerCase().trim();
  const sTarget = target.toLowerCase().trim();
  
  if (!sSpoken || !sTarget) return false;

  // 1. Direct raw match
  if (sSpoken === sTarget) return true;

  // Clean strings (retain letters, digits, and Cyrillic)
  const cleanStr = (str: string) => str.toLowerCase().replace(/[^a-z0-9а-яё\s]/g, '');
  const cSpoken = cleanStr(sSpoken);
  const cTarget = cleanStr(sTarget);

  if (cSpoken === cTarget) return true;

  // Tokenize
  const getTokens = (str: string) => str.split(/\s+/).filter(Boolean);
  const spokenTokens = getTokens(cSpoken);
  const targetTokens = getTokens(cTarget);

  if (targetTokens.length === 0) return false;

  // If target has multiple words (phrase)
  if (targetTokens.length > 1) {
    let matchedWords = 0;
    for (const tToken of targetTokens) {
      const found = spokenTokens.some(sToken => {
        if (sToken === tToken) return true;
        const dist = levenshteinDistance(sToken, tToken);
        const maxLen = Math.max(sToken.length, tToken.length);
        const similarity = maxLen > 0 ? (1 - dist / maxLen) : 0;
        return similarity >= 0.55; // 55% similarity per word in phrase is very forgiving
      });
      if (found) matchedWords++;
    }
    const ratio = matchedWords / targetTokens.length;
    return ratio >= 0.6; // 60% of target words found is a match!
  }

  // Single-word target
  const singleTarget = targetTokens[0];
  if (!singleTarget) return false;

  // Vowel remover for Russian and English
  const stripVowels = (w: string) => w.replace(/[aeiouyаеёиоуыэюя]/g, '');
  const targetNoVowels = stripVowels(singleTarget);

  for (const token of spokenTokens) {
    if (token === singleTarget) return true;

    // Substring contains for medium/long words (e.g. "butterfly" vs "butter" or "butterflies")
    if (singleTarget.length >= 4 && token.length >= 4) {
      if (token.includes(singleTarget) || singleTarget.includes(token)) {
        return true;
      }
    }

    // Levenshtein-based character similarity percentage
    const dist = levenshteinDistance(token, singleTarget);
    const maxLen = Math.max(token.length, singleTarget.length);
    const charSimilarity = maxLen > 0 ? (1 - dist / maxLen) : 0;

    // 50% character similarity for words with length > 3
    // 66% character similarity for short words (length <= 3)
    const requiredSimilarity = singleTarget.length <= 3 ? 0.66 : 0.50;
    if (charSimilarity >= requiredSimilarity) {
      return true;
    }

    // Consonant skeleton matching (excellent for speech recognition errors and pronunciation slips)
    const tokenNoVowels = stripVowels(token);
    if (tokenNoVowels && targetNoVowels) {
      if (tokenNoVowels === targetNoVowels) return true;
      const consDist = levenshteinDistance(tokenNoVowels, targetNoVowels);
      const consMaxLen = Math.max(tokenNoVowels.length, targetNoVowels.length);
      const consSimilarity = consMaxLen > 0 ? (1 - consDist / consMaxLen) : 0;
      if (consSimilarity >= 0.60) {
        return true;
      }
    }
  }

  // Fallback: target exists inside spoken phrase
  if (cSpoken.includes(singleTarget) || singleTarget.includes(cSpoken)) {
    if (singleTarget.length >= 3 && cSpoken.length >= 3) {
      return true;
    }
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
