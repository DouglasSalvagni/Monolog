import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

export interface Settings {
  selectedDeviceId: number | null
}

const SETTINGS_PATH = join(app.getPath('userData'), 'settings.json')

const defaultSettings: Settings = {
  selectedDeviceId: null
}

export function loadSettings(): Settings {
  if (!existsSync(SETTINGS_PATH)) {
    return defaultSettings
  }
  try {
    const data = readFileSync(SETTINGS_PATH, 'utf-8')
    return { ...defaultSettings, ...JSON.parse(data) }
  } catch (err) {
    console.error('[settings] Error loading settings:', err)
    return defaultSettings
  }
}

export function saveSettings(settings: Settings): void {
  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
  } catch (err) {
    console.error('[settings] Error saving settings:', err)
  }
}
