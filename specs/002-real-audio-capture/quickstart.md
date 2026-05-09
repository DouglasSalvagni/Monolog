# Quickstart: Real Audio Capture

**Phase**: Phase 1 — Design & Contracts
**Date**: 2026-05-09
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Node.js 24+
- npm
- Git (for cloning)
- Linux: `portaudio19-dev` recommended (optional — naudiodon bundles its own copy)
  ```bash
  sudo apt-get install portaudio19-dev
  ```

## Setup

```bash
# Clone and install dependencies
git checkout 002-real-audio-capture
npm install
```

naudiodon will compile its native addon via node-gyp during `npm install`.

## Running

```bash
npm run dev
```

## Manual Test Checklist

### Test 1: Audio Capture Works

1. Launch the app: `npm run dev`
2. Press `Alt+Shift+R` — overlay shows "Recording..." and VU meter moves when you speak
3. Say "Hello, this is a test" clearly
4. Press `Alt+Shift+R` again — recording stops
5. Check the DevTools console: you should see:
   - `[audio-capture] capture started` 
   - `[audio-capture] chunk received: <N> bytes` (repeated during recording)
   - `[audio-capture] capture stopped, total: <N> bytes`

### Test 2: VU Meter Response

1. Start recording
2. Speak at different volumes
3. Verify the VU meter in the overlay responds proportionally
4. Stop recording — VU meter should freeze at 0

### Test 3: No Microphone

1. Disconnect or disable your microphone
2. Start the app
3. Press `Alt+Shift+R` — overlay should show error message, NOT transition to recording state

### Test 4: Safety Limit

1. Start recording
2. Wait 10 minutes (or modify the limit temporarily to 10 seconds for testing)
3. Verify recording auto-stops with "Maximum recording time reached" message

### Test 5: Rapid Toggle

1. Press `Alt+Shift+R` rapidly multiple times
2. Verify 500ms debounce prevents state flickering
3. Verify final state is stable (idle or recording, not stuck mid-transition)

## Verification Script

To verify audio capture works without the full UI:

```bash
# Build and run with logging
npm run dev
# In DevTools console, run:
#   window.api.startCapture()
#   (speak)
#   window.api.stopCapture()
#   → Check console for buffer stats
```

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| `MODULE_NOT_FOUND: naudiodon` | Native addon not compiled | Rebuild: `npm rebuild naudiodon` |
| No audio captured | Default device not found | Check `getDevices()` output in console |
| VU meter stuck at 0 | Microphone muted or disconnected | Check system sound settings |
| App crashes on start | PortAudio conflict | Install `portaudio19-dev` and rebuild |
| High latency on VU meter | IPC overhead | Reduce update frequency or batch levels |
