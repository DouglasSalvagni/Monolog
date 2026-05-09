# IPC Contracts: Electron App Shell

## Overview

This document defines the IPC (Inter-Process Communication) contract
between the Electron Main Process and the Renderer Process.

## Channels

### `recording:started`

**Direction**: Main → Renderer  
**Payload**: `void`

Fired when the user triggers recording via global hotkey or tray menu.

---

### `recording:stopped`

**Direction**: Main → Renderer  
**Payload**: `void`

Fired when the user stops recording via global hotkey or tray menu.

---

### `recording:state-changed`

**Direction**: Main → Renderer  
**Payload**:
```typescript
interface StateChangedPayload {
  status: 'idle' | 'recording' | 'processing';
}
```

Fired on every state transition to keep the renderer UI in sync.

---

### `app:show-window`

**Direction**: Renderer → Main  
**Payload**: `void`

Requests the main BrowserWindow to be shown and focused.

---

### `app:quit`

**Direction**: Renderer → Main  
**Payload**: `void`

Requests graceful application termination.

---

### `clipboard:write`

**Direction**: Renderer → Main  
**Payload**:
```typescript
interface ClipboardWritePayload {
  text: string;
}
```

Writes text to the system clipboard. Centralized in main process for
production readiness (in mock phase, renderer uses `navigator.clipboard`
directly).
