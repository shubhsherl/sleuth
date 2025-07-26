import { useEffect, useState } from "react"
import { getSettings, saveSetting } from "./utils/storage"
import "./styles.css"

function OptionsPage() {
  const [settings, setSettings] = useState({
    enableShortcuts: true,
    showCurlShortcut: true,
    showAuthShortcut: true,
    showUrlShortcut: true,
    theme: "dark",
    maxRequests: 1000,
    inactivityTimeout: 10
  })
  
  // Load settings on component mount
  useEffect(() => {
    getSettings([
      "enableShortcuts",
      "showCurlShortcut",
      "showAuthShortcut",
      "showUrlShortcut",
      "theme",
      "maxRequests",
      "inactivityTimeout"
    ], (result) => {
      setSettings(result)
    })
  }, [])
  
  // Save settings on change
  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    saveSetting(key, value)
  }
  
  // Navigate to browser keyboard shortcuts page
  const openKeyboardShortcuts = () => {
    // For Firefox
    if (typeof browser !== 'undefined') {
      try {
        // Use type assertion to bypass TypeScript errors
        const browserAPI = browser as any;
        // Open about:addons page for managing extensions
        if (browserAPI.tabs && browserAPI.tabs.create) {
          browserAPI.tabs.create({
            url: "about:addons"
          }).then(() => {
            // Firefox doesn't allow direct navigation to the shortcuts page,
            // so we'll guide the user with a message
            alert("Navigate to 'Extensions and Themes', find Sleuth, click the gear icon, and select 'Manage Extension Shortcuts'");
          });
        } else {
          // Fallback if tabs API is not available
          window.open("about:addons", "_blank");
        }
      } catch (e) {
        console.error("Failed to open extension shortcuts page:", e);
        // Fallback to general about:addons page
        window.open("about:addons", "_blank");
      }
    } else {
      // For Chrome
      window.open("chrome://extensions/shortcuts", "_blank");
    }
  };
  
  // Determine theme-based styles
  const isDark = settings.theme === "dark" || 
                (settings.theme === "system" && 
                 window.matchMedia && 
                 window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  // Determine browser type
  const isFirefox = typeof browser !== 'undefined';
  
  return (
    <div className={`p-6 max-w-xl mx-auto shadow-md rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h1 className="text-2xl font-bold mb-6">Sleuth Settings</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Shortcuts</h2>
        
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableShortcuts}
              onChange={(e) => handleSettingChange("enableShortcuts", e.target.checked)}
              className="mr-2"
            />
            <span>Enable shortcuts for network requests</span>
          </label>
        </div>
        
        {settings.enableShortcuts && (
          <div className="pl-6 mb-3 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showCurlShortcut}
                onChange={(e) => handleSettingChange("showCurlShortcut", e.target.checked)}
                className="mr-2"
              />
              <span>Show "Copy as cURL" shortcut</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showAuthShortcut}
                onChange={(e) => handleSettingChange("showAuthShortcut", e.target.checked)}
                className="mr-2"
              />
              <span>Show "Copy Auth Header" shortcut</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showUrlShortcut}
                onChange={(e) => handleSettingChange("showUrlShortcut", e.target.checked)}
                className="mr-2"
              />
              <span>Show "Copy URL" shortcut</span>
            </label>
          </div>
        )}
      </div>
      
      {/* Keyboard Shortcuts section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h2>
        
        <div className="mb-4 p-4 border rounded bg-opacity-50 bg-gray-100 dark:bg-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Toggle sidebar (Firefox only)</span>
            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-sm font-mono">Alt+Shift+S</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Use this shortcut to quickly open or close the Sleuth sidebar in Firefox.
          </p>
          
          <button
            onClick={openKeyboardShortcuts}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Customize Keyboard Shortcuts
          </button>
        </div>
        
        {!isFirefox && (
          <div className="text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-100 dark:bg-amber-900 bg-opacity-50 rounded">
            Note: The toggle sidebar shortcut is only available in Firefox.
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Appearance</h2>
        
        <div className="mb-3">
          <label className="block mb-1">Theme:</label>
          <select
            value={settings.theme}
            onChange={(e) => handleSettingChange("theme", e.target.value)}
            className="px-3 py-2 border rounded w-full"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Network Inspector</h2>
        
        <div className="mb-3">
          <label className="block mb-1">Maximum requests to store:</label>
          <div className="flex items-center">
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={settings.maxRequests}
              onChange={(e) => handleSettingChange("maxRequests", parseInt(e.target.value))}
              className="flex-grow mr-3"
            />
            <input
              type="number"
              min="100"
              max="5000"
              value={settings.maxRequests}
              onChange={(e) => handleSettingChange("maxRequests", parseInt(e.target.value))}
              className="px-3 py-2 border rounded w-24 text-center"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Higher values may increase memory usage
          </p>
        </div>
        
        <div className="mb-3">
          <label className="block mb-1">Auto-pause after inactivity (minutes):</label>
          <div className="flex items-center">
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={settings.inactivityTimeout}
              onChange={(e) => handleSettingChange("inactivityTimeout", parseInt(e.target.value))}
              className="flex-grow mr-3"
            />
            <input
              type="number"
              min="1"
              max="60"
              value={settings.inactivityTimeout}
              onChange={(e) => handleSettingChange("inactivityTimeout", parseInt(e.target.value))}
              className="px-3 py-2 border rounded w-24 text-center"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring will pause after this many minutes of no active tab
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Sleuth v0.0.2</p>
        <p>Made with ❤️ by Shubham Singh</p>
      </div>
    </div>
  )
}

export default OptionsPage 