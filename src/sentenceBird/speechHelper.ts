/**
 * Forgiveness and speech comparison algorithms for kids' pronunciation.
 */

// Helper to remove punctuation and convert to lowercase
export function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip vowels to compare consonants only (as per customer interview transcript)
export function stripVowels(text: string): string {
  const cleaned = cleanText(text);
  // Remove English vowels: a, e, i, o, u, y
  return cleaned.replace(/[aeiouy]/g, "").replace(/\s+/g, "");
}

// Compute Levenshtein Distance
export function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[len1][len2];
}

// Calculate similarity ratio between 0 and 1
export function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

export const ACCEPTABLE_ALIASES: Record<string, string[]> = {
  "bird": ["burd", "byrd", "baird"],
  "cat": ["kat"],
  "cats": ["katz"],
  "sun": ["sunn"],
  "rain": ["reign", "rein"],
  "stars": ["starz"],
  "apple": ["aple"],
  "pizza": ["pitza", "pitsa", "peetsa", "peets"],
  "cycle": ["saikle", "cicle", "psycle", "cykel"],
  "puppy": ["puppie", "pup", "pubby"],
  "rabbit": ["rabit", "rabet"],
  "rainbow": ["rain bow"],
  "bedroom": ["bed room"],
  "shining": ["shinin"],
};

export const PRONUNCIATION_MISTAKES: Record<string, { mistake: string; tip: string }[]> = {
  "bird": [
    { mistake: "better", tip: "Keep your jaw tighter and pull your tongue backwards for the smooth /ɜːr/ sound. Don't let it drift to 'better'!" },
    { mistake: "bed", tip: "Don't let it sound like 'bed'! Keep your tongue suspended in the middle of your mouth instead of dropping your jaw." },
    { mistake: "bad", tip: "Keep your jaw slightly raised so it doesn't sound like 'bad'." },
    { mistake: "beard", tip: "Keep the vowel uniform. Avoid turning the /ɜːr/ into a double sound like 'beard'." }
  ],
  "cat": [
    { mistake: "ket", tip: "Drop your jaw lower and open your mouth wider for the classic /æ/ sound in 'cat'!" },
    { mistake: "cut", tip: "Open your mouth wider and stretch your lips sideways; otherwise, the mic hears 'cut'." },
    { mistake: "get", tip: "Pronounce the initial /k/ clearly so it doesn't sound like /g/." }
  ],
  "cats": [
    { mistake: "ket", tip: "Drop your jaw lower and open your mouth wider for the classic /æ/ in 'cats'!" }
  ],
  "think": [
    { mistake: "sink", tip: "Put your tongue gently between your front teeth! Don't let it sound like 'sink' with an 's'." },
    { mistake: "tink", tip: "Don't bite your tongue completely or hide it! Blow air out softly for 'think'." }
  ],
  "three": [
    { mistake: "tree", tip: "Put your tongue between your teeth so it doesn't sound like 'tree'!" },
    { mistake: "free", tip: "Don't use your top teeth on your bottom lip. Keep your tongue between your front teeth." }
  ],
  "puppy": [
    { mistake: "pappy", tip: "Keep your lips relaxed for the short /ʌ/ sound instead of the wide open 'pappy'." },
    { mistake: "poppy", tip: "Keep your mouth less rounded so it doesn't sound like 'poppy'." }
  ],
  "rabbit": [
    { mistake: "habit", tip: "Make sure you roll or glide the /r/ sound instead of making a breathing /h/ sound." }
  ],
  "rain": [
    { mistake: "ran", tip: "For 'rain', say /eɪ/ like in 'day'. Don't shorten it to 'ran'!" },
    { mistake: "red", tip: "Make a clear long /eɪ/ sound. 'Rain' shouldn't sound like 'red'." }
  ],
  "stars": [
    { mistake: "stairs", tip: "Open your mouth wide for the /ɑː/ in 'stars' (like 'ah'). Don't say 'stairs'!" },
    { mistake: "store", tip: "Keep your mouth open and unrounded. 'Stars' has an 'ah' sound, not 'oh'." }
  ],
  "milk": [
    { mistake: "melk", tip: "Make a crisp short /ɪ/ sound like in 'is'. Don't let it drift to 'melk'!" }
  ],
  "jump": [
    { mistake: "yump", tip: "Start with a strong /dʒ/ sound (like 'juice'). Avoid saying 'yump'!" }
  ],
  "cycle": [
    { mistake: "sickle", tip: "Pronounce the first syllable with a wide /aɪ/ like in 'sky'. Don't say 'sickle'!" }
  ],
  "dance": [
    { mistake: "dens", tip: "Open your mouth wider for the bright /æ/ or /ɑː/ sound in 'dance'." }
  ],
  "apple": [
    { mistake: "epel", tip: "Open your mouth wide and stretch your lips sideways for the short /æ/ in 'apple'. Don't say 'epel'!" }
  ]
};

