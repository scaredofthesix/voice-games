import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { MagicWizardGame } from './MagicWizardGame';
import { UiLanguageProvider } from '../uiLanguage';
import {
  installMockSpeechRecognition,
  MockSpeechRecognition,
} from '../test/mockSpeechRecognition';

// Mock speech synthesis/recognition
vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils');
  return {
    ...actual,
    speakWord: vi.fn(),
    speakSound: {
      playCorrect: vi.fn(),
      playLose: vi.fn(),
      playCoin: vi.fn(),
    },
  };
});

describe('MagicWizardGame (integration)', () => {
  let cleanup: () => void;

  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('ui_language', 'en');
  });

  afterEach(() => {
    cleanup?.();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('start screen shows accessible title and start control', () => {
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    expect(
      screen.getByRole('button', { name: /open spellbook/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /magic wizard/i }),
    ).toBeInTheDocument();
  });

  test('clicking back to hub calls callback', () => {
    cleanup = installMockSpeechRecognition();
    const handleBack = vi.fn();
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={handleBack} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /hub/i }));
    expect(handleBack).toHaveBeenCalled();
  });

  test('renders the spell-recipe preview in Russian', () => {
    window.localStorage.setItem('ui_language', 'ru');
    cleanup = installMockSpeechRecognition();

    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    expect(screen.getByText('ОГНЕННАЯ КНИГА')).toBeInTheDocument();
    expect(
      screen.getByText('Заряжай слова-руны для магии огня!'),
    ).toBeInTheDocument();
  });

  test('starts with a two-rune recipe and speech charges one rune', () => {
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /open spellbook/i }));

    const runes = screen.getAllByRole('listitem');
    expect(runes).toHaveLength(2);
    const firstWord = runes[0].querySelector('p')?.textContent;
    expect(firstWord).toBeTruthy();

    act(() => {
      MockSpeechRecognition.latest().emit(firstWord || '');
    });

    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('data-charged', 'true');
    expect(screen.getAllByRole('listitem')[1]).toHaveAttribute('data-charged', 'false');
  });

  test('grows each recipe and finishes after four completed spells', () => {
    vi.useFakeTimers();
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /open spellbook/i }));

    for (const expectedRuneCount of [2, 3, 4, 5]) {
      const runes = screen.getAllByRole('listitem');
      expect(runes).toHaveLength(expectedRuneCount);

      for (const rune of runes) {
        const word = rune.querySelector('p')?.textContent || '';
        act(() => {
          MockSpeechRecognition.latest().emit(word);
        });
      }

      act(() => {
        vi.advanceTimersByTime(900);
      });
    }

    expect(
      screen.getByRole('heading', { name: /spellbook complete/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Spells Crafted').parentElement).toHaveTextContent('4');
  });

  test('only a displayed cursed rune breaks wards and three curses lose the game', () => {
    vi.useFakeTimers();
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /open spellbook/i }));

    act(() => {
      MockSpeechRecognition.latest().emit('a harmless unrelated phrase');
    });
    expect(screen.getByLabelText(/magic wards: 3/i)).toBeInTheDocument();

    for (const remainingWards of [2, 1, 0]) {
      const curseWord = document.querySelector<HTMLElement>('[data-cursed-word="true"]')
        ?.textContent;
      expect(curseWord).toBeTruthy();

      act(() => {
        MockSpeechRecognition.latest().emit(curseWord || '');
      });

      expect(
        screen.getByLabelText(new RegExp(`magic wards: ${remainingWards}`, 'i')),
      ).toBeInTheDocument();

      if (remainingWards === 0) break;

      for (const rune of screen.getAllByRole('listitem')) {
        const word = rune.querySelector('p')?.textContent || '';
        act(() => {
          MockSpeechRecognition.latest().emit(word);
        });
      }

      act(() => {
        vi.advanceTimersByTime(900);
      });
    }

    act(() => {
      vi.advanceTimersByTime(750);
    });

    expect(
      screen.getByRole('heading', { name: /the curse won/i }),
    ).toBeInTheDocument();
  });
});
