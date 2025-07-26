import { useState, useEffect } from "react"
import { getSettings, saveSetting } from "./utils/storage"
import "./styles.css"
import NetworkPanel from "./tabs/network"

// Define minimum supported dimensions
const MIN_WIDTH = 350;  // px
const MIN_HEIGHT = 500; // px

function IndexPopup() {
  const [settings, setSettings] = useState({
    enableShortcuts: true,
    showCurlShortcut: true,
    showAuthShortcut: true,
    showUrlShortcut: true,
    theme: "dark",
    maxRequests: 1000,
    inactivityTimeout: 10
  })
  const [activeTab, setActiveTab] = useState("network")
  const [width, setWidth] = useState(window.innerWidth);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 600);
  
  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setIsSmallScreen(window.innerWidth < 600);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
  
  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    saveSetting(key, value)
  }
  
  // Determine theme-based styles
  const isDark = settings.theme === "dark" || 
                (settings.theme === "system" && 
                 window.matchMedia && 
                 window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  // Theme colors
  const bgColor = isDark ? "#1e2130" : "#fff"
  const textColor = isDark ? "#e9ecef" : "#333"
  const headerBgColor = isDark ? "#1a1c28" : "#f5f5f5"
  const borderColor = isDark ? "#4a5568" : "#ddd"
  const cardBg = isDark ? "#242a38" : "#fff"
  const inputBg = isDark ? "#2d3348" : "#fff"
  const buttonBg = isDark ? "#2d3348" : "#e9ecef"
  const linkBg = isDark ? "#242a38" : "#f5f5f5"
  
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minWidth: `${MIN_WIDTH}px`,
        minHeight: `${MIN_HEIGHT}px`,
        padding: "0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: bgColor,
        color: textColor
      }}>
      {/* Header with tabs */}
      <div style={{ 
        display: "flex", 
        borderBottom: `1px solid ${borderColor}`,
        backgroundColor: headerBgColor,
        flexWrap: isSmallScreen ? "wrap" : "nowrap"
      }}>
        <button 
          style={{
            padding: isSmallScreen ? "10px 12px" : "12px 16px",
            backgroundColor: activeTab === "network" ? bgColor : "transparent",
            border: "none",
            borderBottom: activeTab === "network" ? "2px solid #4285F4" : "none",
            cursor: "pointer",
            fontWeight: activeTab === "network" ? "bold" : "normal",
            color: textColor,
            flex: isSmallScreen ? "1 1 50%" : "0 0 auto"
          }}
          onClick={() => setActiveTab("network")}>
          Network Inspector
        </button>
        
        <button 
          style={{
            padding: isSmallScreen ? "10px 12px" : "12px 16px",
            backgroundColor: activeTab === "settings" ? bgColor : "transparent",
            border: "none",
            borderBottom: activeTab === "settings" ? "2px solid #4285F4" : "none",
            cursor: "pointer",
            fontWeight: activeTab === "settings" ? "bold" : "normal",
            color: textColor,
            flex: isSmallScreen ? "1 1 50%" : "0 0 auto"
          }}
          onClick={() => setActiveTab("settings")}>
          Settings
        </button>
      </div>
      
      {/* Content area */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeTab === "network" && (
          <div style={{ height: "100%" }}>
            <NetworkPanel 
              theme={settings.theme} 
              enableShortcuts={settings.enableShortcuts}
              showCurlShortcut={settings.showCurlShortcut}
              showAuthShortcut={settings.showAuthShortcut}
              showUrlShortcut={settings.showUrlShortcut}
            />
          </div>
        )}
        
        {activeTab === "settings" && (
          <div style={{ padding: "16px", backgroundColor: bgColor, color: textColor }}>
            <h2 style={{ marginTop: 0, color: textColor, marginBottom: "16px" }}>
              Sleuth Settings
            </h2>
            
            {/* Shortcuts Section */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: textColor }}>Shortcuts</h3>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={settings.enableShortcuts}
                    onChange={(e) => handleSettingChange("enableShortcuts", e.target.checked)}
                    style={{ marginRight: "8px" }}
                  />
                  Enable shortcuts for network requests
                </label>
              </div>
              
              {settings.enableShortcuts && (
                <div style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", fontSize: "14px" }}>
                    <input
                      type="checkbox"
                      checked={settings.showCurlShortcut}
                      onChange={(e) => handleSettingChange("showCurlShortcut", e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    Show "Copy as cURL" shortcut
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", fontSize: "14px" }}>
                    <input
                      type="checkbox"
                      checked={settings.showAuthShortcut}
                      onChange={(e) => handleSettingChange("showAuthShortcut", e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    Show "Copy Auth Header" shortcut
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", fontSize: "14px" }}>
                    <input
                      type="checkbox"
                      checked={settings.showUrlShortcut}
                      onChange={(e) => handleSettingChange("showUrlShortcut", e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    Show "Copy URL" shortcut
                  </label>
                </div>
              )}
            </div>
            
            {/* Appearance Section */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: textColor }}>Appearance</h3>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Theme:</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange("theme", e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: `1px solid ${borderColor}`,
                    borderRadius: "4px",
                    width: "100%",
                    fontSize: "14px",
                    backgroundColor: inputBg,
                    color: textColor
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>
            
            {/* Network Inspector Section */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: textColor }}>Network Inspector</h3>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Maximum requests to store:</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={settings.maxRequests}
                    onChange={(e) => handleSettingChange("maxRequests", parseInt(e.target.value))}
                    style={{
                      flex: "1",
                      accentColor: isDark ? "#4285F4" : "#4285F4"
                    }}
                  />
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={settings.maxRequests}
                    onChange={(e) => handleSettingChange("maxRequests", parseInt(e.target.value))}
                    style={{
                      padding: "8px 12px",
                      border: `1px solid ${borderColor}`,
                      borderRadius: "4px",
                      width: "80px",
                      fontSize: "14px",
                      backgroundColor: inputBg,
                      color: textColor,
                      textAlign: "center"
                    }}
                  />
                </div>
                <p style={{ 
                  fontSize: "12px", 
                  color: isDark ? "#adb5bd" : "#888", 
                  marginTop: "4px",
                  marginBottom: "0"
                }}>
                  Higher values may increase memory usage
                </p>
              </div>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
                  Auto-pause after inactivity (minutes):
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={settings.inactivityTimeout}
                    onChange={(e) => handleSettingChange("inactivityTimeout", parseInt(e.target.value))}
                    style={{
                      flex: "1",
                      accentColor: isDark ? "#4285F4" : "#4285F4"
                    }}
                  />
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.inactivityTimeout}
                    onChange={(e) => handleSettingChange("inactivityTimeout", parseInt(e.target.value))}
                    style={{
                      padding: "8px 12px",
                      border: `1px solid ${borderColor}`,
                      borderRadius: "4px",
                      width: "60px",
                      fontSize: "14px",
                      backgroundColor: inputBg,
                      color: textColor,
                      textAlign: "center"
                    }}
                  />
                </div>
                <p style={{ 
                  fontSize: "12px", 
                  color: isDark ? "#adb5bd" : "#888", 
                  marginTop: "4px",
                  marginBottom: "0"
                }}>
                  Monitoring will pause after this many minutes of no active tab
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "24px" }}>
              <a
                href="https://github.com/shubhsherl/sleuth"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 12px",
                  backgroundColor: linkBg,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  textDecoration: "none",
                  textAlign: "center",
                  fontSize: "14px"
                }}>
                View on GitHub
              </a>
            </div>
            
            <div style={{ marginTop: "24px", fontSize: "12px", color: isDark ? "#adb5bd" : "#888", textAlign: "center" }}>
              Sleuth v0.0.1 &bull; Made with ❤️ by Shubham Singh
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IndexPopup
