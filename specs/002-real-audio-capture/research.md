# Research: Real Audio Capture

**Phase**: Phase 0 — Research & Unknowns Resolution
**Date**: 2026-05-09
**Feature**: [spec.md](./spec.md)

## Resolved Unknowns

### 1. Audio Capture Library

- **Decision**: naudiodon v2.3.6 (PortAudio bindings)
- **Rationale**:
  - Mature, maintained library with built-in TypeScript declarations
  - Uses N-API for native bindings — portable across Node.js versions without recompilation
  - Provides a Node.js ReadableStream interface, allowing back-pressure and easy piping
  - Bundles PortAudio with the package — no system dependency required on most platforms
  - Supports the required format (16kHz, mono, 16-bit PCM)
  - Tested on Linux, Windows, and macOS
- **Alternatives considered**:
  - `node-microphone`: Wrapper around SoX — adds system dependency (sox), less control over audio params
  - `mic`: Unmaintained, depends on SoX
  - `getUserMedia` in hidden window: More complex pipeline (renderer → IPC → main), breaks constitution rule that audio capture happens in Main Process

### 2. Audio Format for STT Pipeline

- **Decision**: 16000 Hz sample rate, mono (1 channel), 16-bit signed PCM (S16LE)
- **Rationale**:
  - Industry standard for speech-to-text services (Deepgram, Whisper, Google STT)
  - 16kHz is the sweet spot: sufficient frequency range for human speech, half the data of 44.1kHz
  - Mono is sufficient for speech (no spatial info needed)
  - 16-bit provides adequate dynamic range for speech
- **Alternatives considered**:
  - 44.1kHz stereo: 5.5x more data, no benefit for speech recognition
  - 8-bit: insufficient dynamic range, poor STT accuracy
  - Float32: unnecessary precision, 2x memory usage

### 3. VU Meter Implementation

- **Decision**: RMS (Root Mean Square) calculation from raw PCM samples, sent to renderer at 100ms intervals
- **Rationale**:
  - RMS correlates well with perceived loudness
  - Simple to compute from PCM buffer chunks received from naudiodon
  - 100ms update rate provides smooth visual feedback without excessive IPC traffic
- **Formula**:
  ```
  rms = sqrt(sum(sample_i^2 for each sample) / num_samples)
  level_dB = 20 * log10(rms / max_possible)
  level_normalized = clamp(level_dB / -60, 0, 1)  // 0 = silence, 1 = max
  ```

### 4. Buffer Management

- **Decision**: Accumulate Buffer chunks in an array, concatenate on stop
- **Rationale**:
  - Simplest approach with minimal overhead
  - Buffer.concat() is efficient for concatenating collected buffers
  - Total memory for 10min at 16kHz mono 16-bit: 10 × 60 × 16000 × 2 = 19.2MB (well within 150MB budget)
- **Safety limit**: Stop recording at 10 minutes (checked via elapsed time counter, not buffer size)

### 5. Electron Native Module Integration

- **Decision**: naudiodon imported in Main Process only; electron-vite handles native modules as externals
- **Rationale**:
  - electron-vite automatically externalizes native modules in the main process configuration
  - Naudiodon uses N-API (napi-rs), which is compatible with Electron's Node.js runtime
  - Build process: `electron-vite build` compiles the main process bundle and includes native modules

### 6. System Dependencies

- **Decision**: portaudio19-dev recommended for Linux, but naudiodon bundles its own copy
- **Rationale**:
  - naudiodon ships with a prebuilt PortAudio binary for common platforms
  - On some Linux distributions, the bundled binary may have issues with ALSA/PulseAudio — installing `portaudio19-dev` ensures the system version is used
  - On Windows and macOS, no system dependencies needed

## Audio Pipeline Design

```
┌─────────────────────────────────────────────────────────────┐
│ Main Process                                                │
│                                                             │
│  naudiodon AudioIO (ReadableStream)                         │
│       │                                                     │
│       │ data chunks (Buffer, 16kHz mono 16-bit PCM)         │
│       ▼                                                     │
│  audio-capture.ts                                           │
│       │                                                     │
│       ├──→ accumulate in Buffer[] (session buffer)          │
│       │                                                     │
│       └──→ calculate RMS → IPC 'audio:level' → renderer     │
│                                                             │
│  on stop: Buffer.concat() → ready for Deepgram (spec 003)   │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

| Error | Detection | Handling |
|-------|-----------|----------|
| No input device | `getDevices()` returns no devices with `maxInputChannels > 0` | Block recording start, show error in overlay |
| Device disconnected mid-recording | `data` event stops firing, or stream emits `error` event | Stop recording, show error, return to idle |
| Permission denied | PortAudio returns error on `start()` | Catch error, show permission-related message |
| PortAudio not available | `require('naudiodon')` throws MODULE_NOT_FOUND | Catch, log, show "Audio system unavailable" |
| Buffer overflow | Safety timer reaches 10min | Auto-stop with "Maximum recording time reached" message |

## References

- naudiodon npm: https://www.npmjs.com/package/naudiodon
- naudiodon README: API examples for recording and device enumeration
- PortAudio documentation: http://portaudio.com/docs/v19-doxydocs/
- Deepgram audio format requirements: 16kHz, mono, 16-bit PCM
