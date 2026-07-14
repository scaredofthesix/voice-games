import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { UiLanguageProvider } from '../uiLanguage';
import { CustomWordsManager } from './CustomWordsManager';

function renderManager(onAddWord: (word: string, translation: string) => void) {
  window.localStorage.setItem('ui_language', 'en');
  return render(
    <UiLanguageProvider>
      <CustomWordsManager
        customWords={[]}
        onAddWord={onAddWord}
        onDeleteWord={() => undefined}
        onClearAll={() => undefined}
      />
    </UiLanguageProvider>,
  );
}

describe('CustomWordsManager bulk import', () => {
  test('imports every row of a two-column CSV file', async () => {
    const onAddWord = vi.fn();
    const { container } = renderManager(onAddWord);

    expect(screen.getByText('1. Word')).toBeInTheDocument();
    expect(screen.getByText('2. Translation')).toBeInTheDocument();

    const file = new File([], 'words.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'text', {
      value: vi.fn().mockResolvedValue('word,translation\ncat,кот\ndog,собака'),
    });
    const input = container.querySelector('#input-custom-csv-words') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onAddWord).toHaveBeenCalledTimes(2));
    expect(onAddWord).toHaveBeenNthCalledWith(1, 'cat', 'кот');
    expect(onAddWord).toHaveBeenNthCalledWith(2, 'dog', 'собака');
    expect(screen.getByText('Added 2. Skipped 0 invalid row(s).')).toBeInTheDocument();
  });

  test('also imports a pipe-separated list pasted into the textarea', () => {
    const onAddWord = vi.fn();
    const { container } = renderManager(onAddWord);

    const textarea = container.querySelector('#input-custom-bulk-words') as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: 'hello | привет\ngood morning | доброе утро' },
    });
    fireEvent.click(container.querySelector('#btn-import-custom-words') as HTMLButtonElement);

    expect(onAddWord).toHaveBeenCalledTimes(2);
    expect(onAddWord).toHaveBeenNthCalledWith(1, 'hello', 'привет');
    expect(onAddWord).toHaveBeenNthCalledWith(2, 'good morning', 'доброе утро');
    expect(screen.getByText('Added 2. Skipped 0 invalid row(s).')).toBeInTheDocument();
    expect(textarea.value).toBe('');
  });

  test('keeps the pasted text and explains the format when no pair is valid', () => {
    const onAddWord = vi.fn();
    const { container } = renderManager(onAddWord);

    const textarea = container.querySelector('#input-custom-bulk-words') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'no-delimiter-here' } });
    fireEvent.click(container.querySelector('#btn-import-custom-words') as HTMLButtonElement);

    expect(onAddWord).not.toHaveBeenCalled();
    expect(textarea.value).toBe('no-delimiter-here');
    expect(
      screen.getByText('No valid pairs found. Column 1 must be the word and column 2 the translation.'),
    ).toBeInTheDocument();
  });

  test('disables the paste button until something is typed', () => {
    const { container } = renderManager(vi.fn());

    const button = container.querySelector('#btn-import-custom-words') as HTMLButtonElement;
    expect(button).toBeDisabled();

    fireEvent.change(container.querySelector('#input-custom-bulk-words') as HTMLTextAreaElement, {
      target: { value: 'cat | кот' },
    });
    expect(button).not.toBeDisabled();
  });
});
