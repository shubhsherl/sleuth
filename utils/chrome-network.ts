// Chrome Network Monitoring Implementation
import { v4 as uuidv4 } from 'uuid';

// Store network requests
const networkRequests: { [id: string]: any } = {};
const pendingRequests: { [id: string]: any } = {};

// Settings
let maxRequests = 1000;
let isMonitoring = false;

export function initChromeNetworking() {
  console.log("Initializing Chrome network monitoring");
  
  // Clear any existing data
  clearNetworkRequests();
  
  // Set up listeners
  setupListeners();
  
  // Return API for background script
  return {
    startMonitoring,
    stopMonitoring,
    getNetworkRequests,
    clearNetworkRequests,
    setMaxRequests
  };
}

// Setup listeners for Chrome's webRequest API
function setupListeners() {
  try {
    // Listen for request started events
    chrome.webRequest.onBeforeRequest.addListener(
      handleRequestStarted,
      { urls: ["<all_urls>"] },
      ["requestBody"]
    );
    
    // Listen for request headers
    chrome.webRequest.onSendHeaders.addListener(
      handleRequestHeaders,
      { urls: ["<all_urls>"] },
      ["requestHeaders"]
    );
    
    // Listen for response headers
    chrome.webRequest.onHeadersReceived.addListener(
      (details) => {
        handleResponseHeaders(details as any);
      },
      { urls: ["<all_urls>"] },
      ["responseHeaders"]
    );
    
    // Listen for request completion
    chrome.webRequest.onCompleted.addListener(
      (details) => {
        handleRequestCompleted(details as any);
      },
      { urls: ["<all_urls>"] }
    );
    
    // Listen for request errors
    chrome.webRequest.onErrorOccurred.addListener(
      (details) => {
        handleRequestError(details as any);
      },
      { urls: ["<all_urls>"] }
    );
    
    console.log("Chrome network listeners set up successfully");
  } catch (error) {
    console.error("Error setting up Chrome network listeners:", error);
  }
}

// Handle request started event
function handleRequestStarted(details: any) {
  if (!isMonitoring) return;
  
  const { requestId, url, method, requestBody, timeStamp, type, initiator } = details;
  
  // Create a new request object
  pendingRequests[requestId] = {
    id: uuidv4(), // Generate a unique ID for the request
    url,
    method,
    requestBody: requestBody ? parseRequestBody(requestBody) : undefined,
    startTime: timeStamp,
    type: type?.toLowerCase(),
    initiator
  };
}

// Handle request headers
function handleRequestHeaders(details: any) {
  if (!isMonitoring || !pendingRequests[details.requestId]) return;
  
  // Add headers to the pending request
  pendingRequests[details.requestId].requestHeaders = details.requestHeaders;
}

// Handle response headers
function handleResponseHeaders(details: any) {
  if (!isMonitoring || !pendingRequests[details.requestId]) return;
  
  const { requestId, responseHeaders, statusCode, statusLine } = details;
  const request = pendingRequests[requestId];
  
  // Add response data
  if (request) {
    request.responseHeaders = responseHeaders;
    request.status = statusCode;
    request.statusText = statusLine;
    
    // Extract content type from headers
    if (responseHeaders) {
      const contentTypeHeader = responseHeaders.find(
        (header: any) => header.name.toLowerCase() === 'content-type'
      );
      if (contentTypeHeader) {
        request.contentType = contentTypeHeader.value;
      }
    }
  }
}

// Handle request completed
function handleRequestCompleted(details: any) {
  if (!isMonitoring || !pendingRequests[details.requestId]) return;
  
  const { requestId, timeStamp, fromCache } = details;
  const request = pendingRequests[details.requestId];
  
  // Add completion data
  if (request) {
    request.endTime = timeStamp;
    request.fromCache = fromCache;
    
    // Calculate size from Content-Length header if available
    if (request.responseHeaders) {
      const contentLengthHeader = request.responseHeaders.find(
        (header: any) => header.name.toLowerCase() === 'content-length'
      );
      if (contentLengthHeader) {
        request.size = parseInt(contentLengthHeader.value, 10);
      }
    }
    
    // Add to completed requests
    networkRequests[request.id] = request;
    
    // Remove from pending requests
    delete pendingRequests[requestId];
    
    // Limit the number of stored requests
    trimRequests();
    
    console.log("Request completed:", request.url);
  }
}

// Handle request error
function handleRequestError(details: any) {
  if (!isMonitoring || !pendingRequests[details.requestId]) return;
  
  const { requestId, timeStamp, error } = details;
  const request = pendingRequests[details.requestId];
  
  // Add error information
  if (request) {
    request.endTime = timeStamp;
    request.error = error;
    
    // Add to completed requests
    networkRequests[request.id] = request;
    
    // Remove from pending requests
    delete pendingRequests[requestId];
    
    // Limit the number of stored requests
    trimRequests();
    
    console.log("Request error:", request.url, error);
  }
}

// Parse request body
function parseRequestBody(requestBody: any): any {
  if (requestBody.raw) {
    // Try to parse as JSON
    try {
      const encoder = new TextDecoder('utf-8');
      const rawData = requestBody.raw[0]?.bytes;
      if (rawData) {
        const text = encoder.decode(rawData);
        return JSON.parse(text);
      }
    } catch (e) {
      // If can't parse as JSON, return raw data
      return requestBody.raw;
    }
  } else if (requestBody.formData) {
    return requestBody.formData;
  }
  
  return requestBody;
}

// Start monitoring
export function startMonitoring() {
  console.log("Starting Chrome network monitoring");
  isMonitoring = true;
  
  // Log monitoring state after a short delay to verify
  setTimeout(() => {
    console.log("Chrome network monitoring active:", isMonitoring);
    console.log("Current pending requests:", Object.keys(pendingRequests).length);
    console.log("Current stored requests:", Object.keys(networkRequests).length);
  }, 100);
}

// Stop monitoring
export function stopMonitoring() {
  console.log("Stopping Chrome network monitoring");
  isMonitoring = false;
  
  // Log monitoring state after a short delay to verify
  setTimeout(() => {
    console.log("Chrome network monitoring active:", isMonitoring);
  }, 100);
}

// Get all network requests
export function getNetworkRequests() {
  console.log(`Getting Chrome network requests: ${Object.keys(networkRequests).length} requests`);
  return Object.values(networkRequests);
}

// Clear all network requests
export function clearNetworkRequests() {
  console.log("Clearing Chrome network requests");
  Object.keys(networkRequests).forEach(key => {
    delete networkRequests[key];
  });
}

// Set maximum number of requests to store
export function setMaxRequests(max: number) {
  console.log(`Setting Chrome max requests to ${max}`);
  maxRequests = max;
  trimRequests();
}

// Limit the number of stored requests
function trimRequests() {
  const requestIds = Object.keys(networkRequests);
  if (requestIds.length > maxRequests) {
    const excessCount = requestIds.length - maxRequests;
    const oldestIds = requestIds
      .map(id => ({
        id,
        startTime: networkRequests[id].startTime
      }))
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, excessCount)
      .map(item => item.id);
    
    for (const id of oldestIds) {
      delete networkRequests[id];
    }
    
    console.log(`Trimmed network requests (removed ${excessCount} old requests)`);
  }
} 