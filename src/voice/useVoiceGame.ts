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

function getSpeechRecognitionCtor(): any {
  if (typeof window === 'undefined') return undefined;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

export function useSpeechRecognition(
  onTranscript: (text: string) => void,
): UseSpeechRecognitionResult {
  const recognitionRef = useRef<any>(null);
  const wantActiveRef = useRef(false);
  const callbackRef = useRef(onTranscript);
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
    setStatus({ status: 'idle', message: translationRef.current('shared.voiceStopped') });
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus({
        status: 'unsupported',
        message: translationRef.current('shared.voiceUnsupported'),
      });
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
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
        callbackRef.current(text);
      }
    };

    recognitionRef.current = rec;
    wantActiveRef.current = true;
    try {
      rec.start();
    } catch {
      // start() can throw if called twice in quick succession; ignore.
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { status, lastTranscript, isSupported, start, stop };
}
