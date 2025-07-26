import React from "react"
import type { PlasmoCSConfig } from "plasmo"

// This is needed for DevTools extensions
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Detect if we're in Firefox
const isFirefox = typeof browser !== 'undefined';

// Create a panel in DevTools when the extension is loaded
try {
  // Create main network panel
  chrome.devtools.panels.create(
    "Sleuth", // Panel title
    "/assets/icon.svg", // Icon path
    "tabs/network.html", // Path to the panel's HTML page
    (panel) => {
      console.log("Sleuth panel created successfully")
      
      // Add event listener to detect when panel is shown
      panel.onShown.addListener((window) => {
        console.log("Panel window shown", window)
      })
      
      // Add event listener to detect when panel is hidden
      panel.onHidden.addListener(() => {
        console.log("Panel window hidden")
      })
    }
  )
} catch (error) {
  console.error("Error creating Sleuth panel:", error)
}

// Plasmo expects a default export React component for devtools.tsx
function DevtoolsUI() {
  return <div style={{ display: "none" }} />
}

export default DevtoolsUI
