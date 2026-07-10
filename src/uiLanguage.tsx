import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type UiLanguage = 'en' | 'ru';

interface UiLanguageContextValue {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  t: (path: string) => string;
}

interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

const STORAGE_KEY = 'ui_language';

const UI_TEXT: Record<UiLanguage, TranslationDictionary> = {
  en: {
    header: {
      title: 'VOICE GAMES',
      subtitle: '⭐ KIDS LEARNING HUB',
      totalRecord: 'TOTAL RECORD:',
      backToHub: 'HUB',
      score: 'SCORE:',
      best: 'BEST:',
      total: 'TOTAL:',
      level: 'Level',
      switchLabel: 'Switch interface language to Russian',
      switchToRussian: 'RU',
      switchToEnglish: 'EN',
    },
    hub: {
      title: 'VOICE GAMES!',
      subtitle: 'Play English games with your voice! Match words, pop balloons, and win trophies!',
      playBadge: 'PLAY',
      lockedBadge: 'TEMPLATE',
      record: 'RECORD:',
      playButton: 'PLAY',
    },
    games: {
      voiceRacer: {
        title: 'VOICE LANE RACER',
        description: 'Pronounce words right to avoid car crashing! Correct pronunciation swerves your car to dodge roadblocks.',
      },
      bubblePopper: {
        title: 'VOICE BUBBLE POPPER',
        description: 'Pronounce words on translucent floating bubbles to pop them before they cross the red danger zone!',
      },
      bossFight: {
        title: 'BOSS FIGHT',
        description: 'Say each English word to strike the boss! Beat one boss and a tougher one appears - survive as long as you can, and watch the timer on every word.',
      },
      wordLadder: {
        title: 'VOICE ROCKET CLIMB',
        description: 'Pronounce words correctly to launch your rocket higher and higher! Reach orbit to win!',
        winTitle: 'Orbit reached! 🚀',
        winDescription: 'You boosted your rocket through all {total} stages into deep space!',
        sayToLaunch: 'Say this word to boost',
        again: 'Again',
      },
      treasureHunter: {
        title: 'VOICE TREASURE HUNTER',
        description: 'Guide the submarine and collect treasure chests from the ocean depths by pronouncing words correctly!',
      },
      sentenceBird: {
        title: 'Sentence Bird',
        description: 'Speak sentence steps aloud to guide the bird through the clouds and grow your pronunciation confidence.',
      },
      echoRecorder: {
        title: 'Echo Microphone',
        description: 'Listen to word sequences and repeat them back to grow the chain and train your pronunciation memory!',
      },
    },
    shared: {
      chooseWordSet: 'Choose a word set',
      listenAndLearn: 'Listen and learn',
      myWords: 'My Words',
      customWords: 'Custom Words List',
      start: 'Start',
      startFight: 'Start Fight',
      startClimb: 'Start Launch',
      startPopping: 'START POPPING!',
      backToHub: 'Hub',
      learnAndPractice: 'Learn and practice',
      customWordsBuilder: 'Custom words builder',
      emptyCustomList: 'Your custom dictionary list is currently empty!',
      emptyCustomListBubble: 'Your custom list is currently empty!',
      startHighwayRace: 'START HIGHWAY RACE!',
      chooseRoadEnvironment: 'CHOOSE ROAD ENVIRONMENT:',
      taskBook: 'TASK BOOK:',
      listenAndLearnPractice: 'LISTEN & LEARN PRACTICE',
      wordsLabel: 'words',
      customListEmpty: 'No words registered yet. Tap start to play again.',
      chooseMissionTheme: 'CHOOSE MISSION THEME:',
      chooseArenaTheme: 'CHOOSE ARENA THEME:',
    },
    themes: {
      racer: {
        forest: '🌲 Forest Land',
        night: '🌌 Cosmic Night',
        desert: '🏜️ Golden Desert',
        city: '🏎️ Neon City',
      },
      ladder: {
        earth: '🌍 Earth Orbit',
        mars: '🔴 Flight to Mars',
        nebula: '🌌 Alien Nebula',
      },
      bubble: {
        sky: '☁️ Drifting Clouds',
        snow: '❄️ Snowy Wilderness',
        starry: '🌙 Moonlit Sparkles',
        nebula: '🌌 Cosmic Galaxies',
      },
      boss: {
        castle: '🏰 Castle Ruins',
        lava: '🌋 Lava Dungeon',
        forest: '🌲 Magic Forest',
        abyss: '🌌 Void Abyss',
      },
    },
    bubble: {
      gameSelected: 'Game Selected',
      title: 'Voice Bubble Popper',
      hubPortal: 'Hub Portal',
      chooseSkyAtmosphere: 'CHOOSE SKY ATMOSPHERE THEME:',
      wordListTopic: 'WORD LIST TOPIC:',
      listenAndPractice: 'LISTEN & PRACTICE',
      customWordsBuilder: 'CUSTOM WORDS BUILDER',
      gameOverTitle: 'SUPER BUBBLES POPPING!',
      gameOverSubtitle: 'Speech bubble pop-out concluded! Review your English scoring below:',
      poppingScore: 'POPPING SCORE',
      personalHigh: 'PERSONAL HIGH',
      scoreCard: 'Your Spelling Scorecard:',
      playAgain: 'Popping Again!',
      bubbleOptions: 'Bubble Options',
      exitToPortal: 'EXIT TO GAMES PORTAL',
      wordsHeard: 'Words Heard:',
      sayAnyWord: 'Say any word written on the bubbles!',
      words: 'WORDS:',
      quit: 'QUIT',
      points: 'PTS:',
      clueLabel: 'Clues:',
      poppedLabel: 'Popped:',
      listenInRussian: 'Listen in Russian',
      hearWord: 'Hear the word',
    },
  },
  ru: {
    header: {
      title: 'ГОЛОСОВЫЕ ИГРЫ',
      subtitle: '⭐ ЦЕНТР ИГР ДЛЯ ДЕТЕЙ',
      totalRecord: 'СУММА РЕКОРДОВ:',
      backToHub: 'ХАБ',
      score: 'СЧЁТ:',
      best: 'РЕКОРД:',
      total: 'ВСЕГО:',
      level: 'Уровень',
      switchLabel: 'Switch interface language to English',
      switchToRussian: 'RU',
      switchToEnglish: 'EN',
    },
    hub: {
      title: 'ГОЛОСОВЫЕ ИГРЫ!',
      subtitle: 'Играй в английские игры голосом! Подбирай слова, лопай шарики и побеждай!',
      playBadge: 'ИГРАТЬ',
      lockedBadge: 'ШАБЛОН',
      record: 'РЕКОРД:',
      playButton: 'ИГРАТЬ',
    },
    games: {
      voiceRacer: {
        title: 'ГОЛОСОВАЯ ГОНКА',
        description: 'Произноси слова правильно, чтобы не влететь в аварии! Верное произношение помогает уйти от препятствий.',
      },
      bubblePopper: {
        title: 'ЛОПАНИЕ ПУЗЫРЕЙ',
        description: 'Произноси слова на прозрачных пузырях, чтобы успеть их лопнуть до красной зоны опасности!',
      },
      bossFight: {
        title: 'БОЙ С БОССОМ',
        description: 'Произноси каждое английское слово, чтобы бить босса! Победишь одного - приходит посильнее. Держись как можно дольше и следи за таймером.',
      },
      wordLadder: {
        title: 'КОСМИЧЕСКИЙ СТАРТ',
        description: 'Произноси слова правильно, чтобы запустить ракету в космос! Доберись до орбиты для победы!',
        winTitle: 'Орбита достигнута! 🚀',
        winDescription: 'Ты успешно вывел ракету на все {total} ступеней в открытый космос!',
        sayToLaunch: 'Произнеси слово для запуска',
        again: 'Заново',
      },
      treasureHunter: {
        title: 'ПОИСК СОКРОВИЩ',
        description: 'Управляй подводной лодкой и собирай сундуки с сокровищами на глубине океана, правильно произнося слова!',
      },
      sentenceBird: {
        title: 'Фразоптичка',
        description: 'Произноси части предложений вслух, чтобы вести птичку по облакам и тренировать произношение.',
      },
      echoRecorder: {
        title: 'Эхо-микрофон',
        description: 'Слушай последовательности слов и повторяй их, чтобы удлинить цепочку и тренировать память произношения!',
      },
    },
    shared: {
      chooseWordSet: 'Выбери набор слов',
      listenAndLearn: 'Слушай и учись',
      myWords: 'Мои слова',
      customWords: 'Список своих слов',
      start: 'Старт',
      startFight: 'Начать бой',
      startClimb: 'Начать запуск',
      startPopping: 'НАЧАТЬ ЛОПАТЬ!',
      backToHub: 'Хаб',
      learnAndPractice: 'Учись и практикуйся',
      customWordsBuilder: 'Конструктор слов',
      emptyCustomList: 'Список твоих слов пока пуст!',
      emptyCustomListBubble: 'Твой список слов пока пуст!',
      startHighwayRace: 'НАЧАТЬ ГОНКУ!',
      chooseRoadEnvironment: 'ВЫБЕРИ ТЕМУ ДОРОГИ:',
      taskBook: 'КНИЖКА ЗАДАНИЙ:',
      listenAndLearnPractice: 'СЛУШАЙ И УЧИСЬ',
      wordsLabel: 'слов',
      customListEmpty: 'Слов ещё нет. Нажми старт, чтобы сыграть снова.',
      chooseMissionTheme: 'ВЫБЕРИ ТЕМУ МИССИИ:',
      chooseArenaTheme: 'ВЫБЕРИ ТЕМУ АРЕНЫ:',
    },
    themes: {
      racer: {
        forest: '🌲 Лесная Трасса',
        night: '🌌 Космическая Ночь',
        desert: '🏜️ Золотая Пустыня',
        city: '🏎️ Неоновый Город',
      },
      ladder: {
        earth: '🌍 Орбита Земли',
        mars: '🔴 Полет на Марс',
        nebula: '🌌 Чужая Туманность',
      },
      bubble: {
        sky: '☁️ Плывущие облака',
        snow: '❄️ Снежная пустыня',
        starry: '🌙 Лунные искры',
        nebula: '🌌 Космические галактики',
      },
      boss: {
        castle: '🏰 Руины Замка',
        lava: '🌋 Лавовое Подземелье',
        forest: '🌲 Волшебный Лес',
        abyss: '🌌 Бездна Пустоты',
      },
    },
    bubble: {
      gameSelected: 'Выбрана игра',
      title: 'Лопание пузырей',
      hubPortal: 'Портал хаба',
      chooseSkyAtmosphere: 'ВЫБЕРИ ТЕМУ НЕБА:',
      wordListTopic: 'ТЕМА СПИСКА СЛОВ:',
      listenAndPractice: 'СЛУШАЙ И ПРАКТИКУЙСЯ',
      customWordsBuilder: 'КОНСТРУКТОР СВОИХ СЛОВ',
      gameOverTitle: 'СУПЕР ЛОПАНИЕ ПУЗЫРЕЙ!',
      gameOverSubtitle: 'Пузырьковая гонка закончилась! Посмотри на результат ниже:',
      poppingScore: 'ОЧКИ ЗА ЛОПАНИЕ',
      personalHigh: 'ЛИЧНЫЙ РЕКОРД',
      scoreCard: 'Твоя таблица слов:',
      playAgain: 'Снова лопать!',
      bubbleOptions: 'Настройки пузырей',
      exitToPortal: 'ВЫЙТИ В ХАБ',
      wordsHeard: 'Услышанные слова:',
      sayAnyWord: 'Произнеси любое слово на пузырях!',
      words: 'СЛОВА:',
      quit: 'ВЫЙТИ',
      points: 'ОЧКИ:',
      clueLabel: 'Подсказки:',
      poppedLabel: 'Лопнуло:',
      listenInRussian: 'Слушать по-русски',
      hearWord: 'Услышь слово',
    },
  },
};

