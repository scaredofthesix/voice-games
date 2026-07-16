import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { UiLanguageProvider } from '../uiLanguage';
import { CustomWordsManager } from './CustomWordsManager';

function renderManager(
  onAddWord: (word: string, translation: string) => void,
  customWords = [],
) {
  window.localStorage.setItem('ui_language', 'en');
  return render(
    <UiLanguageProvider>
      <CustomWordsManager
        customWords={customWords}
        onAddWord={onAddWord}
        onDeleteWord={() => undefined}
        onClearAll={() => undefined}
      />
    </UiLanguageProvider>,
  );
}

describe('CustomWordsManager paste import', () => {
  test('imports tab-separated rows and has no file-upload control', () => {
    const onAddWord = vi.fn();
    const { container } = renderManager(onAddWord);

    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
    const textarea = container.querySelector('#input-custom-bulk-words') as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: 'hello\tпривет\ngood morning\tдоброе утро' },
    });
    fireEvent.click(container.querySelector('#btn-import-custom-words') as HTMLButtonElement);

    expect(onAddWord).toHaveBeenCalledTimes(2);
    expect(onAddWord).toHaveBeenNthCalledWith(1, 'hello', 'привет');
    expect(onAddWord).toHaveBeenNthCalledWith(2, 'good morning', 'доброе утро');
    expect(screen.getByText('Added 2. Skipped 0 invalid or duplicate row(s).')).toBeInTheDocument();
    expect(textarea.value).toBe('');
  });

  test('imports phrases separated from translations by four spaces', () => {
    const onAddWord = vi.fn();
    const { container } = renderManager(onAddWord);
    const textarea = container.querySelector('#input-custom-bulk-words') as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: {
        value: 'Nice to meet you    Приятно познакомиться\nHow are you?    Как дела?',
      },
    });
    fireEvent.click(container.querySelector('#btn-import-custom-words') as HTMLButtonElement);

    expect(onAddWord).toHaveBeenCalledTimes(2);
    expect(onAddWord).toHaveBeenNthCalledWith(1, 'Nice to meet you', 'Приятно познакомиться');
    expect(onAddWord).toHaveBeenNthCalledWith(2, 'How are you?', 'Как дела?');
    expect(screen.getByText('Added 2. Skipped 0 invalid or duplicate row(s).')).toBeInTheDocument();
    expect(textarea.value).toBe('');
  });

  test('skips duplicates from the existing list and within one paste', () => {
    const onAddWord = vi.fn();
    const existing = [{ word: 'cat', translation: 'кот', speakCount: 0, struggleCount: 0 }];
    const { container } = renderManager(onAddWord, existing);
    const textarea = container.querySelector('#input-custom-bulk-words') as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: 'cat\tкот\ndog\tсобака\nDOG\tпёс' },
    });
    fireEvent.click(container.querySelector('#btn-import-custom-words') as HTMLButtonElement);

    expect(onAddWord).toHaveBeenCalledOnce();
    expect(onAddWord).toHaveBeenCalledWith('dog', 'собака');
    expect(screen.getByText('Added 1. Skipped 2 invalid or duplicate row(s).')).toBeInTheDocument();
  });

  test('keeps invalid text and explains that one to three spaces are not enough', () => {
    const onAddWord = vi.fn();
    const { container } = renderManager(onAddWord);
    const textarea = container.querySelector('#input-custom-bulk-words') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'no ordinary space separator' } });
    fireEvent.click(container.querySelector('#btn-import-custom-words') as HTMLButtonElement);

    expect(onAddWord).not.toHaveBeenCalled();
    expect(textarea.value).toBe('no ordinary space separator');
    expect(screen.getByText(/one to three spaces are not a column separator/i)).toBeInTheDocument();
  });
});
