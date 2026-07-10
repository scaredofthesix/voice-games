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
    window.localStorage.setItem('ui_language', 'en');
    // Mock HTMLCanvasElement.getContext to avoid canvas errors
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup?.();
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
      screen.getByRole('button', { name: /begin spellcasting/i }),
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
});
