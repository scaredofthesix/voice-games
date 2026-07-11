/**
 * Shared game UI kit (Sprint 4 customer polish: one interface across games).
 *
 * Every game renders the same building blocks so a child moving between games
 * never has to re-learn the controls:
 *  - OptionPicker    - start-screen picker (theme, difficulty, ...) with an
 *                      optional preview area passed as children
 *  - WordSetPicker   - the standard word-set chooser (built-in categories +
 *                      "My Words")
 *  - PauseButton     - the full-width orange pause/resume toggle
 *  - TargetWordCard  - the Boss-Fight-style "SAY THIS / ПРОИЗНЕСИ" plaque with
 *                      the target word, translation and Listen (EN)/(RU)
 *
 * Voice Racer, Bubble Popper and AsteWord keep their in-scene word displays
 * (words on the track / bubbles / asteroids are the game mechanic); they still
 * reuse the pickers and pause control.
 */
import { useState, type ReactNode } from 'react';
import { ArrowLeft, Pause, Play, Volume2 } from 'lucide-react';

import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
import { useUiLanguage } from '../uiLanguage';
import { speakWord } from '../voice/engine';
import { CustomWordsManager } from './CustomWordsManager';

// ---------------------------------------------------------------------------
// Shared shell pieces
// ---------------------------------------------------------------------------

interface BackToHubButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
  id?: string;
}

export function BackToHubButton({ label, onClick, className = '', id }: BackToHubButtonProps) {
  const { t } = useUiLanguage();

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-label={t('shared.backToHubAria')}
      className={`mb-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-4 h-4 stroke-[3]" /> {label}
    </button>
  );
}

interface GameSetupCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  toneClass?: string;
  iconClass?: string;
  shadowClass?: string;
}

export function GameSetupCard({
  icon,
  title,
  description,
  children,
  toneClass = 'bg-indigo-50',
  iconClass = 'bg-indigo-400',
  shadowClass = 'bubble-shadow-purple',
}: GameSetupCardProps) {
  return (
    <div
      className={`space-y-4 p-6 border-8 border-slate-900 rounded-4xl ${toneClass} ${shadowClass}`}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className={`w-18 h-18 rounded-3xl border-4 border-slate-900 flex items-center justify-center ${iconClass}`}
        >
          {icon}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-slate-900">
          {title}
        </h1>
        <p className="text-xs font-bold text-slate-600 max-w-xs leading-relaxed">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

export interface GameHeaderStat {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'amber' | 'emerald' | 'sky' | 'violet';
}

interface GameHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  stats: GameHeaderStat[];
  action?: ReactNode;
}

const STAT_TONES: Record<NonNullable<GameHeaderStat['tone']>, string> = {
  amber: 'bg-amber-100',
  emerald: 'bg-emerald-100',
  sky: 'bg-sky-100',
  violet: 'bg-violet-100',
};

export function GameHeader({ icon, title, subtitle, stats, action }: GameHeaderProps) {
  return (
    <div className="rounded-4xl border-8 border-slate-900 bg-white p-4 sm:p-5 shadow-[8px_8px_0_0_rgba(15,23,42,1)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-2xl border-4 border-slate-900 bg-yellow-300 p-2.5 shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 leading-snug">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border-2 border-slate-900 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-900 ${STAT_TONES[stat.tone || 'amber']}`}
            >
              <span className="flex items-center gap-1">
                {stat.icon}
                <span>{stat.label}:</span>
                <span>{stat.value}</span>
              </span>
            </div>
          ))}
          {action}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OptionPicker
// ---------------------------------------------------------------------------

export interface PickerOption<Id extends string = string> {
  id: Id;
  label: string;
}

interface OptionPickerProps<Id extends string> {
  label: string;
  options: readonly PickerOption<Id>[];
  selected: Id;
  onSelect: (id: Id) => void;
  columns?: 2 | 3 | 4;
}

/**
 * Label + option grid only: games keep their own white card wrapper so a
 * game-specific preview can live inside the same card under the buttons.
 */
