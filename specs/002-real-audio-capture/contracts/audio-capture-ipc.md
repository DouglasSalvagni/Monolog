# IPC Contract: Audio Capture

**Phase**: Phase 1 — Design & Contracts
**Date**: 2026-05-09
**Feature**: [spec.md](../spec.md)

## Overview

IPC channels between Electron Main Process and Renderer for audio capture.

## Channels

### Main → Renderer (event-based, push)

| Channel | Payload | Frequency | Description |
|---------|---------|-----------|-------------|
| `audio:level` | `{ level: number }` | Every ~100ms during recording | Normalized RMS level (0-1) for VU meter |
| `audio:error` | `{ message: string }` | On error | Error message when audio capture fails |

### Renderer → Main (fire-and-forget)

| Channel | Payload | Description |
|---------|---------|-------------|
| `audio:start-capture` | _(none)_ | Request to start audio capture |
| `audio:stop-capture` | _(none)_ | Request to stop audio capture |

## TypeScript Types

```typescript
// audio:level payload
interface AudioLevelPayload {
  level: number  // 0.0 (silence) to 1.0 (maximum)
}

// audio:error payload
interface AudioErrorPayload {
  message: string
  code: 'DEVICE_NOT_FOUND' | 'PERMISSION_DENIED' | 'STREAM_ERROR' | 'AUDIO_SYSTEM_UNAVAILABLE'
}
```

## Preload API

```typescript
interface AudioCaptureAPI {
  onAudioLevel(callback: (level: number) => void): () => void
  onAudioError(callback: (error: AudioErrorPayload) => void): () => void
  startCapture(): void
  stopCapture(): void
}
```
