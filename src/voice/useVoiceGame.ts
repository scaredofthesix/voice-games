import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [lastTranscript, setLastTranscript] = useState('');
  const [status, setStatus] = useState<SpeechStatus>({
    status: 'idle',
    message: 'Press Start to turn on the microphone.',
  });

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
    setStatus({ status: 'idle', message: 'Microphone stopped.' });
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus({
        status: 'unsupported',
        message: 'Voice API not found. Please play inside Google Chrome.',
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
        message: 'Listening! Say the English word out loud.',
      });
    };

    rec.onerror = (event: any) => {
      if (event?.error === 'not-allowed') {
        setStatus({
          status: 'error',
          message: 'Microphone blocked. Please allow the mic in the address bar.',
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
