# Quickstart: Electron App Shell

## Prerequisites

- Node.js 24+
- npm 10+

## Setup

```bash
# 1. Scaffold the project
npm create @quick-start/electron@latest monolog -- --template react-ts

# 2. Enter project directory
cd monolog

# 3. Install dependencies
npm install

# 4. Add Zustand for state management
npm install zustand

# 5. Add Tailwind CSS v4
npm install -D tailwindcss @tailwindcss/vite
```

## Tailwind CSS Configuration

Edit `electron.vite.config.ts` — add `@tailwindcss/vite` to the renderer
plugins array:

```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [react(), tailwindcss()]
  }
})
```

Replace `src/renderer/src/index.html` contents with:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Monolog</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
```

Replace `src/renderer/src/assets/index.css` with:
```css
@import "tailwindcss";
```

## Development

```bash
npm run dev
```

This starts the Electron app with HMR.

## Project Structure

```
monolog/
├── src/
│   ├── main/            # Electron main process
│   │   ├── index.ts     # App entry, window creation
│   │   ├── tray.ts      # System tray icon + menu
│   │   └── shortcuts.ts # Global hotkey registration
│   ├── preload/         # Preload scripts
│   │   ├── index.ts     # Context bridge
│   │   └── index.d.ts   # Type declarations
│   └── renderer/        # React app
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   ├── RecordingOverlay.tsx
│       │   │   └── StatusIndicator.tsx
│       │   ├── store/
│       │   │   └── recordingStore.ts
│       │   └── assets/
│       │       ├── icon-idle.png
│       │       └── icon-recording.png
│       └── index.html
├── resources/           # Electron build resources
│   └── icon.png
├── electron.vite.config.ts
├── package.json
└── tsconfig.json
```

## First Milestone Checklist

- [ ] `npm run dev` launches the Electron window
- [ ] System tray icon appears
- [ ] Tray menu shows "Show/Hide" and "Quit"
- [ ] `Alt+Shift+R` toggles recording state
- [ ] Tray icon changes on recording state
- [ ] Overlay shows "Recording..." when active
- [ ] Overlay shows "Processing..." briefly
- [ ] Mock text is copied to clipboard
- [ ] Closing window keeps app in tray
- [ ] "Quit" from tray terminates app
