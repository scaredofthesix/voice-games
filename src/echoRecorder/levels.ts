import type { EchoLevel, EchoWord } from './types';

export const LEVEL_1_POOL: EchoWord[] = [
  { text: "Apple", translation: "Яблоко", emoji: "🍎", phonetic: "/ˈæp.əl/" },
  { text: "Sun", translation: "Солнце", emoji: "☀️", phonetic: "/sʌn/" },
  { text: "Tree", translation: "Дерево", emoji: "🌳", phonetic: "/triː/" },
  { text: "Bird", translation: "Птица", emoji: "🐦", phonetic: "/bɜːrd/" },
  { text: "Water", translation: "Вода", emoji: "💧", phonetic: "/ˈwɔː.tər/" },
  { text: "Clock", translation: "Часы", emoji: "⏰", phonetic: "/klɒk/" },
  { text: "Star", translation: "Звезда", emoji: "⭐", phonetic: "/stɑːr/" },
  { text: "House", translation: "Дом", emoji: "🏠", phonetic: "/haʊs/" },
  { text: "Green", translation: "Зеленый", emoji: "💚", phonetic: "/ɡriːn/" },
  { text: "Spoon", translation: "Ложка", emoji: "🥄", phonetic: "/spuːn/" },
];

export const LEVEL_2_POOL: EchoWord[] = [
  { text: "Run fast", translation: "Беги быстро", emoji: "🏃‍♂️", phonetic: "/rʌn fɑːst/" },
  { text: "Speak clear", translation: "Говори четко", emoji: "🗣️", phonetic: "/spiːk klɪər/" },
  { text: "Fly high", translation: "Лети высоко", emoji: "✈️", phonetic: "/flaɪ haɪ/" },
  { text: "Smile bright", translation: "Улыбайся ярко", emoji: "✨", phonetic: "/smaɪl braɪt/" },
  { text: "Look up", translation: "Посмотри вверх", emoji: "👀", phonetic: "/lʊk ʌp/" },
  { text: "Play music", translation: "Играй музыку", emoji: "🎵", phonetic: "/pleɪ ˈmjuː.zɪk/" },
  { text: "Drink milk", translation: "Пей молоко", emoji: "🥛", phonetic: "/drɪŋk mɪlk/" },
  { text: "Sweet cat", translation: "Милый кот", emoji: "🐱", phonetic: "/swiːt kæt/" },
  { text: "Blue sky", translation: "Синее небо", emoji: "🌌", phonetic: "/bluː skaɪ/" },
  { text: "Ice cream", translation: "Мороженое", emoji: "🍦", phonetic: "/aɪs kriːm/" },
];

export const LEVEL_3_POOL: EchoWord[] = [
  { text: "Piece of cake", translation: "Проще простого", emoji: "🍰", phonetic: "/piːs əv keɪk/" },
  { text: "Break a leg", translation: "Ни пуха, ни пера", emoji: "🎭", phonetic: "/breɪk ə leɡ/" },
  { text: "Once in a blue moon", translation: "Раз в сто лет", emoji: "🌙", phonetic: "/wʌns ɪn ə bluː muːn/" },
  { text: "Quiet as a mouse", translation: "Тихий как мышь", emoji: "🐭", phonetic: "/ˈkwaɪ.ət æz ə maʊs/" },
  { text: "Better late than never", translation: "Лучше поздно, чем никогда", emoji: "⏳", phonetic: "/ˈbet.ər leɪt ðæn ˈnev.ər/" },
  { text: "She sells seashells", translation: "Она продает ракушки", emoji: "🐚", phonetic: "/ʃiː selz ˈsiː.ʃelz/" },
  { text: "Time flies like an arrow", translation: "Время летит как стрела", emoji: "🏹", phonetic: "/taɪm flaɪz laɪk ən ˈær.əʊ/" },
];

export const LEVELS: EchoLevel[] = [
  {
    id: 1,
    title: "Level 1: Everyday Items",
    subtitle: "Простые слова",
    description: "Start your vocal training! Listen closely to the sequence of simple single nouns, remember their order, and repeat them step by step.",
    pool: LEVEL_1_POOL,
    targetChainLength: 5,
    speechPitch: 1.0,
    speechRate: 0.85,
  },
  {
    id: 2,
    title: "Level 2: Dual Action Beats",
    subtitle: "Короткие фразы",
    description: "Altitudes rising! Now you need to memorize two-word combinations. Enunciate clearly and don't rush between words.",
    pool: LEVEL_2_POOL,
    targetChainLength: 5,
    speechPitch: 1.0,
    speechRate: 0.95,
  },
  {
    id: 3,
    title: "Level 3: Fluent Tongue Twisters",
    subtitle: "Идиомы и скороговорки",
    description: "The ultimate pronunciation mastery. Long phrases, tongue twisters, and popular idioms. Pitch, pace, and order must be absolute perfection!",
    pool: LEVEL_3_POOL,
    targetChainLength: 4,
    speechPitch: 1.05,
    speechRate: 1.0,
  },
];
