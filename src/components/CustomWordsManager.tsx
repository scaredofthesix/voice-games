import React, { useState } from 'react';
import { WordData } from '../types';
import { speakWord } from '../voice/engine';
import { Plus, Trash2, Volume2, AlertCircle, ListPlus } from 'lucide-react';
import { useUiLanguage } from '../uiLanguage';

const WORD_PATTERN = /^[a-zA-Z0-9\s\-\?\!\,\.\'\"’]+$/;
interface WordPairParseResult {
  pairs: { word: string; translation: string }[];
  skipped: number;
}

function isHeaderRow(row: string[]): boolean {
  const first = (row[0] || '').trim().toLocaleLowerCase();
  const second = (row[1] || '').trim().toLocaleLowerCase();
  return ['word', 'words', 'english', 'слово', 'слова'].includes(first)
    && ['translation', 'translations', 'russian', 'перевод', 'переводы'].includes(second);
}

/**
 * Parse text copied from two spreadsheet columns. A tab is the only separator:
 * spaces inside multi-word phrases remain part of the word, and ambiguous
 * comma/semicolon/space formats are rejected instead of being guessed.
 */
export function parseWordPairs(raw: string): WordPairParseResult {
  const pairs: { word: string; translation: string }[] = [];
  let skipped = 0;
  const rows = raw
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split('\t'));
  const dataRows = rows.slice(isHeaderRow(rows[0] || []) ? 1 : 0);

  for (const row of dataRows) {
    const word = (row[0] || '').trim();
    const translation = (row[1] || '').trim();
    if (row.length !== 2 || !word || !translation || !WORD_PATTERN.test(word)) {
      skipped++;
      continue;
    }

    pairs.push({ word, translation });
  }

  return { pairs, skipped };
}

interface CustomWordsManagerProps {
  customWords: WordData[];
  onAddWord: (word: string, translation: string) => void;
  onDeleteWord: (index: number) => void;
  onClearAll: () => void;
}

