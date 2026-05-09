import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

import { app, shell, BrowserWindow, ipcMain, clipboard } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createTray, setTrayIdle, destroyTray } from './tray'
import { registerShortcuts, unregisterShortcuts } from './shortcuts'
import { setMainWindow, resetRecording, toggleRecording, initRecording } from './recording'
import { initSupabase, signUp, signIn, signOut, restoreSession, onAuthChange } from './supabase'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  setMainWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.on('app:show-window', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  ipcMain.on('app:quit', () => {
    isQuitting = true
    app.quit()
  })

  ipcMain.on('clipboard:write', (_event, { text }: { text: string }) => {
    clipboard.writeText(text)
  })

  ipcMain.on('recording:toggle', () => {
    console.log('[main] received recording:toggle from renderer')
    toggleRecording()
  })

  ipcMain.on('audio:start-capture', () => {
    console.log('[main] received audio:start-capture')
    toggleRecording()
  })

  ipcMain.on('audio:stop-capture', () => {
    console.log('[main] received audio:stop-capture')
    toggleRecording()
  })

  ipcMain.handle('auth:login', async (_event, { email, password }: { email: string; password: string }) => {
    return signIn(email, password)
  })

  ipcMain.handle('auth:signup', async (_event, { email, password }: { email: string; password: string }) => {
    return signUp(email, password)
  })

  ipcMain.handle('auth:logout', async () => {
    await signOut()
  })

  ipcMain.handle('auth:restore-session', async () => {
    const user = await restoreSession()
    return user ? { id: user.id, email: user.email || '' } : null
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.monolog')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()

  const apiKey = process.env['DEEPGRAM_API_KEY']
  if (!apiKey) {
    console.warn('[main] DEEPGRAM_API_KEY not set — transcription disabled')
  }

  const llmKey = process.env['OPENAI_API_KEY']
  const llmBase = process.env['OPENAI_BASE_URL']
  const llmModel = process.env['OPENAI_MODEL']

  initRecording(apiKey || '', {
    apiKey: llmKey || '',
    baseUrl: llmBase || undefined,
    model: llmModel || undefined
  })

  const supabaseUrl = process.env['SUPABASE_URL']
  const supabaseAnonKey = process.env['SUPABASE_ANON_KEY']
  if (supabaseUrl && supabaseAnonKey) {
    initSupabase(supabaseUrl, supabaseAnonKey)
    console.log('[main] Supabase initialized')

    onAuthChange((user) => {
      const payload = user ? { id: user.id, email: user.email || '' } : null
      mainWindow?.webContents.send('auth:state-changed', payload)
    })
  } else {
    console.warn('[main] SUPABASE_URL or SUPABASE_ANON_KEY not set — backend features disabled')
  }

  createWindow()
  createTray()
  setTrayIdle()
  registerShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  // Keep running in tray — don't quit on window close
})

app.on('before-quit', () => {
  isQuitting = true
  resetRecording()
  unregisterShortcuts()
  destroyTray()
})
