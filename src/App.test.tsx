import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import App from './App';
import { UiLanguageProvider } from './uiLanguage';

vi.mock('./components/GameCanvas', () => ({
  GameCanvas: ({
    onApproach,
    onCollide,
  }: {
    onApproach: (lane: 0 | 1 | 2) => void;
    onCollide: () => void;
  }) => (
    <>
      <button type="button" onClick={() => onApproach(1)}>Test obstacle approach</button>
      <button type="button" onClick={onCollide}>Test collision</button>
    </>
  ),
}));

describe('UI language toggle', () => {
  test('toggles the interface language', async () => {
    const user = userEvent.setup();

    render(
      <UiLanguageProvider>
        <App />
      </UiLanguageProvider>,
    );

    // Russian is the default interface language on launch (issue #84).
    expect(screen.getByText('ГОЛОСОВЫЕ ИГРЫ!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /switch interface language|переключить язык интерфейса/i }));

    expect(screen.getByText('VOICE GAMES!')).toBeInTheDocument();
  });

  test('opens the Sentence Bird game from the hub', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <UiLanguageProvider>
        <App />
      </UiLanguageProvider>,
    );

    await user.click(container.querySelector('#btn-play-sentence-bird')!);

    expect(screen.getByRole('heading', { name: /sentence bird|фразоптичка/i })).toBeInTheDocument();
  });

  test('opens the Echo Microphone game from the hub', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <UiLanguageProvider>
        <App />
      </UiLanguageProvider>,
    );

    await user.click(container.querySelector('#btn-play-echo-recorder')!);

    expect(screen.getByText(/echo microphone|эхо.микрофон/i)).toBeInTheDocument();
  });

  test('lets Sentence Bird own its title and single Hub action', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <UiLanguageProvider>
        <App />
      </UiLanguageProvider>,
    );

    await user.click(container.querySelector('#btn-play-sentence-bird')!);

    expect(screen.getByRole('heading', { name: /sentence bird|фразоптичка/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /voice bubble popper|лопание пузырей/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /назад в хаб|back to hub/i })).toHaveLength(1);
  });

  test('shows a back to hub action inside Echo Microphone', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <UiLanguageProvider>
        <App />
      </UiLanguageProvider>,
    );

    await user.click(container.querySelector('#btn-play-echo-recorder')!);

    expect(screen.getByRole('button', { name: /back to hub|назад в хаб/i })).toBeInTheDocument();
  });

  test('uses the shared setup, play header and result layout for Voice Racer', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <UiLanguageProvider>
        <App />
      </UiLanguageProvider>,
    );

    await user.click(container.querySelector('#btn-play-voice-racer')!);

    expect(screen.getByRole('heading', { name: /voice lane racer|голосовая гонка/i })).toBeInTheDocument();
    const setupPanel = container.querySelector('#voice-racer-arcade-lounge');
    expect(setupPanel).toBeInTheDocument();
    expect(setupPanel).toHaveClass('max-w-md');
    expect(setupPanel).not.toHaveClass('max-w-2xl');
    expect(screen.getAllByRole('button', { name: /back to hub|назад в хаб/i })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /start highway race|начать гонку/i }));

    expect(container.querySelector('#arcade-highway-centerage')).toHaveClass('max-w-5xl');
    expect(screen.getByRole('heading', { name: /voice lane racer|голосовая гонка/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause the game|поставить игру на паузу/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Test obstacle approach' }));
    await user.click(screen.getByRole('button', { name: 'Test collision' }));
    await user.click(screen.getByRole('button', { name: 'Test collision' }));
    await user.click(screen.getByRole('button', { name: 'Test collision' }));

    expect(await screen.findByRole('heading', { name: /super cooper driving|супер-гонка завершена/i })).toBeInTheDocument();
    const resultPanel = container.querySelector('#game-over-console');
    expect(resultPanel).toHaveClass('max-w-md');
    expect(resultPanel).not.toHaveClass('max-w-2xl');
    expect(screen.getByText(/word report|отчёт по словам/i)).toBeInTheDocument();
    expect(screen.queryByText(/no words were attempted|ещё не было попыток/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/needs practice: 1|нужно повторить: 1/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /race options|настройки гонки/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play highway again|сыграть ещё раз/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /back to hub|назад в хаб/i })).toHaveLength(1);
  });
});