// Multi-tier matcher to determine if the spoken utterance matches the target phrase
export interface MatchDetails {
  isMatch: boolean;
  score: number; // 0 to 100
  method: 'exact' | 'contain' | 'consonant' | 'levenshtein' | 'none';
  matchedWords: boolean[]; // corresponding to words in target phrase
  detectedMistakeTip?: string | null;
}

// Helper to match a single spoken word with a target word under strict rules
function isWordMatch(sWord: string, tWord: string): boolean {
  const s = cleanText(sWord);
  const t = cleanText(tWord);
  if (s === t) return true;
  
  const aliases = ACCEPTABLE_ALIASES[t] || [];
  if (aliases.includes(s)) return true;
  
  // For longer words (5+ characters), allow extremely close Levenshtein distance (at most 1 edit)
  // This allows minor suffixes/endings but avoids matching completely different short words.
  if (t.length >= 5) {
    const dist = levenshteinDistance(t, s);
    if (dist <= 1) return true;
  }
  
  return false;
}

export function checkPhraseMatch(spoken: string, target: string): MatchDetails {
  const cleanSpoken = cleanText(spoken);
  const cleanTarget = cleanText(target);
  
  if (!cleanSpoken || !cleanTarget) {
    return {
      isMatch: false,
      score: 0,
      method: 'none',
      matchedWords: [],
    };
  }

  const targetWords = cleanTarget.split(" ");
  const spokenWords = cleanSpoken.split(" ");
  
  // 1. Check for specific common pronunciation mistakes first to offer educational guidance
  let detectedMistakeTip: string | null = null;
  let hasPronunciationMistake = false;
  for (const tWord of targetWords) {
    const cleanT = cleanText(tWord);
    const mistakes = PRONUNCIATION_MISTAKES[cleanT] || [];
    for (const item of mistakes) {
      if (spokenWords.some(sWord => cleanText(sWord) === cleanText(item.mistake))) {
        detectedMistakeTip = item.tip;
        hasPronunciationMistake = true;
        break;
      }
    }
    if (detectedMistakeTip) break;
  }

  // 2. Filter list of standard articles and minor fillers to focus comparison on content words
  const FILLER_WORDS = ["a", "an", "the", "and", "is", "it", "to", "of", "oh", "um", "uh", "in", "on", "at", "by", "for", "with", "from"];
  
  const targetContent = targetWords.filter(w => !FILLER_WORDS.includes(cleanText(w)));
  const spokenContent = spokenWords.filter(w => !FILLER_WORDS.includes(cleanText(w)));

  // Fallback to full lists if all words are filtered out (unlikely with our preset phrases)
  const tList = targetContent.length > 0 ? targetContent : targetWords;
  const sList = spokenContent.length > 0 ? spokenContent : spokenWords;

  // 3. Align tList content words with sList content words in sequential order
  const matchedIndices = new Set<number>();
  let lastSpokenIdx = -1;
  const matchedTargetFlags = tList.map(() => false);

  tList.forEach((tWord, tIdx) => {
    for (let j = lastSpokenIdx + 1; j < sList.length; j++) {
      if (isWordMatch(sList[j], tWord)) {
        matchedTargetFlags[tIdx] = true;
        matchedIndices.add(j);
        lastSpokenIdx = j;
        break;
      }
    }
  });

  const matchedCount = matchedTargetFlags.filter(Boolean).length;
  const unmatchedSpokenCount = sList.length - matchedIndices.size;

  // For excellent pronunciation, we require all content words to be matched
  // and strictly prevent extra unmatched content words from being spoken (babbling/random words)
  let isMatch = false;
  if (!hasPronunciationMistake) {
    const matchesAll = matchedCount === tList.length;
    // For longer target sentences (4+ content words), we can allow missing at most 1 word to prevent too much frustration
    const isHighMatch = tList.length >= 4 ? (matchedCount >= tList.length - 1) : matchesAll;
    
    // We allow 0 unmatched content words. For very long phrases (5+ content words), we allow at most 1.
    const maxAllowedUnmatched = tList.length >= 5 ? 1 : 0;

    if (isHighMatch && unmatchedSpokenCount <= maxAllowedUnmatched) {
      isMatch = true;
    }
  }

  let method: MatchDetails['method'] = 'none';
  if (isMatch) {
    if (cleanSpoken === cleanTarget) method = 'exact';
    else if (unmatchedSpokenCount === 0) method = 'consonant'; // high similarity
    else method = 'levenshtein';
  }

  // Calculate score between 0 and 100 based on matched content words ratio
  const matchedRatio = tList.length > 0 ? matchedCount / tList.length : 0;
  const baseScore = matchedRatio * 100;

  return {
    isMatch,
    score: Math.min(100, Math.round(isMatch ? Math.max(85, baseScore) : baseScore)),
    method,
    matchedWords: isMatch ? targetWords.map(() => true) : targetWords.map((_, idx) => {
      // Approximate targetWords indices that match for UI highlighting
      const cleanW = cleanText(targetWords[idx]);
      return spokenWords.some(sw => isWordMatch(sw, cleanW));
    }),
    detectedMistakeTip,
  };
}
