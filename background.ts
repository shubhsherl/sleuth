// Background script to intercept network requests
import type { PlasmoMessaging } from "@plasmohq/messaging"

// Store to keep track of requests and responses
interface RequestData {
  id: string
  url: string
  method: string
  requestHeaders?: chrome.webRequest.HttpHeader[]
  requestBody?: any
  status?: number
  statusText?: string
  responseHeaders?: chrome.webRequest.HttpHeader[]
  responseBody?: string
  contentType?: string
  startTime: number
  endTime?: number
  size?: number
  initiator?: string
  type?: string
  error?: string
}

// In-memory storage for network requests
const networkRequests: Record<string, RequestData> = {}
let maxRequestsToStore = 1000;

// Track if debugger is attached to a tab
const debuggerAttached: Record<number, boolean> = {}

// Check if debugger API is available
const hasDebuggerAPI = typeof chrome.debugger !== 'undefined';

// Log status of APIs
console.log("WebRequest API available:", typeof chrome.webRequest !== 'undefined');
console.log("Debugger API available:", hasDebuggerAPI);

// Load settings
chrome.storage.sync.get(["maxRequests"], (result) => {
  if (result.maxRequests) {
    maxRequestsToStore = result.maxRequests;
  }
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.maxRequests) {
    maxRequestsToStore = changes.maxRequests.newValue;
  }
});

// Function to attach debugger to a tab
async function attachDebugger(tabId: number) {
  // Skip if debugger API is not available
  if (!hasDebuggerAPI) return;
  
  if (debuggerAttached[tabId]) return;
  
  try {
    await chrome.debugger.attach({ tabId }, "1.0");
    await chrome.debugger.sendCommand({ tabId }, "Network.enable");
    debuggerAttached[tabId] = true;
    
    console.log(`Debugger attached to tab ${tabId}`);
  } catch (error) {
    console.error(`Failed to attach debugger to tab ${tabId}:`, error);
  }
}

// Process request body data
function processRequestBody(body: chrome.webRequest.WebRequestBodyDetails): any {
  if (!body) return undefined;
  
  if (body.formData) {
    return body.formData;
  } else if (body.raw) {
    try {
      // Attempt to combine raw data into a string
      const decoder = new TextDecoder("utf-8");
      const rawData = body.raw.map(dataElement => {
        if (dataElement.bytes) {
          return decoder.decode(dataElement.bytes);
        }
        return "";
      }).join("");
      
      // Try to parse as JSON
      try {
        return JSON.parse(rawData);
      } catch {
        return rawData;
      }
    } catch (e) {
      return "Unable to decode request body";
    }
  }
  
  return undefined;
}

// Listen for web requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { requestId, url, method, timeStamp, type, initiator, tabId } = details
    
    // Ensure debugger is attached for this tab (for response bodies)
    if (tabId > 0 && hasDebuggerAPI) {
      attachDebugger(tabId);
    }
    
    networkRequests[requestId] = {
      id: requestId,
      url,
      method,
      startTime: timeStamp,
      type,
      initiator
    }
    
    // Store request body if available and not a GET request
    // Note: We explicitly handle all methods including PATCH
    if (details.requestBody && method !== 'GET') {
      networkRequests[requestId].requestBody = processRequestBody(details.requestBody);
    }
    
    return { cancel: false }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
)

// Capture request headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const { requestId, requestHeaders } = details
    
    if (networkRequests[requestId]) {
      networkRequests[requestId].requestHeaders = requestHeaders
    }
    
    return { requestHeaders }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders", "extraHeaders"]
)

// Capture response data
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const { requestId, responseHeaders, statusCode, statusLine, type } = details
    
    if (networkRequests[requestId]) {
      networkRequests[requestId].responseHeaders = responseHeaders
      networkRequests[requestId].status = statusCode
      networkRequests[requestId].statusText = statusLine
      
      // Determine content type from headers
      const contentTypeHeader = responseHeaders?.find(
        (header) => header.name.toLowerCase() === "content-type"
      )
      if (contentTypeHeader) {
        networkRequests[requestId].contentType = contentTypeHeader.value
      }
      
      // Calculate size from Content-Length header if available
      const contentLengthHeader = responseHeaders?.find(
        (header) => header.name.toLowerCase() === "content-length"
      )
      if (contentLengthHeader && contentLengthHeader.value) {
        networkRequests[requestId].size = parseInt(contentLengthHeader.value, 10);
      }
    }
    
    return { responseHeaders }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders", "extraHeaders"]
)

