import type { SentenceItem } from './types';

export const presetCategories = [
  "🦁 Pets & Animals",
  "🌤 Nature & Sky",
  "🏃 Fun Actions",
  "🍉 Daily Food",
  "🏡 Home & School"
];

export const defaultSentenceItems: SentenceItem[] = [
  // Animals category
  {
    id: "a1",
    steps: ["Cat", "The cat", "The cat sleeps", "The cat sleeps on the soft mat"],
    translation: "Кошка спит на мягком коврике",
    category: "🦁 Pets & Animals"
  },
  {
    id: "a2",
    steps: ["Bird", "Little bird", "Little bird flies", "Little bird flies high in the green trees"],
    translation: "Маленькая птичка летает высоко на зеленых деревьях",
    category: "🦁 Pets & Animals"
  },
  {
    id: "a3",
    steps: ["Rabbit", "A white rabbit", "A white rabbit eats", "A white rabbit eats a sweet carrot in the field"],
    translation: "Белый кролик ест сладкую морковку в поле",
    category: "🦁 Pets & Animals"
  },
  {
    id: "a4",
    steps: ["Puppy", "My puppy", "My puppy barks", "My puppy barks happily when we run"],
    translation: "Мой щенок радостно лает, когда мы бегаем",
    category: "🦁 Pets & Animals"
  },

  // Nature and sky category
  {
    id: "n1",
    steps: ["Sun", "The sun is", "The sun is shining", "The sun is shining bright in the blue sky"],
    translation: "Солнце ярко светит в голубом небе",
    category: "🌤 Nature & Sky"
  },
  {
    id: "n2",
    steps: ["Rain", "Cold rain", "Cold rain falls", "Cold rain falls down on the green grass"],
    translation: "Холодный дождь падает вниз на зеленую траву",
    category: "🌤 Nature & Sky"
  },
  {
    id: "n3",
    steps: ["Rainbow", "A big rainbow", "A big rainbow appears", "A big rainbow appears in the clouds after rain"],
    translation: "Большая радуга появляется в облаках после дождя",
    category: "🌤 Nature & Sky"
  },
  {
    id: "n4",
    steps: ["Stars", "Yellow stars", "Yellow stars sparkle", "Yellow stars sparkle in the quiet evening sky"],
    translation: "Желтые звезды сверкают в тихом вечернем небе",
    category: "🌤 Nature & Sky"
  },

  // Daily Habits/Actions category
  {
    id: "j1",
    steps: ["I jump", "I jump high", "I jump high on the grass", "I jump high on the grass with my best friends"],
    translation: "Я высоко прыгаю на траве со своими лучшими друзьями",
    category: "🏃 Fun Actions"
  },
  {
    id: "j2",
    steps: ["I cycle", "I cycle fast", "I cycle fast down the street", "I cycle fast down the street on my new red bike"],
    translation: "Я быстро еду по улице на моем новом красном велосипеде",
    category: "🏃 Fun Actions"
  },
  {
    id: "j3",
    steps: ["We dance", "We dance together", "We dance together to the music", "We dance together to the music in our big living room"],
    translation: "Мы танцуем вместе под музыку в нашей большой гостиной",
    category: "🏃 Fun Actions"
  },

  // Food category
  {
    id: "f1",
    steps: ["Apple", "Red apple", "Sweet red apple", "I love to eat a sweet red apple for breakfast"],
    translation: "Я обожаю есть сладкое красное яблоко на завтрак",
    category: "🍉 Daily Food"
  },
  {
    id: "f2",
    steps: ["Milk", "Warm milk", "I drink milk", "I drink fresh warm milk with cookies before bedtime"],
    translation: "Я пью свежее теплое молоко с печеньем перед сном",
    category: "🍉 Daily Food"
  },
  {
    id: "f3",
    steps: ["Pizza", "Hot pizza", "Hot pizza smells good", "This hot cheese pizza smells absolutely delicious near our table"],
    translation: "Эта горячая сырная пицца пахнет абсолютно восхитительно около нашего стола",
    category: "🍉 Daily Food"
  },

  // Home & friends category
  {
    id: "h1",
    steps: ["My room", "In my bedroom", "In my cozy bedroom", "There is a big dinosaur toy in my cozy bedroom"],
    translation: "В моей уютной спальне есть большая игрушка-динозавр",
    category: "🏡 Home & School"
  },
  {
    id: "h2",
    steps: ["Friend", "My best friend", "My best friend helps me", "My best friend helps me read funny English stories"],
    translation: "Мой лучший друг помогает мне читать смешные английские истории",
    category: "🏡 Home & School"
  }
];

export const sceneDefinitions = [
  {
    id: 'forest' as const,
    name: "🌳 Sunny Forest (Level 1)",
    themeColor: "from-amber-100 to-emerald-100",
    bgClass: "bg-[#bbf7d0]", // vibrant emerald green sky style
    accentClass: "text-slate-900 bg-emerald-400 border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]",
    cloudClass: "bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] text-slate-900",
    groundClass: "bg-emerald-600 border-t-4 border-slate-900",
    ambientSoundEmoji: "🌲🦜🌻",
    particleEmoji: "🍂"
  },
  {
    id: 'winter' as const,
    name: "❄️ Winter Wonderland (Level 2)",
    themeColor: "from-blue-100 to-indigo-100",
    bgClass: "bg-[#bfdbfe]", // cool sky blue
    accentClass: "text-slate-950 bg-blue-400 border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]",
    cloudClass: "bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] text-slate-900",
    groundClass: "bg-slate-200 border-t-4 border-slate-900",
    ambientSoundEmoji: "⛷️❄️⛄️",
    particleEmoji: "❄️"
  },
  {
    id: 'space' as const,
    name: "🚀 Cosmic Adventure (Level 3)",
    themeColor: "from-purple-950 to-indigo-950",
    bgClass: "bg-[#1e1b4b]", // midnight deep indigo dark-mode sky
    accentClass: "text-white bg-violet-600 border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(255,255,255,1)]",
    cloudClass: "bg-slate-900 border-2 border-indigo-400 shadow-[4px_4px_0_0_rgba(129,140,248,1)] text-white",
    groundClass: "bg-slate-950 border-t-4 border-indigo-400",
    ambientSoundEmoji: "👽🌠🛸",
    particleEmoji: "✨"
  },
  {
    id: 'ninja' as const,
    name: "🥷 Sunset Ninja (Level 4)",
    themeColor: "from-rose-950 to-orange-950",
    bgClass: "bg-[#7c2d12]", // warm sunset amber
    accentClass: "text-slate-950 bg-amber-400 border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]",
    cloudClass: "bg-stone-900 border-2 border-amber-400 shadow-[4px_4px_0_0_rgba(245,158,11,1)] text-amber-50",
    groundClass: "bg-stone-900 border-t-4 border-amber-400",
    ambientSoundEmoji: "🗡️🌸⛩️",
    particleEmoji: "🌸"
  }
];
