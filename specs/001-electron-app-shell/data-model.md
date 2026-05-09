# Data Model: Electron App Shell

## Recording State

The central entity driving the entire UI and behavior.

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `status` | Enum | `idle` / `recording` / `processing` | Current phase of the recording lifecycle |
| `transcriptText` | String | Any text | Mock or real transcribed text |
| `lastTransitionAt` | Timestamp | ISO 8601 | When the last state change occurred |

### State Transitions

```
idle ──startRecording()──→ recording
recording ──stopRecording()──→ processing
processing ──onProcessingComplete()──→ idle
processing ──onError()──→ idle
```

### Actions (Zustand Store)

| Action | From State | To State | Side Effect |
|--------|-----------|---------|-------------|
| `startRecording()` | idle | recording | Sends IPC event to main; updates tray icon |
| `stopRecording()` | recording | processing | Sends IPC event to main; simulates processing delay |
| `setTranscript(text)` | processing | processing | Stores mock/real text |
| `finishProcessing()` | processing | idle | Copies text to clipboard; hides overlay |
| `resetToIdle()` | any | idle | Error recovery or user cancel |

## IPC Messages (Main ↔ Renderer)

### Main → Renderer Events

| Channel | Payload | When |
|---------|---------|------|
| `recording:started` | `{}` | Global hotkey or tray menu triggered start |
| `recording:stopped` | `{}` | Global hotkey or tray menu triggered stop |
| `recording:state-changed` | `{ status: 'idle' \| 'recording' \| 'processing' }` | Any state change initiated by main |

### Renderer → Main Commands

| Channel | Payload | Description |
|---------|---------|-------------|
| `app:show-window` | `{}` | Request main window to show/focus |
| `app:quit` | `{}` | Request app termination |
| `clipboard:write` | `{ text: string }` | Write text to system clipboard |
