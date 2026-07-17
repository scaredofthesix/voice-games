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
    expect(screen.getByText('Added 2. Left 0 row(s) below to fix.')).toBeInTheDocument();
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
    expect(screen.getByText('Added 2. Left 0 row(s) below to fix.')).toBeInTheDocument();
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
    expect(screen.getByText('Added 1. Left 2 row(s) below to fix.')).toBeInTheDocument();
    expect(textarea.value).toBe('cat\tкот\nDOG\tпёс');
    expect(screen.getAllByText('This word already exists.')).toHaveLength(2);
  });

  test('keeps invalid text and explains that one to three spaces are not enough', () => {
    const onAddWord = vi.fn();
    const { container } = renderManager(onAddWord);
    const textarea = container.querySelector('#input-custom-bulk-words') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'no ordinary space separator' } });
    fireEvent.click(container.querySelector('#btn-import-custom-words') as HTMLButtonElement);

    expect(onAddWord).not.toHaveBeenCalled();
    expect(textarea.value).toBe('no ordinary space separator');
    expect(screen.getByText(/three spaces are not a separator/i)).toBeInTheDocument();
    expect(screen.getByText(/exactly four spaces between the columns/i)).toBeInTheDocument();
  });

  test('saves valid rows and leaves invalid and duplicate rows in their original order', () => {
    const onAddWord = vi.fn();
    const existing = [{ word: 'owl', translation: 'сова', speakCount: 0, struggleCount: 0 }];
    const { container } = renderManager(onAddWord, existing);
    const textarea = container.querySelector('#input-custom-bulk-words') as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: {
        value: 'good morning\tдоброе утро\nbad row   три пробела\nowl\tдругая сова\nnice to meet you    приятно познакомиться',
      },
    });
    fireEvent.click(container.querySelector('#btn-import-custom-words') as HTMLButtonElement);

    expect(onAddWord).toHaveBeenCalledTimes(2);
    expect(onAddWord).toHaveBeenNthCalledWith(1, 'good morning', 'доброе утро');
    expect(onAddWord).toHaveBeenNthCalledWith(2, 'nice to meet you', 'приятно познакомиться');
    expect(textarea.value).toBe('bad row   три пробела\nowl\tдругая сова');
    expect(screen.getByText(/exactly four spaces between the columns/i)).toBeInTheDocument();
    expect(screen.getByText('This word already exists.')).toBeInTheDocument();
  });

  test('does not add a duplicate entered in the single-word form', () => {
    const onAddWord = vi.fn();
    const existing = [{ word: 'Owl', translation: 'сова', speakCount: 0, struggleCount: 0 }];
    const { container } = renderManager(onAddWord, existing);

    fireEvent.change(container.querySelector('#input-custom-english-word') as HTMLInputElement, {
      target: { value: 'owl' },
    });
    fireEvent.change(container.querySelector('#input-custom-russian-translation') as HTMLInputElement, {
      target: { value: 'сова' },
    });
    fireEvent.click(container.querySelector('#btn-add-custom-word') as HTMLButtonElement);

    expect(onAddWord).not.toHaveBeenCalled();
    expect(screen.getByText('This word already exists.')).toBeInTheDocument();
  });
});
