import { useCallback, useEffect, useRef, useState } from 'react';
import { isSpeechSynthesisActive } from './engine';
import { useUiLanguage } from '../uiLanguage';

export type SpeechRecognitionStatus =
  | 'unsupported'
  | 'idle'
  | 'listening'
  | 'error';

export interface SpeechStatus {
  status: SpeechRecognitionStatus;
  message: string;
}

export interface UseSpeechRecognitionResult {
  status: SpeechStatus;
  lastTranscript: string;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

export const SUCCESS_RECOGNITION_DELAY_MS = 650;

function getSpeechRecognitionCtor(): any {
  if (typeof window === 'undefined') return undefined;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

export function useSpeechRecognition(
  onTranscript: (text: string) => boolean | void,
): UseSpeechRecognitionResult {
  const recognitionRef = useRef<any>(null);
  const wantActiveRef = useRef(false);
  const callbackRef = useRef(onTranscript);
  const restartRef = useRef<() => void>(() => undefined);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useUiLanguage();
  const translationRef = useRef(t);
  const [lastTranscript, setLastTranscript] = useState('');
  const [status, setStatus] = useState<SpeechStatus>({
    status: 'idle',
    message: t('shared.voiceStartPrompt'),
  });

  useEffect(() => {
    translationRef.current = t;
  }, [t]);

  useEffect(() => {
    callbackRef.current = onTranscript;
  }, [onTranscript]);

  const isSupported = Boolean(getSpeechRecognitionCtor());

  const stop = useCallback(() => {
    wantActiveRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const rec = recognitionRef.current;
    if (rec) {
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // ignore abort races
      }
      recognitionRef.current = null;
    }
    setLastTranscript('');
    setStatus({ status: 'idle', message: translationRef.current('shared.voiceStopped') });
  }, []);

  const start = useCallback(() => {
    wantActiveRef.current = true;
    if (restartTimerRef.current || recognitionRef.current) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus({
        status: 'unsupported',
        message: translationRef.current('shared.voiceUnsupported'),
      });
      return;
    }

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setStatus({
        status: 'listening',
        message: translationRef.current('shared.micListening'),
      });
    };

    rec.onerror = (event: any) => {
      if (event?.error === 'not-allowed') {
        wantActiveRef.current = false;
        setStatus({
          status: 'error',
          message: translationRef.current('shared.micAccessBlocked'),
        });
      }
    };

    rec.onend = () => {
      if (wantActiveRef.current) {
        try {
          rec.start();
        } catch {
          // avoid double-start collisions
        }
      }
    };

    rec.onresult = (event: any) => {
      if (isSpeechSynthesisActive()) {
        return;
      }

      let text = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i]?.[0]?.transcript;
        if (typeof transcript === 'string') {
          text += transcript;
        }
      }
      if (text) {
        setLastTranscript(text);
        const accepted = callbackRef.current(text) === true;
        if (!accepted) return;

        // A successful utterance belongs only to the current prompt. Retire the
        // recognizer that heard it, clear its buffered transcript, and create a
        // fresh recognizer after a short processing pause. This prevents the
        // final event for one utterance from reaching the next prompt.
        rec.onend = null;
        rec.onresult = null;
        try {
          rec.abort();
        } catch {
          // ignore abort races
        }
        if (recognitionRef.current === rec) recognitionRef.current = null;
        setLastTranscript('');
        setStatus({
          status: 'idle',
          message: translationRef.current('shared.processingNextWord'),
        });
        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null;
          if (wantActiveRef.current) restartRef.current();
        }, SUCCESS_RECOGNITION_DELAY_MS);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      // start() can throw if called twice in quick succession; ignore.
    }
  }, []);

  useEffect(() => {
    restartRef.current = start;
  }, [start]);

  useEffect(() => stop, [stop]);

  return { status, lastTranscript, isSupported, start, stop };
}
