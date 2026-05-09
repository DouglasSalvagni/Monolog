# Data Model: Real Audio Capture

**Phase**: Phase 1 — Design & Contracts
**Date**: 2026-05-09
**Feature**: [spec.md](./spec.md)

## Entities

### AudioCaptureSession

Represents a single recording session managed in the Main Process.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `chunks` | `Buffer[]` | Accumulated PCM audio buffers received from naudiodon | Max size ~19.2MB for 10min at 16kHz mono 16-bit |
| `startTime` | `number` | `Date.now()` timestamp when recording started | Monotonically increasing |
| `chunkCount` | `number` | Number of data chunks received | Incremented on each `data` event |
| `totalBytes` | `number` | Total bytes of audio accumulated | Sum of all chunk `.length` |

**State Transitions**:

```
idle → recording (on startCapture)
recording → idle (on stopCapture — buffer ready for consumption)
recording → idle (on auto-stop at 10min — buffer finalized)
recording → error → idle (on device error — buffer discarded)
```

**Validation Rules**:
- `chunks` MUST be empty when session is created
- `startTime` MUST be set when first chunk arrives
- After stop/error, the session object is frozen (no more chunks added)

### AudioLevel

Represents the instantaneous audio level for VU meter display, sent from Main Process to Renderer via IPC.

| Field | Type | Description | Range |
|-------|------|-------------|-------|
| `level` | `number` | Normalized RMS level | 0.0 (silence) to 1.0 (maximum) |
| `timestamp` | `number` | When the level was computed | Unix epoch ms |

**Computation**:
```
rms = sqrt(avg(sample^2 for all samples in chunk))
level = min(rms / 32768, 1.0)  // normalize to 0-1 for 16-bit samples
```

### RecordingState

The application-wide recording state managed by Zustand in the Renderer.

| Field | Type | Description | Values |
|-------|------|-------------|--------|
| `status` | `'idle' \| 'recording' \| 'error'` | Current recording state | Extended from spec 001 (removed 'processing') |
| `audioLevel` | `number` | Current audio level from Main Process | 0.0 to 1.0 |

**State Transitions**:

```
idle ──startCapture──→ recording
recording ──stopCapture──→ idle
recording ──autoStop──→ idle
idle ──startError──→ error ──dismiss──→ idle
```

## Relationships

```
AudioCaptureSession (1) ──produces──→ Buffer (1)  // concatenated PCM on stop
MainProcess (1) ──sends IPC──→ Renderer (many)     // AudioLevel updates
Zustand Store (1) ──drives──→ RecordingOverlay (1)  // current state + level
```
