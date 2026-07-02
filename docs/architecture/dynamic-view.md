# Dynamic view - runtime behavior (Team 40)

The dynamic view shows what happens at runtime for the flow every game shares:
**a child speaks a word and the game reacts**. It also covers the two edge
cases that shaped the design: the anti-feedback gate and recognition restarts.

## Main flow: one spoken word

```mermaid
sequenceDiagram
    autonumber
    actor Child
    participant SR as SpeechRecognition<br/>(browser)
    participant Hook as useSpeechRecognition<br/>(src/voice/useVoiceGame.ts)
    participant Engine as engine.ts<br/>(src/voice/)
    participant Game as Game component
    participant Store as progress.ts + localStorage

    Child->>Game: press Start
    Game->>Hook: start()
    Hook->>SR: new SpeechRecognition().start()
    Note over SR: continuous mode,<br/>interim results on

    Child->>SR: speaks "…dolphin…"
    SR-->>Hook: onresult(transcript)
    Hook->>Engine: isSpeechSynthesisActive()?
    alt TTS is speaking (feedback risk)
        Engine-->>Hook: true
        Hook-->>Game: transcript dropped
    else microphone input is genuine
        Engine-->>Hook: false
        Hook-->>Game: onTranscript("dolphin")
        Game->>Engine: matchesWord(transcript, target)
        Note over Engine: clean + normalize (EN/RU),<br/>exact, contains, consonant,<br/>Levenshtein-tolerance checks
        alt match
            Engine-->>Game: true
            Game->>Game: advance game state<br/>(score, boss HP, rocket step…)
            Game->>Engine: speakSound / speakWord (praise, next word)
            Game->>Store: recordWordSpoken / recordHighScore
        else no match
            Engine-->>Game: false
            Game->>Game: optional hint, state unchanged
        end
    end
```

## Anti-feedback gate (issue #81, ADR-004)

The app speaks words aloud (pronunciation playback, praise sounds). On laptops
without echo cancellation the microphone hears the app's own voice, the
recognizer transcribes it, and the game would score its own speech. The gate
closes this loop:

- `speakWord` records that speech synthesis is active until the utterance ends
  (plus a short tail margin).
- The recognition hook checks `isSpeechSynthesisActive()` on every result and
  drops transcripts that arrive while the app itself is speaking.

The gate lives in the shared voice module, so all six games are protected by
the same two functions.

## Recognition lifecycle and recovery

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> listening: start()
    listening --> listening: onend and wantActive<br/>(auto-restart)
    listening --> idle: stop() (user or game over)
    listening --> error: onerror (denied mic,<br/>no speech, network)
    error --> listening: auto-retry when recoverable
    error --> idle: unrecoverable (mic denied)
    idle --> [*]
```

Chrome ends a continuous recognition session on silence. The hook keeps a
`wantActive` flag: while the game wants the microphone on, every `onend`
triggers a restart, so a quiet child does not silently lose voice control.
Errors are mapped to child-friendly status messages shown next to the
microphone indicator.

## Deterministic racer movement (issue #85)

Voice Racer's lane changes go through a pure `updateRacerMovement` state
machine in `engine.ts`: recognized commands set a pending lane, and the update
function applies it on a fixed-timestep tick with a de-jitter interval, so
movement no longer depends on frame rate or on how often the recognizer emits
interim results. The function is pure and covered by unit tests.
