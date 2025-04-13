import React, { useEffect, useState } from "react"
import NetworkPanel from "./network"
import "../styles.css"

// This becomes the entry point for the network.html page
function NetworkPanelPage() {
  const [theme, setTheme] = useState("system")
  
  // Load theme setting
  useEffect(() => {
    chrome.storage.sync.get(["theme"], (result) => {
      setTheme(result.theme || "system")
    })
  }, [])
  
  return <NetworkPanel theme={theme} />
}

export default NetworkPanelPage 