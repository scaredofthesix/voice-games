import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { OptionPicker, PauseButton, TargetWordCard, WordSetPicker } from './GameUi';
import { UiLanguageProvider } from '../uiLanguage';

describe('shared game UI', () => {
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
});
