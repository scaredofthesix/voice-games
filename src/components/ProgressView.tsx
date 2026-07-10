import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Download, Trash2 } from 'lucide-react';

import { useUiLanguage } from '../uiLanguage';
import { BackToHubButton } from './GameUi';
import {
  ALL_GAME_IDS,
  AllGamesProgress,
  GAME_LABELS,
  GameId,
  clearProgress,
  downloadProgressCsv,
  loadProgress,
} from '../progress';

interface ProgressViewProps {
  onBackToHub: () => void;
}

export function ProgressView({ onBackToHub }: ProgressViewProps) {
  const { language, t } = useUiLanguage();
  const [progress, setProgress] = useState<AllGamesProgress>(loadProgress);
  const [confirmClear, setConfirmClear] = useState(false);

  // Reload when the component mounts (in case other games saved in between).
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const handleClear = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setProgress(clearProgress());
    setConfirmClear(false);
  }, [confirmClear]);

  const handleExport = useCallback(() => {
    downloadProgressCsv(progress);
  }, [progress]);

  const totalSessions = ALL_GAME_IDS.reduce(
    (sum, id) => sum + progress[id].sessionsPlayed,
    0,
  );
  const totalHighScoreSum = ALL_GAME_IDS.reduce(
    (sum, id) => sum + progress[id].highScore,
    0,
  );

  // Collect all unique words across all games with aggregate stats.
  const allWords = new Map<string, { spoken: number; struggled: number }>();
  for (const id of ALL_GAME_IDS) {
    for (const [word, stats] of Object.entries(progress[id].words) as [string, { spoken: number; struggled: number }][]) {
      const existing = allWords.get(word) || { spoken: 0, struggled: 0 };
      allWords.set(word, {
        spoken: existing.spoken + stats.spoken,
        struggled: existing.struggled + stats.struggled,
      });
    }
  }

  return (
    <section className="max-w-md mx-auto py-4 px-2" aria-label="Progress view">
      <BackToHubButton label={t('shared.backToHub')} onClick={onBackToHub} />

      <div className="space-y-4 p-6 border-8 border-slate-900 rounded-4xl bg-gradient-to-b from-purple-50 to-indigo-50 bubble-shadow-purple">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-500 border-4 border-slate-900 flex items-center justify-center">
            <BarChart3 className="w-9 h-9 text-white stroke-[3]" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900">
            {language === 'ru' ? 'Мой Прогресс' : 'My Progress'}
          </h1>
          <p className="text-xs font-bold text-slate-600 max-w-xs leading-relaxed">
            {language === 'ru'
              ? 'Здесь ты видишь свои успехи по всем играм!'
              : 'Track your achievements across all games!'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sky-100 border-4 border-slate-900 p-3 rounded-2xl flex flex-col items-center shadow-md">
            <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest text-center">
              {language === 'ru' ? 'Сессий Сыграно' : 'Sessions Played'}
            </span>
            <span className="text-2xl font-black text-sky-900 mt-1 font-mono">
              {totalSessions}
            </span>
          </div>
          <div className="bg-amber-100 border-4 border-slate-900 p-3 rounded-2xl flex flex-col items-center shadow-md">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">
              {language === 'ru' ? 'Сумма Рекордов' : 'Total High Scores'}
            </span>
            <span className="text-2xl font-black text-amber-800 mt-1 font-mono">
              {totalHighScoreSum}
            </span>
          </div>
          <div className="bg-emerald-100 border-4 border-slate-900 p-3 rounded-2xl flex flex-col items-center shadow-md">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center">
              {language === 'ru' ? 'Слов Изучено' : 'Words Practiced'}
            </span>
            <span className="text-2xl font-black text-emerald-900 mt-1 font-mono">
              {allWords.size}
            </span>
          </div>
          <div className="bg-rose-100 border-4 border-slate-900 p-3 rounded-2xl flex flex-col items-center shadow-md">
            <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest text-center">
              {language === 'ru' ? 'Всего Произнесено' : 'Total Spoken'}
            </span>
            <span className="text-2xl font-black text-rose-900 mt-1 font-mono">
              {Array.from(allWords.values()).reduce((s, w) => s + w.spoken, 0)}
            </span>
          </div>
        </div>

        {/* Per-game breakdown */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-black uppercase tracking-widest text-purple-800 ml-1">
            {language === 'ru' ? 'По Играм:' : 'Per Game:'}
          </h2>
          {ALL_GAME_IDS.map((id: GameId) => {
            const g = progress[id];
            const label = GAME_LABELS[id];
            const wordCount = Object.keys(g.words).length;
            return (
              <div
                key={id}
                className="bg-white border-4 border-slate-900 rounded-2xl p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{label.icon}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {language === 'ru' ? label.ru : label.en}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold block">
                      {g.sessionsPlayed}{' '}
                      {language === 'ru' ? 'сесс.' : 'sess.'} · {wordCount}{' '}
                      {language === 'ru' ? 'сл.' : 'words'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] text-amber-800 bg-amber-100 px-2 py-1 rounded-full font-black border border-amber-300">
                    {language === 'ru' ? 'Рекорд:' : 'Best:'} {g.highScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Words */}
        {allWords.size > 0 && (
          <div className="bg-purple-100 border-4 border-slate-900 p-4 rounded-3xl text-left">
            <h3 className="text-xs font-black text-purple-900 uppercase tracking-widest mb-2">
              {language === 'ru'
                ? 'Топ Практикуемых Слов:'
                : 'Top Practiced Words:'}
            </h3>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {Array.from(allWords.entries())
                .sort((a, b) => b[1].spoken + b[1].struggled - (a[1].spoken + a[1].struggled))
                .slice(0, 20)
                .map(([word, stats]) => (
                  <div
                    key={word}
                    className="bg-white border-2 border-slate-900 p-2 rounded-xl flex items-center justify-between"
                  >
                    <span className="text-slate-950 font-black text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-900">
                      {word}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-emerald-800 bg-emerald-100 px-1.5 py-1 rounded-full font-black border border-emerald-300">
                        {language === 'ru' ? 'Произнесено:' : 'Spoken:'}{' '}
                        {stats.spoken}
                      </span>
                      {stats.struggled > 0 && (
                        <span className="text-[9px] text-amber-800 bg-amber-100 px-1.5 py-1 rounded-full font-black border border-amber-300">
                          {language === 'ru' ? 'Подсказок:' : 'Clues:'}{' '}
                          {stats.struggled}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-1.5 text-xs"
          >
            <Download className="w-4 h-4 stroke-[3]" />{' '}
            {language === 'ru' ? 'Экспорт CSV' : 'Export CSV'}
          </button>
          <button
            onClick={handleClear}
            className={`flex-1 py-2.5 border-4 border-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-1.5 text-xs ${
              confirmClear
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <Trash2 className="w-4 h-4 stroke-[3]" />{' '}
            {confirmClear
              ? language === 'ru'
                ? 'Точно удалить?'
                : 'Are you sure?'
              : language === 'ru'
                ? 'Очистить'
                : 'Clear All'}
          </button>
        </div>
      </div>
    </section>
  );
}
