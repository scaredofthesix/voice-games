import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { BackToHubButton, GameResultCard, OptionPicker, PauseButton, TargetWordCard, WordSetPicker } from './GameUi';
import { UiLanguageProvider } from '../uiLanguage';

describe('shared game UI', () => {
  test('BackToHubButton uses the same high-contrast color in every game', () => {
    render(<BackToHubButton label="Hub" onClick={() => undefined} />);
    expect(screen.getByRole('button')).toHaveClass('bg-yellow-300');
  });

  test('OptionPicker exposes and updates the selected option', () => {
    const onSelect = vi.fn();

    render(
      <OptionPicker
        label="Choose a theme"
        options={[
          { id: 'forest', label: 'Forest' },
          { id: 'night', label: 'Night' },
        ]}
        selected="forest"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole('button', { name: 'Forest' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Night' }));
    expect(onSelect).toHaveBeenCalledWith('night');
  });

  test('WordSetPicker returns built-in and custom categories', () => {
    const onSelect = vi.fn();

    render(
      <WordSetPicker
        legend="Choose a word set"
        myWordsLabel="Мои слова"
        activeCategoryId="animals"
        customWords={[
          {
            word: 'Robot',
            translation: 'Machine',
            translationRu: 'Робот',
            speakCount: 0,
            struggleCount: 0,
          },
        ]}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /фрукты/i }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'fruits' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Мои слова (1)' }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'custom', name: 'Мои слова' }),
    );
  });

  test('PauseButton uses the supplied language labels', () => {
    window.localStorage.setItem('ui_language', 'en');
    const onToggle = vi.fn();

    const { rerender } = render(
      <UiLanguageProvider>
        <PauseButton
          paused={false}
          onToggle={onToggle}
          pauseLabel="Пауза"
          resumeLabel="Продолжить"
        />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /pause the game/i }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(screen.getByText('Пауза')).toBeInTheDocument();

    rerender(
      <UiLanguageProvider>
        <PauseButton
          paused
          onToggle={onToggle}
          pauseLabel="Пауза"
          resumeLabel="Продолжить"
        />
      </UiLanguageProvider>,
    );
    expect(screen.getByText('Продолжить')).toBeInTheDocument();
  });

  test('TargetWordCard provides consistent English and Russian playback controls', () => {
    const onListenEn = vi.fn();
    const onListenRu = vi.fn();

    render(
      <TargetWordCard
        ribbon="Произнеси"
        word="Dolphin"
        translation="Дельфин"
        translationRu="Дельфин"
        heard="dolfin"
        heardLabel="Слышу:"
        onListenEn={onListenEn}
        onListenRu={onListenRu}
      />,
    );

    expect(screen.getByTestId('target-word')).toHaveTextContent('Dolphin');
    expect(screen.getByText('Дельфин')).toBeInTheDocument();
    expect(screen.getByText('"dolfin"')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /послушать слово dolphin/i }));
    fireEvent.click(screen.getByRole('button', { name: /слушать по-русски/i }));
    expect(onListenEn).toHaveBeenCalledOnce();
    expect(onListenRu).toHaveBeenCalledOnce();
  });

  test('GameResultCard reports per-word attempts and exposes EN/RU playback', () => {
    window.localStorage.setItem('ui_language', 'en');
    const onReplay = vi.fn();
    render(
      <UiLanguageProvider>
        <GameResultCard
          title="Round complete"
          description="Review"
          scoreLabel="Score"
          score={40}
          bestLabel="Best"
          best={80}
          wordStats={{ Dolphin: { spoken: 2, struggled: 1 } }}
          words={[{ word: 'Dolphin', translation: 'Дельфин', translationRu: 'Дельфин' }]}
          replayLabel="Play again"
          onReplay={onReplay}
        />
      </UiLanguageProvider>,
    );

    expect(screen.getByText('Dolphin')).toBeInTheDocument();
    expect(screen.getByText(/Correct: 2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hear the word dolphin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /listen in russian/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /play again/i }));
    expect(onReplay).toHaveBeenCalledOnce();
  });
});
