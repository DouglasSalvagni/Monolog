# Research: Electron App Shell

## 1. Project Scaffold: electron-vite

**Decision**: Use `npm create @quick-start/electron@latest` with
`--template react-ts` preset.

**Rationale**: electron-vite is the most popular and actively maintained
scaffold for Electron + Vite projects. It provides:
- Three-process architecture (main, preload, renderer) out of the box
- Hot Module Replacement (HMR) during development
- TypeScript Strict Mode pre-configured (matching constitution)
- Built-in build pipeline for production packaging

**Alternatives considered**:
- electron-forge with Vite plugin: more boilerplate, manual config
- Manual setup: maximum control but significantly more setup time

## 2. System Tray API

**Decision**: Use Electron's built-in `Tray` + `Menu` modules.

**Rationale**: The `Tray` API is cross-platform and handles both Linux
(libappindicator) and Windows natively. Key considerations:
- **Icons**: Must be 16x16 PNG on Linux; 16x16 or 32x32 ICO on Windows.
  Electron supports native `Image` with PNG, so a 16x16 PNG works across both.
- **Context menu**: `Menu.buildFromTemplate()` with "Show/Hide" and "Quit"
  items. On Linux, the menu may not show on all desktop environments — use
  `tray.setContextMenu()` and consider `tray.on('click')` as fallback.
- **State changes**: Swap icon via `tray.setImage(iconPath)` — pre-load both
  idle and recording icons as `NativeImage` for performance.

**Alternatives considered**:
- node-tray: third-party, not needed — Electron's built-in Tray suffices.
- Notification API (native OS notifications): suitable for alerts but not
  persistent status indication.

## 3. Global Shortcut: globalShortcut

**Decision**: Use Electron's `globalShortcut.register('Alt+Shift+R', callback)`.

**Rationale**: Electron's `globalShortcut` module is purpose-built for
registering system-wide keyboard shortcuts. Key considerations:
- Register in main process after `app.whenReady()`
- Unregister on `app.will-quit` to avoid leaving orphaned bindings
- `globalShortcut.isRegistered('Alt+Shift+R')` can detect conflicts
- Must distinguish between Linux (X11/Wayland) — Wayland may block global
  shortcuts. On Wayland, fall back to a custom solution or warn.

**Alternatives considered**:
- ioHook (node-global-key-listener): third-party native addon, more complex
  build, unnecessary when Electron's built-in works.

## 4. State Management: Zustand

**Decision**: Use Zustand for recording state management.

**Rationale**: As per constitution, Zustand is preferred over React Context
for lightness (~1KB gzipped vs Context's re-render overhead). The store will
manage:
- `status`: 'idle' | 'recording' | 'processing'
- `transcriptText`: string (mock text for this phase)
- Actions: `startRecording()`, `stopRecording()`, `setProcessing()`,
  `resetToIdle()`

Communication between Main (tray/shortcuts) and Renderer (React UI) happens
via Electron IPC, not directly through Zustand. The renderer subscribes to
IPC events from main and updates the Zustand store.

## 5. Tailwind CSS with electron-vite

**Decision**: Install Tailwind CSS 4 as a Vite plugin (`@tailwindcss/vite`).

**Rationale**: Tailwind v4 integrates as a Vite plugin with zero config —
just add to `electron.vite.config.ts`. The constitution mandates Tailwind
CSS for styling.

**Setup**:
```
npm install -D tailwindcss @tailwindcss/vite
```
Then add `@tailwindcss/vite` to the renderer's Vite config plugins.

## 6. Overlay Implementation

**Decision**: Use a separate frameless `BrowserWindow` for the overlay.

**Rationale**: A dedicated overlay window provides:
- Always-on-top positioning without stealing focus (`show: false` initially,
  then `showInactive()`)
- Transparency support (`transparent: true`, `frame: false`)
- Click-through option (`setIgnoreMouseEvents(true)`) if passthrough is needed
- Control over position, size, and auto-dismiss

**Alternatives considered**:
- HTML notification in tray: limited styling, no control over positioning
- OS-level notification (Notification API): non-persistent, dismissed by OS
- DevTools overlay: not visible to users

## 7. Clipboard Integration

**Decision**: Use `navigator.clipboard.writeText()` in the renderer.

**Rationale**: For this mock phase, the renderer has access to the Clipboard
API. In production with real audio data, clipboard writes should be
coordinated through the main process via IPC.

## 8. Packaging

**Decision**: Use electron-vite's built-in `electron-builder` integration for
production builds.

**Rationale**: electron-vite configures electron-builder automatically.
Targets per constitution: `.AppImage`/`.deb` (Linux), `.exe` (Windows).
Skipped in this phase — will be tested later.

## Summary of Key Decisions

| Topic | Choice | Why |
|-------|--------|-----|
| Scaffold | electron-vite react-ts | Built-in HMR, TS strict, three-process |
| Tray | Electron Tray + Menu | Cross-platform, native |
| Hotkey | electron globalShortcut | Built-in, no extra deps |
| State | Zustand | Lightweight, constitution mandate |
| Styling | Tailwind CSS v4 (Vite plugin) | Zero config, constitution mandate |
| Overlay | Frameless BrowserWindow | Full control, no focus steal |
| Clipboard | navigator.clipboard | Simple, sufficient for mock |
| Packaging | electron-builder (via electron-vite) | Pre-configured |
