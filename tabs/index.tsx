import React from "react"
import { createRoot } from "react-dom/client"
import NetworkPanel from "./network"
import "../styles.css"

// This is the entry point for the DevTools panel
// It's automatically associated with network.html by Plasmo

document.addEventListener("DOMContentLoaded", () => {
  console.log("Sleuth network panel loading...")
  
  const rootElement = document.getElementById("root")
  if (!rootElement) {
    console.error("Root element not found")
    return
  }
  
  const root = createRoot(rootElement)
  root.render(<NetworkPanel />)
})

// This file should export a component that will be rendered in the sidebar
const IndexPanel = () => {
  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-4">Sleuth</h1>
      <p>This is a placeholder for the sidebar panel content.</p>
      <p>You can add links, controls, or other content here.</p>
    </div>
  )
}

export default IndexPanel 