// Mark request as completed
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const { requestId, timeStamp } = details
    
    if (networkRequests[requestId]) {
      networkRequests[requestId].endTime = timeStamp
      
      // Clean up older requests
      const requestIds = Object.keys(networkRequests)
      if (requestIds.length > maxRequestsToStore) {
        // Sort by time and remove oldest entries
        const sortedIds = requestIds
          .map(id => ({ id, time: networkRequests[id].startTime }))
          .sort((a, b) => a.time - b.time)
          .map(item => item.id);
          
        const idsToRemove = sortedIds.slice(0, requestIds.length - maxRequestsToStore);
        idsToRemove.forEach(id => delete networkRequests[id]);
      }
    }
  },
  { urls: ["<all_urls>"] }
)

// Handle request errors
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    const { requestId, timeStamp, error } = details
    
    if (networkRequests[requestId]) {
      networkRequests[requestId].endTime = timeStamp
      networkRequests[requestId].error = error
    }
  },
  { urls: ["<all_urls>"] }
)

// Only set up debugger events if the API is available
if (hasDebuggerAPI) {
  // First make sure onEvent exists
  if (chrome.debugger.onEvent) {
    // Listen for Network events from the debugger
    chrome.debugger.onEvent.addListener((debuggeeId, method, params) => {
      if (method === "Network.responseReceived") {
        const { requestId, response } = params;
        
        // Match debugger requestId with our requestId
        // Note: The format might be different, so we need to find the matching request
        const matchingRequestId = Object.keys(networkRequests).find(id => {
          const req = networkRequests[id];
          return req.url === response.url && 
                req.status === response.status &&
                (!req.endTime || Date.now() - req.endTime < 5000); // Within the last 5 seconds
        });
        
        if (matchingRequestId) {
          // Update content type and size from debugger data
          networkRequests[matchingRequestId].contentType = response.mimeType;
          networkRequests[matchingRequestId].size = response.encodedDataLength;
          
          // Request response body if it's a text-based content type
          const contentType = response.mimeType.toLowerCase();
          if (contentType.includes("json") || 
              contentType.includes("text") || 
              contentType.includes("javascript") || 
              contentType.includes("xml") ||
              contentType.includes("html") ||
              contentType.includes("css")) {
            
            chrome.debugger.sendCommand(
              debuggeeId,
              "Network.getResponseBody",
              { requestId: requestId },
              (response) => {
                if (response && response.body) {
                  if (matchingRequestId && networkRequests[matchingRequestId]) {
                    networkRequests[matchingRequestId].responseBody = response.body;
                  }
                }
              }
            );
          }
        }
      }
      
      // Handle request intercepted for all HTTP methods including PATCH
      else if (method === "Network.requestWillBeSent") {
        const { requestId, request } = params;
        
        // Find matching request
        const matchingRequestId = Object.keys(networkRequests).find(id => {
          const req = networkRequests[id];
          return req.url === request.url && 
                req.method === request.method &&
                Math.abs(Date.now() - req.startTime) < 5000; // Within the last 5 seconds
        });
        
        // If we found a match and the request has a body (like in PATCH requests)
        if (matchingRequestId && request.postData && !networkRequests[matchingRequestId].requestBody) {
          try {
            // Try to parse as JSON first
            networkRequests[matchingRequestId].requestBody = JSON.parse(request.postData);
          } catch {
            // If not valid JSON, store as raw text
            networkRequests[matchingRequestId].requestBody = request.postData;
          }
        }
      }
    });
  }

  // Only set up detach listener if onDetach exists
  if (chrome.debugger.onDetach) {
    // Handle debugger detaching
    chrome.debugger.onDetach.addListener((debuggeeId) => {
      if (debuggeeId.tabId) {
        debuggerAttached[debuggeeId.tabId] = false;
      }
    });
  }

  // Handle tabs being closed
  chrome.tabs.onRemoved.addListener((tabId) => {
    if (debuggerAttached[tabId]) {
      try {
        chrome.debugger.detach({ tabId });
      } catch (e) {
        // Tab might be already closed
      }
      delete debuggerAttached[tabId];
    }
  });
}

// Handle communication with devtools panel
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sleuth-network") {
    // Send initial data
    port.postMessage({ type: "networkRequests", data: Object.values(networkRequests) })
    
    // Set up interval to send updates
    const intervalId = setInterval(() => {
      port.postMessage({ type: "networkRequests", data: Object.values(networkRequests) })
    }, 1000)
    
    port.onDisconnect.addListener(() => {
      clearInterval(intervalId)
    })
    
    // Handle messages from devtools
    port.onMessage.addListener((message) => {
      if (message.type === "clearNetworkRequests") {
        Object.keys(networkRequests).forEach((key) => {
          delete networkRequests[key]
        })
      }
    })
  }
})

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id && hasDebuggerAPI) {
    // Attach debugger to this tab if not already attached
    attachDebugger(tab.id);
  }
  
  // Try to open the side panel
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    
    // Set the side panel as the default
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel.html',
      enabled: true
    });
  } catch (error) {
    console.error("Failed to open side panel:", error);
  }
});

export {} 