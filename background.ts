// Background script to intercept network requests
import { getSettings, onSettingsChanged, saveSetting } from "./utils/storage"
import * as FirefoxNetworking from "./utils/firefox-network"
import * as ChromeNetworking from "./utils/chrome-network"

// Detect browser environment 
const isFirefox = typeof browser !== 'undefined';

// Network monitoring
let firefoxNetworking: any = null;
let chromeNetworking: any = null;
// Start paused by default
let isMonitoringActive = false;

// Load settings and initialize networking
getSettings(["maxRequests", "isMonitoringEnabled"], (result) => {
  const maxRequests = result.maxRequests || 1000;
  // Restore monitoring state
  isMonitoringActive = result.isMonitoringEnabled === undefined ? false : result.isMonitoringEnabled;
  
  console.log(`Initial monitoring state loaded: ${isMonitoringActive}`);
  
  // Initialize Firefox networking if in Firefox
  if (isFirefox) {
    console.log("Initializing Firefox-specific networking");
    firefoxNetworking = FirefoxNetworking.initFirefoxNetworking();
    
    // Configure Firefox network monitoring
    if (firefoxNetworking) {
      // Set max requests
      if (maxRequests) {
        firefoxNetworking.setMaxRequests(maxRequests);
        console.log(`Background: Set Firefox max requests to ${maxRequests}`);
      }
      
      // Start monitoring if previously enabled
      if (isMonitoringActive) {
        console.log("Resuming Firefox network monitoring");
        firefoxNetworking.startMonitoring();
      } else {
        console.log("Firefox network monitoring initially paused");
        firefoxNetworking.stopMonitoring();
      }
      
      // Re-save the monitoring state to ensure consistency
      saveSetting("isMonitoringEnabled", isMonitoringActive);
    }
  } 
  // Initialize Chrome networking if not in Firefox
  else {
    console.log("Initializing Chrome networking");
    chromeNetworking = ChromeNetworking.initChromeNetworking();
    
    // Configure Chrome network monitoring
    if (chromeNetworking) {
      // Set max requests
      if (maxRequests) {
        chromeNetworking.setMaxRequests(maxRequests);
        console.log(`Background: Set Chrome max requests to ${maxRequests}`);
      }
      
      // Start monitoring if previously enabled
      if (isMonitoringActive) {
        console.log("Resuming Chrome network monitoring");
        chromeNetworking.startMonitoring();
      } else {
        console.log("Chrome network monitoring initially paused");
        chromeNetworking.stopMonitoring();
      }
      
      // Re-save the monitoring state to ensure consistency
      saveSetting("isMonitoringEnabled", isMonitoringActive);
    }
  }
  
  // Listen for setting changes
  onSettingsChanged((changes) => {
    if (changes.maxRequests) {
      if (isFirefox && firefoxNetworking) {
        firefoxNetworking.setMaxRequests(changes.maxRequests.newValue);
        console.log(`Background: Updated Firefox max requests to ${changes.maxRequests.newValue}`);
      } else if (!isFirefox && chromeNetworking) {
        chromeNetworking.setMaxRequests(changes.maxRequests.newValue);
        console.log(`Background: Updated Chrome max requests to ${changes.maxRequests.newValue}`);
      }
    }
  });
});

// Listen for keyboard shortcut commands
if (isFirefox) {
  // Use type assertion to access Firefox-specific APIs
  const browserAPI = browser as any;
  
  if (browserAPI && browserAPI.commands) {
    browserAPI.commands.onCommand.addListener((command: string) => {
      if (command === "toggle-sidebar") {
        console.log("Toggling sidebar via keyboard shortcut");
        try {
          if (browserAPI.sidebarAction) {
            browserAPI.sidebarAction.toggle();
          }
        } catch (error) {
          console.error("Failed to toggle sidebar:", error);
        }
      }
    });
  }
}

// Connect to the port and send network requests
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sleuth-network") {
    console.log("Popup/panel connected");
    
    // Increment active connections
    let activeConnections = 0;
    activeConnections++;
    
    // Send monitoring state
    console.log(`Sending initial monitoring state to panel: ${isMonitoringActive}`);
    port.postMessage({ 
      type: "monitoringState", 
      isEnabled: isMonitoringActive 
    });
    
    // Send initial data
    if (isFirefox && firefoxNetworking) {
      console.log("Sending Firefox network data");
      port.postMessage({ 
        type: "networkRequests", 
        data: firefoxNetworking.getNetworkRequests() 
      });
    } else if (!isFirefox && chromeNetworking) {
      console.log("Sending Chrome network data");
      port.postMessage({ 
        type: "networkRequests", 
        data: chromeNetworking.getNetworkRequests() 
      });
    }
    
    // Set up interval to send updates
    const intervalId = setInterval(() => {
      if (isFirefox && firefoxNetworking) {
        port.postMessage({ 
          type: "networkRequests", 
          data: firefoxNetworking.getNetworkRequests() 
        });
      } else if (!isFirefox && chromeNetworking) {
        port.postMessage({ 
          type: "networkRequests", 
          data: chromeNetworking.getNetworkRequests() 
        });
      }
    }, 1000);
    
    // When popup/panel disconnects, clean up
    port.onDisconnect.addListener(() => {
      console.log("Popup/panel disconnected");
      clearInterval(intervalId);
      
      // Decrement active connections
      activeConnections--;
      
      // Ensure it never goes negative
      if (activeConnections < 0) {
        activeConnections = 0;
      }
    });
    
    // Handle messages from devtools
    port.onMessage.addListener((message) => {
      if (message.type === "clearNetworkRequests") {
        if (isFirefox && firefoxNetworking) {
          firefoxNetworking.clearNetworkRequests();
        } else if (!isFirefox && chromeNetworking) {
          chromeNetworking.clearNetworkRequests();
        }
      }
      else if (message.type === "startMonitoring") {
        if (isFirefox && firefoxNetworking) {
          firefoxNetworking.startMonitoring();
          isMonitoringActive = true;
        } else if (!isFirefox && chromeNetworking) {
          chromeNetworking.startMonitoring();
          isMonitoringActive = true;
        }
        
        // Save the monitoring state
        saveSetting("isMonitoringEnabled", true);
        
        // Notify all connected clients about the state change
        port.postMessage({ 
          type: "monitoringState", 
          isEnabled: true 
        });
      }
      else if (message.type === "pauseMonitoring") {
        if (isFirefox && firefoxNetworking) {
          firefoxNetworking.stopMonitoring();
          isMonitoringActive = false;
        } else if (!isFirefox && chromeNetworking) {
          chromeNetworking.stopMonitoring();
          isMonitoringActive = false;
        }
        
        // Save the monitoring state
        saveSetting("isMonitoringEnabled", false);
        
        // Notify all connected clients about the state change
        port.postMessage({ 
          type: "monitoringState", 
          isEnabled: false 
        });
      }
    });
  }
}); 