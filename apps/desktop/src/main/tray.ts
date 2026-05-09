import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import { toggleRecording } from './recording'
import { isRecording } from './audio-capture'
import iconIdle from '../renderer/src/assets/icon-idle.png?asset'
import iconRecording from '../renderer/src/assets/icon-recording.png?asset'

let tray: Tray | null = null

function createTrayIcon(source: string): Electron.NativeImage {
  const icon = nativeImage.createFromPath(source)
  return icon.resize({ width: 16, height: 16 })
}

const icons = {
  idle: createTrayIcon(iconIdle),
  recording: createTrayIcon(iconRecording)
}

function createContextMenu(): Menu {
  const recording = isRecording()

  return Menu.buildFromTemplate([
    {
      label: recording ? '⏹ Stop Recording' : '⏺ Toggle Recording',
      click: (): void => {
        toggleRecording()
      }
    },
    { type: 'separator' },
    {
      label: 'Show/Hide',
      click: (): void => {
        const wins = BrowserWindow.getAllWindows()
        if (wins.length > 0) {
          const win = wins[0]
          if (win.isVisible()) {
            win.hide()
          } else {
            win.show()
            win.focus()
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: (): void => {
        app.quit()
      }
    }
  ])
}

export function createTray(): Tray | null {
  try {
    tray = new Tray(icons.idle)
    tray.setToolTip('Monolog — Idle')
    tray.setContextMenu(createContextMenu())

    tray.on('click', () => {
      toggleRecording()
    })

    console.log('[tray] created successfully')
    return tray
  } catch (err) {
    console.error('[tray] failed to create tray:', err)
    return null
  }
}

export function updateTrayMenu(): void {
  try {
    if (tray) {
      tray.setContextMenu(createContextMenu())
    }
  } catch (err) {
    console.error('[tray] failed to update menu:', err)
  }
}

export function setTrayIdle(): void {
  try {
    if (tray) {
      tray.setImage(icons.idle)
      tray.setToolTip('Monolog — Idle')
      updateTrayMenu()
    }
  } catch (err) {
    console.error('[tray] setTrayIdle failed:', err)
  }
}

export function setTrayRecording(): void {
  try {
    if (tray) {
      tray.setImage(icons.recording)
      tray.setToolTip('Monolog — Recording')
      updateTrayMenu()
    }
  } catch (err) {
    console.error('[tray] setTrayRecording failed:', err)
  }
}

export function destroyTray(): void {
  try {
    if (tray) {
      tray.destroy()
      tray = null
    }
  } catch (err) {
    console.error('[tray] destroyTray failed:', err)
  }
}
