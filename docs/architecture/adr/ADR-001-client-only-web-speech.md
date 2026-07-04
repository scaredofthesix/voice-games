# ADR-001: Client-only application on the Web Speech API

- **Status:** Accepted (Sprint 1, documented in Sprint 3)
- **Deciders:** Team 40
- **Quality requirements addressed:** [QR-1](../../quality-requirements.md#qr-1-functional-correctness-of-speech-matching) (recognition quality is compensated in our own matching layer), [QR-2](../../quality-requirements.md#qr-2-response-time-of-speech-matching) (recognition and matching run in the browser with no team-controlled network hop)

## Context

The product is a set of voice-controlled English word games for children aged
about 6-10. Voice is the only game controller, so the app needs speech-to-text
with low enough latency to feel like control, and text-to-speech for
pronunciation playback. The team is 5 students on a multi-week Scrum course:
no budget for paid speech APIs, no capacity to operate servers, and a hard
requirement that a customer can open the product and test it without setup.
Children's voice data is also sensitive: the less of it we handle ourselves,
the better.

## Decision

Build the entire product as a **client-only browser application** and use the
**Web Speech API** (`SpeechRecognition` for input, `speechSynthesis` for
output) as the speech stack. No backend, no API keys, no server-side state;
the only persistence is `localStorage` on the device.

## Alternatives considered

- **Cloud speech API (Google Cloud Speech, Azure, Whisper API) behind our own
  backend.** Better accuracy and browser coverage, but needs a paid account,
  key management, a server to proxy audio, and makes us a processor of
  children's voice recordings. Rejected on cost, operations, and privacy.
- **On-device open-source model (e.g. Vosk / whisper.cpp via WASM).** No
  vendor dependency, works offline, but heavyweight bundles, slower cold
  start on school laptops, and much higher integration effort than the course
  timeline allows. Rejected on effort.

## Consequences

- Zero hosting cost and zero secret management; deployment reduces to static
  files (enables ADR-003).
- Voice data never passes through team infrastructure; recognition audio goes
  only from Chrome to its built-in speech service.
- **Chrome-only support**: `SpeechRecognition` is not reliably available in
  Firefox or Safari. Accepted and documented in the README and UATs.
- Recognition quality is whatever Chrome provides; we compensate in our own
  matching layer (tolerant matcher with Levenshtein distance and RU/EN
  normalization) instead of tuning a recognizer.
- Recognition needs network connectivity, since Chrome streams audio to its
  speech service.
