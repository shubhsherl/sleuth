/**
 * Cross-browser storage utility to handle differences between Chrome and Firefox
 */

// Default settings
const DEFAULT_SETTINGS = {
  enableShortcuts: true,
  showCurlShortcut: true,
  showAuthShortcut: true,
  showUrlShortcut: true,
  theme: "dark",
  maxRequests: 1000,
  inactivityTimeout: 10,
  isMonitoringEnabled: false
};

// Determine if we're running in Firefox
const isFirefox = typeof browser !== 'undefined';

/**
 * Gets the appropriate storage area based on browser
 * Firefox uses browser.storage.local while Chrome can use chrome.storage.sync
 */
function getStorageArea() {
  // Check if we're in Firefox
  if (isFirefox && browser.storage) {
    return browser.storage.local;
  }
  // Fall back to Chrome's sync storage
  return chrome.storage.sync;
}

/**
 * Get settings from storage with cross-browser support
 * @param keys Array of setting keys to retrieve
 * @param callback Function to call with the result
 */
export function getSettings(keys: string[], callback: (result: any) => void) {
  const storage = getStorageArea();
  
  try {
    if (isFirefox) {
      // Firefox uses promises
      browser.storage.local.get(keys)
        .then((result) => {
          // Apply defaults for any missing settings
          const settings: Record<string, any> = {};
          
          for (const key of keys) {
            settings[key] = result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key];
          }
          
          callback(settings);
        })
        .catch((error) => {
          console.error("Error retrieving settings:", error);
          // Fall back to defaults
          const settings: Record<string, any> = {};
          for (const key of keys) {
            settings[key] = DEFAULT_SETTINGS[key];
          }
          callback(settings);
        });
    } else {
      // Chrome uses callbacks
      chrome.storage.sync.get(keys, (result) => {
        // Apply defaults for any missing settings
        const settings: Record<string, any> = {};
        
        for (const key of keys) {
          settings[key] = result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key];
        }
        
        callback(settings);
      });
    }
  } catch (error) {
    console.error("Error accessing storage:", error);
    // Fall back to defaults on error
    const settings: Record<string, any> = {};
    for (const key of keys) {
      settings[key] = DEFAULT_SETTINGS[key];
    }
    callback(settings);
  }
}

/**
 * Save a setting with cross-browser support
 * @param key Setting key
 * @param value Setting value
 * @param callback Optional callback when setting is saved
 */
export function saveSetting(key: string, value: any, callback?: () => void) {
  try {
    if (isFirefox) {
      // Firefox uses promises
      browser.storage.local.set({ [key]: value })
        .then(() => {
          if (callback) {
            callback();
          }
        })
        .catch((error) => {
          console.error("Error saving setting:", error);
        });
    } else {
      // Chrome uses callbacks
      chrome.storage.sync.set({ [key]: value }, () => {
        if (callback) {
          callback();
        }
      });
    }
  } catch (error) {
    console.error("Error saving setting:", error);
  }
}

/**
 * Get all settings at once with defaults applied
 * @param callback Function to call with all settings
 */
export function getAllSettings(callback: (settings: any) => void) {
  getSettings(Object.keys(DEFAULT_SETTINGS), callback);
}

/**
 * Listen for storage changes
 * @param callback Function to call when storage changes
 */
export function onSettingsChanged(callback: (changes: Record<string, any>) => void) {
  // The onChanged API is the same in both Chrome and Firefox
  chrome.storage.onChanged.addListener(callback);
} 