export function OptionPicker<Id extends string>({
  label,
  options,
  selected,
  onSelect,
  columns = 3,
}: OptionPickerProps<Id>) {
  const cols =
    columns === 2
      ? 'grid-cols-2'
      : columns === 4
        ? 'grid-cols-2 sm:grid-cols-4'
        : 'grid-cols-3';
  return (
    <div role="group" aria-label={label} className="space-y-2">
      <p className="block text-xs font-black text-rose-500 uppercase tracking-widest ml-1">
        {label}
      </p>
      <div className={`grid ${cols} gap-2`}>
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() => onSelect(option.id)}
            aria-pressed={selected === option.id}
            className={`px-2 py-2 border-4 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer text-center ${
              selected === option.id
                ? 'bg-rose-500 border-slate-900 text-white shadow-sm -translate-y-0.5'
                : 'bg-white border-slate-300 text-slate-700 hover:border-slate-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WordSetPicker
// ---------------------------------------------------------------------------

interface WordSetPickerProps {
  legend: string;
  myWordsLabel: string;
  activeCategoryId: string;
  customWords: WordData[];
  onSelect: (category: WordCategory) => void;
}

export function WordSetPicker({
  legend,
  myWordsLabel,
  activeCategoryId,
  customWords,
  onSelect,
}: WordSetPickerProps) {
  const { t } = useUiLanguage();

  return (
    <fieldset className="text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
      <legend className="text-xs font-black uppercase tracking-wider text-slate-700 px-1">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {BUILTIN_CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => onSelect(cat)}
            aria-pressed={activeCategoryId === cat.id}
            className={`px-3 py-1.5 rounded-xl border-4 text-xs font-black uppercase tracking-wide cursor-pointer ${
              activeCategoryId === cat.id
                ? 'bg-rose-400 border-slate-900 text-white'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
          >
            {t(`wordSets.${cat.id}`)}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            onSelect({
              id: 'custom',
              name: myWordsLabel,
              description: '',
              icon: 'edit',
              words: customWords,
            })
          }
          aria-pressed={activeCategoryId === 'custom'}
          className={`px-3 py-1.5 rounded-xl border-4 text-xs font-black uppercase tracking-wide cursor-pointer ${
            activeCategoryId === 'custom'
              ? 'bg-pink-400 border-slate-900 text-white'
              : 'bg-white border-slate-300 text-slate-600'
          }`}
        >
          {myWordsLabel} ({customWords.length})
        </button>
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Canonical setup sections (Voice Racer order: practice, then custom words)
// ---------------------------------------------------------------------------

type PracticeWord = Pick<WordData, 'word' | 'translation' | 'translationRu'>;

interface ListenAndLearnSectionProps {
  words: readonly PracticeWord[];
}

export function ListenAndLearnSection({ words }: ListenAndLearnSectionProps) {
  const { t } = useUiLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-1 text-left">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-4 border-slate-900 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer font-black text-xs text-slate-800"
      >
        <span className="flex items-center gap-2">
          {t('shared.listenAndLearnPractice')} ({words.length} {t('shared.wordsLabel')})
        </span>
        <span className="text-xs text-slate-800 bg-slate-100 border-2 border-slate-900 px-1.5 rounded-md">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="bg-white border-4 border-slate-900 rounded-2xl p-3">
          {words.length === 0 ? (
            <div className="text-center py-4 bg-amber-50 rounded-xl border-2 border-dashed border-amber-300">
              <p className="text-xs text-amber-800 font-black">{t('shared.emptyCustomList')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {words.map((item, index) => (
                <div
                  key={`${item.word}-${index}`}
                  className="bg-yellow-50 border-2 border-slate-900 text-left p-2 rounded-xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <button
                      type="button"
                      onClick={() => speakWord(item.word)}
                      className="text-slate-900 font-extrabold text-xs flex items-center gap-1 cursor-pointer hover:text-purple-600 truncate flex-1"
                      aria-label={`${t('shared.hearWord')} ${item.word}`}
                    >
                      <span className="truncate">{item.word}</span>
                      <Volume2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    </button>
                    {item.translationRu && (
                      <button
                        type="button"
                        onClick={() => item.translationRu && speakWord(item.translationRu, 'ru')}
                        className="text-blue-600 hover:text-blue-800 text-[10px] font-black uppercase flex items-center gap-0.5 cursor-pointer shrink-0"
                        aria-label={t('shared.listenInRussian')}
                      >
                        <Volume2 className="w-3.5 h-3.5 shrink-0" /> RU
                      </button>
                    )}
                  </div>
                  {(item.translationRu || item.translation) && (
                    <span className="text-[10px] text-purple-700 font-bold truncate mt-0.5">
                      {item.translationRu || item.translation}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CustomWordsSectionProps {
  customWords: WordData[];
  onAddWord: (word: string, translation: string) => void;
  onDeleteWord: (index: number) => void;
  onClearAll: () => void;
}

export function CustomWordsSection({
  customWords,
  onAddWord,
  onDeleteWord,
  onClearAll,
}: CustomWordsSectionProps) {
  const { t } = useUiLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-1 text-left">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-4 border-slate-900 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer font-black text-xs text-slate-800"
      >
        <span className="flex items-center gap-2">
          {t('shared.addMyOwnWords')} ({customWords.length})
        </span>
        <span className="text-xs text-slate-800 bg-slate-100 border-2 border-slate-900 px-1.5 rounded-md">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="bg-white border-4 border-slate-900 rounded-2xl p-4">
          <CustomWordsManager
            customWords={customWords}
            onAddWord={onAddWord}
            onDeleteWord={onDeleteWord}
            onClearAll={onClearAll}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PauseButton
// ---------------------------------------------------------------------------

interface PauseButtonProps {
  paused: boolean;
  onToggle: () => void;
  pauseLabel?: string;
  resumeLabel?: string;
  ariaPause?: string;
  ariaResume?: string;
}

export function PauseButton({
  paused,
  onToggle,
  pauseLabel = 'Pause',
  resumeLabel = 'Resume',
  ariaPause = 'Pause the game',
  ariaResume = 'Resume the game',
}: PauseButtonProps) {
  const { t } = useUiLanguage();
  const resolvedPauseLabel = pauseLabel === 'Pause' ? t('shared.pause') : pauseLabel;
  const resolvedResumeLabel = resumeLabel === 'Resume' ? t('shared.resume') : resumeLabel;
  const resolvedAriaPause = ariaPause === 'Pause the game' ? t('shared.pauseGame') : ariaPause;
  const resolvedAriaResume = ariaResume === 'Resume the game' ? t('shared.resumeGame') : ariaResume;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={paused}
      aria-label={paused ? resolvedAriaResume : resolvedAriaPause}
      className={`w-full py-3 border-4 border-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer ${
        paused
          ? 'bg-orange-400 hover:bg-orange-500 text-slate-900'
          : 'bg-orange-500 hover:bg-orange-600 text-white'
      }`}
    >
      {paused ? (
        <>
          <Play className="w-5 h-5 fill-current stroke-[3]" /> {resolvedResumeLabel}
        </>
      ) : (
        <>
          <Pause className="w-5 h-5 fill-current stroke-[3]" /> {resolvedPauseLabel}
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TargetWordCard - the Boss-Fight plaque, now shared by every game that shows
// a single target word outside the canvas.
// ---------------------------------------------------------------------------

interface TargetWordCardProps {
  /** Ribbon text on top of the card, e.g. "🎯 SAY THIS / ПРОИЗНЕСИ:". */
  ribbon: string;
  word: string;
  /** Translation shown under the word (usually Russian). */
  translation?: string;
  /** When set together with onListenRu, renders the "Слушать (RU)" button. */
  translationRu?: string;
  /** Plays the English word; callers usually also record a struggle. */
  onListenEn: () => void;
  onListenRu?: () => void;
  /** Last recognized transcript to echo back to the child. */
  heard?: string;
  heardLabel?: string;
}

export function TargetWordCard({
  ribbon,
  word,
  translation,
  translationRu,
  onListenEn,
  onListenRu,
  heard,
  heardLabel,
}: TargetWordCardProps) {
  const { t } = useUiLanguage();

  return (
    <div className="relative bg-amber-50 border-4 border-slate-900 rounded-2xl p-5 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] animate-pulse-subtle">
      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-500 border-2 border-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
        {ribbon}
      </span>

      <p
        className={`${
          word.length > 25
            ? 'text-lg md:text-xl'
            : word.length > 15
              ? 'text-2xl'
              : 'text-3.5xl'
        } font-black tracking-wide text-slate-900 leading-snug mt-1`}
        data-testid="target-word"
        aria-live="assertive"
      >
        {word}
      </p>

      <div className="mt-2.5 space-y-2">
        {translation && (
          <p className="text-xs md:text-sm font-extrabold text-purple-600">
            {translation}
          </p>
        )}

        {heard && (
          <div className="inline-flex flex-col items-center justify-center bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-1.5 max-w-full">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">
              {heardLabel || t('shared.youSaidHeard')}
            </span>
            <span className="text-sm font-black text-indigo-700 italic font-mono truncate max-w-xs">
              "{heard}"
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2.5 border-t-2 border-dashed border-slate-200">
          <button
            type="button"
            onClick={onListenEn}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white border-2 border-slate-900 px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform active:translate-y-0.5 cursor-pointer"
            aria-label={`${t('shared.hearWord')} ${word}`}
          >
            <Volume2 className="w-3.5 h-3.5 stroke-[3] text-indigo-500" /> {t('shared.listenEnglish')}
          </button>
          {translationRu && onListenRu && (
            <button
              type="button"
              onClick={onListenRu}
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 bg-white border-2 border-slate-900 px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform active:translate-y-0.5 cursor-pointer"
              aria-label={t('shared.listenInRussian')}
            >
              <Volume2 className="w-3.5 h-3.5 stroke-[3] text-blue-500" /> {t('shared.listenRussian')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
