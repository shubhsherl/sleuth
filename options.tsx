import { useEffect, useState } from "react"
import "./styles.css"

function OptionsPage() {
  const [settings, setSettings] = useState({
    enableShortcuts: true,
    showCurlShortcut: true,
    showAuthShortcut: true,
    showUrlShortcut: true,
    theme: "light",
    maxRequests: 1000
  })
  
  // Load settings on component mount
  useEffect(() => {
    chrome.storage.sync.get([
      "enableShortcuts",
      "showCurlShortcut",
      "showAuthShortcut",
      "showUrlShortcut",
      "theme",
      "maxRequests"
    ], (result) => {
      setSettings({
        enableShortcuts: result.enableShortcuts ?? true,
        showCurlShortcut: result.showCurlShortcut ?? true,
        showAuthShortcut: result.showAuthShortcut ?? true,
        showUrlShortcut: result.showUrlShortcut ?? true,
        theme: result.theme ?? "light",
        maxRequests: result.maxRequests ?? 1000
      })
    })
  }, [])
  
  // Save settings on change
  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    chrome.storage.sync.set({ [key]: value })
  }
  
  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow-md rounded-lg">
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
          <input
            type="number"
            min="100"
            max="5000"
            value={settings.maxRequests}
            onChange={(e) => handleSettingChange("maxRequests", parseInt(e.target.value))}
            className="px-3 py-2 border rounded w-full"
          />
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Sleuth v0.0.1</p>
        <p>Made with ❤️ by Shubham Singh</p>
      </div>
    </div>
  )
}

export default OptionsPage 