import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import App from './App';
import { UiLanguageProvider } from './uiLanguage';

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

    await user.click(screen.getByRole('button', { name: /switch interface language/i }));

    expect(screen.getByText('VOICE GAMES!')).toBeInTheDocument();
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
});
