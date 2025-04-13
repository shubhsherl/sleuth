import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import "../styles.css"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

// Define types
interface ShortcutSettings {
  enableShortcuts: boolean
  showCurlShortcut: boolean
  showAuthShortcut: boolean
  showUrlShortcut: boolean
}

interface RequestData {
  url: string
  method: string
  headers: Record<string, string>
  body?: any
}

const ShortcutOverlay = () => {
  const [settings, setSettings] = useState<ShortcutSettings>({
    enableShortcuts: true,
    showCurlShortcut: true,
    showAuthShortcut: true,
    showUrlShortcut: true
  })
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [currentRequest, setCurrentRequest] = useState<RequestData | null>(null)
  
  // Load settings on mount
  useEffect(() => {
    chrome.storage.sync.get([
      "enableShortcuts",
      "showCurlShortcut",
      "showAuthShortcut",
      "showUrlShortcut"
    ], (result) => {
      setSettings({
        enableShortcuts: result.enableShortcuts ?? true,
        showCurlShortcut: result.showCurlShortcut ?? true,
        showAuthShortcut: result.showAuthShortcut ?? true,
        showUrlShortcut: result.showUrlShortcut ?? true
      })
    })
    
    // Set up listeners for network requests
    window.addEventListener("fetch", handleFetchEvent, true)
    
    // Set up listeners for XMLHttpRequest
    const originalXhrOpen = XMLHttpRequest.prototype.open
    const originalXhrSend = XMLHttpRequest.prototype.send
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._inspectifyMethod = method
      this._inspectifyUrl = url
      this._inspectifyHeaders = {}
      
      return originalXhrOpen.apply(this, arguments as any)
    }
    
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
      this._inspectifyHeaders = this._inspectifyHeaders || {}
      this._inspectifyHeaders[name] = value
      return this.setRequestHeader(name, value)
    }
    
    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this
      
      // When a request is made, show the shortcut menu
      if (settings.enableShortcuts) {
        const requestData: RequestData = {
          url: xhr._inspectifyUrl,
          method: xhr._inspectifyMethod,
          headers: xhr._inspectifyHeaders || {},
          body: body
        }
        
        const mousePos = { x: window.event?.clientX || 0, y: window.event?.clientY || 0 }
        showShortcutMenu(requestData, mousePos)
      }
      
      return originalXhrSend.apply(this, arguments as any)
    }
    
    return () => {
      window.removeEventListener("fetch", handleFetchEvent, true)
      XMLHttpRequest.prototype.open = originalXhrOpen
      XMLHttpRequest.prototype.send = originalXhrSend
    }
  }, [settings])
  
  // Handle fetch events
  const handleFetchEvent = (event: Event) => {
    if (!settings.enableShortcuts) return
    
    // Get the fetch call details
    const fetchCall = event.target as any
    if (!fetchCall || !fetchCall.url) return
    
    const requestData: RequestData = {
      url: fetchCall.url,
      method: fetchCall.method || "GET",
      headers: {},
    }
    
    const mousePos = { x: window.event?.clientX || 0, y: window.event?.clientY || 0 }
    showShortcutMenu(requestData, mousePos)
  }
  
  // Show the shortcut menu
  const showShortcutMenu = (requestData: RequestData, mousePos: { x: number, y: number }) => {
    setCurrentRequest(requestData)
    setPosition(mousePos)
    setVisible(true)
    
    // Hide menu after 3 seconds
    setTimeout(() => {
      setVisible(false)
    }, 3000)
  }
  
  // Copy as cURL
  const copyAsCurl = () => {
    if (!currentRequest) return
    
    let curlCommand = `curl -X ${currentRequest.method} '${currentRequest.url}'`
    
    // Add headers
    Object.entries(currentRequest.headers).forEach(([name, value]) => {
      curlCommand += ` -H '${name}: ${value}'`
    })
    
    // Add request body if it exists
    if (currentRequest.body && currentRequest.method !== "GET") {
      curlCommand += ` -d '${JSON.stringify(currentRequest.body)}'`
    }
    
    navigator.clipboard.writeText(curlCommand)
    showCopiedMessage("cURL command copied")
  }
  
  // Copy URL
  const copyUrl = () => {
    if (!currentRequest) return
    
    navigator.clipboard.writeText(currentRequest.url)
    showCopiedMessage("URL copied")
  }
  
  // Copy auth header
  const copyAuthHeader = () => {
    if (!currentRequest) return
    
    const authHeader = Object.entries(currentRequest.headers).find(
      ([name]) => name.toLowerCase() === "authorization"
    )
    
    if (authHeader) {
      navigator.clipboard.writeText(`${authHeader[0]}: ${authHeader[1]}`)
      showCopiedMessage("Auth header copied")
    } else {
      showCopiedMessage("No auth header found")
    }
  }
  
  // Show copied message
  const showCopiedMessage = (message: string) => {
    // Flash a notification
    const notification = document.createElement("div")
    notification.textContent = message
    notification.style.position = "fixed"
    notification.style.top = "20px"
    notification.style.right = "20px"
    notification.style.padding = "10px 15px"
    notification.style.background = "#4CAF50"
    notification.style.color = "white"
    notification.style.borderRadius = "4px"
    notification.style.zIndex = "9999"
    notification.style.opacity = "0"
    notification.style.transition = "opacity 0.3s"
    
    document.body.appendChild(notification)
    
    // Fade in
    setTimeout(() => {
      notification.style.opacity = "1"
    }, 10)
    
    // Fade out and remove
    setTimeout(() => {
      notification.style.opacity = "0"
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 2000)
  }
  
  if (!settings.enableShortcuts || !visible) return null
  
  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 9999,
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        padding: "8px 0",
        minWidth: "150px"
      }}>
      {settings.showCurlShortcut && (
        <button
          onClick={copyAsCurl}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 16px",
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer"
          }}>
          Copy as cURL
        </button>
      )}
      
      {settings.showAuthShortcut && (
        <button
          onClick={copyAuthHeader}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 16px",
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer"
          }}>
          Copy Auth Header
        </button>
      )}
      
      {settings.showUrlShortcut && (
        <button
          onClick={copyUrl}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 16px",
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer"
          }}>
          Copy URL
        </button>
      )}
    </div>
  )
}

export default ShortcutOverlay 