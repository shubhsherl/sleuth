import { useState, useEffect } from "react"
import { getSettings, saveSetting } from "./utils/storage"
import "./styles.css"
import NetworkPanel from "./tabs/network"

// Define minimum supported dimensions
const MIN_WIDTH = 350;  // px

function SidePanel() {
  const [settings, setSettings] = useState({
    enableShortcuts: true,
    showCurlShortcut: true,
    showAuthShortcut: true,
    showUrlShortcut: true,
    theme: "dark", // Default to dark theme
    maxRequests: 1000
  })
  const [activeTab, setActiveTab] = useState("network")
  const [width, setWidth] = useState(window.innerWidth);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 500);
  
  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setIsSmallScreen(window.innerWidth < 500);
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
      "maxRequests"
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
  
  // Toggle theme
  const toggleTheme = () => {
    const newTheme = settings.theme === "dark" ? "light" : "dark"
    handleSettingChange("theme", newTheme)
  }
  
  // Dark mode styles
  const isDark = settings.theme === "dark"
  const bgColor = isDark ? "#1e2130" : "#fff"
  const textColor = isDark ? "#fff" : "#333"
  const borderColor = isDark ? "#2d3348" : "#ddd"
  const headerBgColor = isDark ? "#1a1c28" : "#f5f5f5"
  const buttonBgActive = isDark ? "#2d3348" : "#fff"
  const buttonBgInactive = isDark ? "transparent" : "transparent"
  const buttonBorderActive = isDark ? "#4285F4" : "#4285F4"
  const inputBg = isDark ? "#2d3348" : "#fff"
  const sectionBg = isDark ? "#1a1c28" : "#f5f5f5"
  
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        minWidth: `${MIN_WIDTH}px`,
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
            backgroundColor: activeTab === "network" ? buttonBgActive : buttonBgInactive,
            border: "none",
            borderBottom: activeTab === "network" ? `2px solid ${buttonBorderActive}` : "none",
            cursor: "pointer",
            fontWeight: activeTab === "network" ? "bold" : "normal",
            color: textColor,
            flex: isSmallScreen ? "1 1 50%" : "0 0 auto",
            fontSize: isSmallScreen ? "14px" : "16px"
          }}
          onClick={() => setActiveTab("network")}>
          Network Inspector
        </button>
        
        <button 
          style={{
            padding: isSmallScreen ? "10px 12px" : "12px 16px",
            backgroundColor: activeTab === "settings" ? buttonBgActive : buttonBgInactive,
            border: "none",
            borderBottom: activeTab === "settings" ? `2px solid ${buttonBorderActive}` : "none",
            cursor: "pointer",
            fontWeight: activeTab === "settings" ? "bold" : "normal",
            color: textColor,
            flex: isSmallScreen ? "1 1 50%" : "0 0 auto",
            fontSize: isSmallScreen ? "14px" : "16px"
          }}
          onClick={() => setActiveTab("settings")}>
          Settings
        </button>
      </div>
      
      {/* Content area */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {activeTab === "network" && (
          <div style={{ height: "100%", position: "relative" }}>
            <NetworkPanel theme={settings.theme} />
          </div>
        )}
        
        {activeTab === "settings" && (
          <div style={{ padding: isSmallScreen ? "12px" : "16px", overflowY: "auto", height: "100%" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", color: textColor, fontSize: isSmallScreen ? "18px" : "20px" }}>
              Sleuth Settings
            </h2>
            
            {/* Shortcuts Section */}
            <div style={{ 
              marginBottom: "24px", 
              backgroundColor: sectionBg, 
              padding: isSmallScreen ? "12px" : "16px", 
              borderRadius: "6px",
              border: `1px solid ${borderColor}`
            }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: isSmallScreen ? "14px" : "16px", fontWeight: "600" }}>Shortcuts</h3>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", fontSize: isSmallScreen ? "13px" : "14px" }}>
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
                <div style={{ paddingLeft: isSmallScreen ? "16px" : "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", fontSize: isSmallScreen ? "13px" : "14px" }}>
                    <input
                      type="checkbox"
                      checked={settings.showCurlShortcut}
                      onChange={(e) => handleSettingChange("showCurlShortcut", e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    Show "Copy as cURL" shortcut
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", fontSize: isSmallScreen ? "13px" : "14px" }}>
                    <input
                      type="checkbox"
                      checked={settings.showAuthShortcut}
                      onChange={(e) => handleSettingChange("showAuthShortcut", e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    Show "Copy Auth Header" shortcut
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", fontSize: isSmallScreen ? "13px" : "14px" }}>
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
            <div style={{ 
              marginBottom: "24px", 
              backgroundColor: sectionBg, 
              padding: isSmallScreen ? "12px" : "16px", 
              borderRadius: "6px",
              border: `1px solid ${borderColor}`
            }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: isSmallScreen ? "14px" : "16px", fontWeight: "600" }}>Appearance</h3>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: isSmallScreen ? "13px" : "14px" }}>Theme:</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange("theme", e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: `1px solid ${borderColor}`,
                    borderRadius: "4px",
                    width: "100%",
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: isSmallScreen ? "13px" : "14px"
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>
            
            {/* Network Inspector Section */}
            <div style={{ 
              marginBottom: "24px", 
              backgroundColor: sectionBg, 
              padding: isSmallScreen ? "12px" : "16px", 
              borderRadius: "6px",
              border: `1px solid ${borderColor}`
            }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: isSmallScreen ? "14px" : "16px", fontWeight: "600" }}>Network Inspector</h3>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: isSmallScreen ? "13px" : "14px" }}>Maximum requests to store:</label>
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
                    width: "100%",
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: isSmallScreen ? "13px" : "14px"
                  }}
                />
              </div>
            </div>
            
            {/* GitHub Link */}
            <div style={{ marginBottom: "16px" }}>
              <a
                href="https://github.com/shubhsherl/sleuth"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 12px",
                  backgroundColor: isDark ? "#2d3348" : "#f5f5f5",
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  textDecoration: "none",
                  textAlign: "center",
                  fontSize: isSmallScreen ? "13px" : "14px",
                  display: "block"
                }}>
                View on GitHub
              </a>
            </div>
            
            <div style={{ marginTop: "16px", fontSize: isSmallScreen ? "11px" : "12px", color: isDark ? "#888" : "#888", textAlign: "center" }}>
              v0.0.2 &bull; Made with ❤️ by Shubham Singh
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SidePanel 