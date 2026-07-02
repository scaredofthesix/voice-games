# ADR-004: Mute recognition while the app itself is speaking

- **Status:** Accepted (Sprint 3, issue #81)
- **Deciders:** Team 40

## Context

During the Sprint 2 customer review the speech engine scored its own output:
the app pronounces a word (pronunciation playback, praise, hints), the
microphone picks it up, Chrome transcribes it, and the matcher accepts it as
if the child had spoken. On laptops without hardware echo cancellation this
made games effectively play themselves. This was the top severity finding of
the review (UAT session of 2026-06-27).

## Decision

Add an **anti-feedback gate in the shared voice module**: `speakWord` marks
speech synthesis active until the utterance ends plus a short tail margin, and
the recognition hook checks `isSpeechSynthesisActive()` on every recognition
result, dropping transcripts that arrive while the app is speaking.

## Alternatives considered

- **Stop and restart `SpeechRecognition` around every TTS call.** Also
  prevents the loop, but Chrome's recognition restart takes noticeable time
  and loses in-flight speech, so the game feels deaf right after each hint.
  Rejected on latency.
- **Remove all TTS output.** Kills the feedback loop and the product value:
  pronunciation playback is a core learning feature (US-04). Rejected.
- **Acoustic echo cancellation via WebRTC constraints.** Browser support is
  inconsistent for the recognition path and not controllable from the Web
  Speech API. Rejected as unreliable.

## Consequences

- Games no longer trigger themselves; verified manually on hardware without
  echo cancellation and by unit tests on the gate logic.
- While the app speaks, genuine child speech in the same instant is also
  dropped. Accepted: utterances are short, and children naturally answer
  after hearing the word.
- The gate only works because **every** game routes voice through the shared
  module (ADR-005); a game calling `speechSynthesis` directly would bypass it.
  The dependency rule in the static view forbids that.