export const CustomWordsManager: React.FC<CustomWordsManagerProps> = ({
  customWords,
  onAddWord,
  onDeleteWord,
  onClearAll,
}) => {
  const { t } = useUiLanguage();
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [error, setError] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [pasteText, setPasteText] = useState('');

  /** Import parsed pairs and report how many rows landed. Returns false if nothing was valid. */
  const importPairs = (raw: string): boolean => {
    const parsed = parseWordPairs(raw);
    const seen = new Set(customWords.map((item) => item.word.trim().toLocaleLowerCase()));
    const accepted = parsed.pairs.filter((pair) => {
      const key = pair.word.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const skipped = parsed.skipped + (parsed.pairs.length - accepted.length);
    if (accepted.length === 0) {
      setBulkFeedback(t('customWords.bulkEmpty'));
      return false;
    }

    for (const pair of accepted) {
      onAddWord(pair.word, pair.translation);
    }
    setBulkFeedback(
      t('customWords.bulkResult')
        .replace('{added}', String(accepted.length))
        .replace('{skipped}', String(skipped)),
    );
    return true;
  };

  const handlePasteImport = () => {
    if (importPairs(pasteText)) setPasteText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedWord = newWord.trim();
    const trimmedTranslation = newTranslation.trim();

    if (!trimmedWord) {
      setError(t('customWords.englishRequired'));
      return;
    }

    if (!trimmedTranslation) {
      setError(t('customWords.translationRequired'));
      return;
    }

    if (!WORD_PATTERN.test(trimmedWord)) {
      setError(t('customWords.invalidCharacters'));
      return;
    }

    onAddWord(trimmedWord, trimmedTranslation);
    setNewWord('');
    setNewTranslation('');
    
    speakWord(trimmedWord);
  };

  return (
    <div className="space-y-5" id="custom-words-setup">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-rose-500 uppercase tracking-widest mb-1.5 ml-1">
              {t('customWords.englishLabel')}
            </label>
            <input
              type="text"
              placeholder={t('customWords.englishPlaceholder')}
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="w-full bg-white border-4 border-slate-900 text-slate-800 text-xs px-4 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 placeholder:text-slate-400 transition-all font-bold"
              id="input-custom-english-word"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-rose-500 uppercase tracking-widest mb-1.5 ml-1">
              {t('customWords.translationLabel')}
            </label>
            <input
              type="text"
              placeholder={t('customWords.translationPlaceholder')}
              value={newTranslation}
              onChange={(e) => setNewTranslation(e.target.value)}
              className="w-full bg-white border-4 border-slate-900 text-slate-800 text-xs px-4 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 placeholder:text-slate-400 transition-all font-bold"
              id="input-custom-russian-translation"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-700 bg-rose-100 border-4 border-rose-500 p-3 rounded-2xl font-black flex items-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-pink-500 hover:bg-pink-600 border-4 border-slate-900 text-white font-black text-xs px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-1 active:shadow-none bubble-shadow-pink"
          id="btn-add-custom-word"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> {t('customWords.addButton')}
        </button>
      </form>

      {/* Paste two columns copied from Excel or LibreOffice Calc. */}
      <div className="space-y-2 border-t-4 border-dashed border-slate-200 pt-4" id="custom-words-bulk">
        <label className="block text-[11px] font-black text-rose-500 uppercase tracking-widest ml-1">
          {t('customWords.bulkTitle')}
        </label>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
          {t('customWords.bulkHint')}
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border-4 border-slate-900 bg-white p-3 text-center text-[10px] font-black uppercase tracking-wider">
          <span className="rounded-lg bg-indigo-100 px-2 py-1">1. {t('customWords.wordColumn')}</span>
          <span className="rounded-lg bg-blue-100 px-2 py-1">2. {t('customWords.translationColumn')}</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
          {t('customWords.pasteHint')}
        </p>
        <textarea
          rows={4}
          placeholder={t('customWords.pastePlaceholder')}
          value={pasteText}
          onChange={(event) => { setPasteText(event.target.value); setBulkFeedback(''); }}
          className="w-full bg-white border-4 border-slate-900 text-slate-800 text-xs px-4 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 placeholder:text-slate-400 transition-all font-bold resize-y"
          id="input-custom-bulk-words"
        />
        <button
          type="button"
          onClick={handlePasteImport}
          disabled={!pasteText.trim()}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed border-4 border-slate-900 text-white font-black text-xs px-6 py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-1"
          id="btn-import-custom-words"
        >
          <ListPlus className="w-4 h-4 stroke-[3]" /> {t('customWords.pasteButton')}
        </button>

        {bulkFeedback && (
          <p className="text-xs text-slate-700 bg-amber-100 border-4 border-amber-400 p-3 rounded-2xl font-black" id="custom-words-bulk-feedback">
            {bulkFeedback}
          </p>
        )}
      </div>

      {/* Vocabulary list display */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-black uppercase tracking-wider text-purple-600">
            {t('customWords.dictionaryTitle')} ({customWords.length})
          </span>
          {customWords.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] text-rose-500 hover:text-rose-600 font-extrabold cursor-pointer transition-colors uppercase tracking-widest bg-white border-2 border-slate-900 px-2 py-0.5 rounded-lg"
              id="btn-clear-custom-words"
            >
              {t('customWords.clearAll')}
            </button>
          )}
        </div>

        {customWords.length === 0 ? (
          <div className="bg-amber-100/50 border-4 border-dashed border-amber-300 rounded-2xl p-5 text-center">
            <p className="text-xs text-amber-800 font-black">{t('customWords.empty')}</p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
            {customWords.map((item, index) => (
              <div
                key={index}
                className="bg-white border-4 border-slate-900 px-4 py-3 rounded-2xl flex items-center justify-between group shadow-sm hover:translate-y-[-1px] transition-transform"
                id={`custom-word-row-${index}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-black text-sm tracking-wide bg-purple-100 border-2 border-slate-900 px-2 py-0.5 rounded-lg">{item.word}</span>
                  <span className="text-xs text-slate-400 font-black">➔</span>
                  <span className="text-slate-600 text-xs font-black">{item.translation}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakWord(item.word)}
                    title={t('customWords.speakWord')}
                    className="p-1.5 bg-yellow-100 hover:bg-yellow-200 border-2 border-slate-900 text-slate-800 rounded-xl cursor-pointer transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteWord(index)}
                    title={t('customWords.deleteWord')}
                    className="p-1.5 bg-rose-150 hover:bg-rose-200 border-2 border-slate-900 text-rose-600 rounded-xl cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