const UiLanguageContext = createContext<UiLanguageContextValue | undefined>(undefined);

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>(() => {
    if (typeof window === 'undefined') {
      return 'ru';
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved === 'en' ? 'en' : 'ru';
    } catch {
      return 'ru';
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage access errors in restricted environments.
    }
  }, [language]);

  const value = useMemo<UiLanguageContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (path: string) => {
      const keys = path.split('.');
      let current: unknown = UI_TEXT[language];

      for (const key of keys) {
        if (typeof current !== 'object' || current === null || !(key in current)) {
          return path;
        }
        current = (current as Record<string, unknown>)[key];
      }

      return typeof current === 'string' ? current : path;
    },
  }), [language]);

  return <UiLanguageContext.Provider value={value}>{children}</UiLanguageContext.Provider>;
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext);

  if (context) {
    return context;
  }

  return {
    language: 'ru' as UiLanguage,
    setLanguage: () => undefined,
    t: (path: string) => {
      const keys = path.split('.');
      let current: unknown = UI_TEXT.ru;

      for (const key of keys) {
        if (typeof current !== 'object' || current === null || !(key in current)) {
          return path;
        }
        current = (current as Record<string, unknown>)[key];
      }

      return typeof current === 'string' ? current : path;
    },
  };
}
