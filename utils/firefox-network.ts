/**
 * Firefox-specific network monitoring utility
 * 
 * Note: Firefox has stricter permissions requirements than Chrome.
 * This file provides a compatible implementation that works with Firefox's
 * permission model.
 */

import { v4 as uuidv4 } from 'uuid';

// Load settings for max requests
import { getSettings, onSettingsChanged } from "./storage";

// Call getSettings to set the maxRequestsToStore
getSettings(["maxRequests"], (result) => {
  if (result.maxRequests) {
    maxRequestsToStore = result.maxRequests;
    console.log(`Firefox network: Max requests to store set to ${maxRequestsToStore}`);
  }
});

// Listen for settings changes
onSettingsChanged((changes) => {
  if (changes.maxRequests) {
    maxRequestsToStore = changes.maxRequests.newValue;
    console.log(`Firefox network: Max requests updated to ${maxRequestsToStore}`);
    
    // Apply the limit immediately
    limitStoredRequests();
  }
});

// Define request type for consistency with Chrome
interface RequestData {
  id: string;
  url: string;
  method: string;
  requestHeaders?: any[];
  requestBody?: any;
  status?: number;
  statusText?: string;
  responseHeaders?: any[];
  responseBody?: string;
  contentType?: string;
  startTime: number;
  endTime?: number;
  size?: number;
  initiator?: string;
  type?: string;
  error?: string;
}

// In-memory storage for network requests
const networkRequests: Record<string, RequestData> = {};
let isMonitoringActive = false;
let maxRequestsToStore = 1000;

// Event listeners references to enable proper removal
let beforeRequestListener: any = null;
let beforeSendHeadersListener: any = null;
let headersReceivedListener: any = null;
let completedListener: any = null;
let errorListener: any = null;

// Safe access to browser APIs
function getBrowserAPI() {
  return typeof browser !== 'undefined' ? browser : (window as any).browser;
}

/**
 * Initialize Firefox-specific network monitoring
 */
export function initFirefoxNetworking() {
  // Check if running in Firefox
  const browserAPI = getBrowserAPI();
  
  if (!browserAPI) {
    console.log("Browser API not available");
    return null;
  }
  
  console.log("Initializing Firefox network monitoring");
  
  // Check if webRequest API is available
  if (!browserAPI.webRequest) {
    console.error("Firefox webRequest API not available");
    return null;
  }
  
  // Log the available APIs
  console.log("Available browser APIs:", Object.keys(browserAPI).join(", "));
  console.log("WebRequest methods:", Object.keys(browserAPI.webRequest).join(", "));
  
  // Start with monitoring enabled by default
  startMonitoring();
  
  return {
    startMonitoring,
    stopMonitoring,
    clearNetworkRequests,
    getNetworkRequests: () => Object.values(networkRequests),
    setMaxRequests: (max: number) => { 
      maxRequestsToStore = max; 
      console.log(`Firefox network: Max requests manually set to ${max}`);
      limitStoredRequests(); // Apply immediately
    }
  };
}

/**
 * Start monitoring network requests
 */
export function startMonitoring() {
  if (isMonitoringActive) return;
  
  try {
    const browserAPI = getBrowserAPI();
    if (!browserAPI || !browserAPI.webRequest) {
      console.error("WebRequest API not available");
      return;
    }
    
    isMonitoringActive = true;
    console.log("Firefox network monitoring started");
    
    // Store listener references for later removal
    beforeRequestListener = handleBeforeRequest;
    beforeSendHeadersListener = handleBeforeSendHeaders;
    headersReceivedListener = handleHeadersReceived;
    completedListener = handleCompleted;
    errorListener = handleError;
    
    // Request started - no need for requestBody as it requires additional permission
    browserAPI.webRequest.onBeforeRequest.addListener(
      beforeRequestListener,
      { urls: ["<all_urls>"] }
    );
    
    // Request headers
    browserAPI.webRequest.onBeforeSendHeaders.addListener(
      beforeSendHeadersListener,
      { urls: ["<all_urls>"] },
      ["requestHeaders"]
    );
    
    // Response headers
    browserAPI.webRequest.onHeadersReceived.addListener(
      headersReceivedListener,
      { urls: ["<all_urls>"] },
      ["responseHeaders"]
    );
    
    // Response completed
    browserAPI.webRequest.onCompleted.addListener(
      completedListener,
      { urls: ["<all_urls>"] }
    );
    
    // Response error
    browserAPI.webRequest.onErrorOccurred.addListener(
      errorListener,
      { urls: ["<all_urls>"] }
    );
    
    console.log("All Firefox network listeners registered successfully");
  } catch (error) {
    console.error("Error starting Firefox network monitoring:", error);
    isMonitoringActive = false;
  }
}

/**
 * Stop monitoring network requests
 */
export function stopMonitoring() {
  if (!isMonitoringActive) return;
  
  try {
    const browserAPI = getBrowserAPI();
    if (!browserAPI || !browserAPI.webRequest) {
      return;
    }
    
    isMonitoringActive = false;
    console.log("Firefox network monitoring stopped");
    
    // Remove all listeners
    if (beforeRequestListener) {
      browserAPI.webRequest.onBeforeRequest.removeListener(beforeRequestListener);
    }
    if (beforeSendHeadersListener) {
      browserAPI.webRequest.onBeforeSendHeaders.removeListener(beforeSendHeadersListener);
    }
    if (headersReceivedListener) {
      browserAPI.webRequest.onHeadersReceived.removeListener(headersReceivedListener);
    }
    if (completedListener) {
      browserAPI.webRequest.onCompleted.removeListener(completedListener);
    }
    if (errorListener) {
      browserAPI.webRequest.onErrorOccurred.removeListener(errorListener);
    }
  } catch (error) {
    console.error("Error stopping Firefox network monitoring:", error);
  }
}

/**
 * Clear all stored network requests
 */
export function clearNetworkRequests() {
  Object.keys(networkRequests).forEach((key) => {
    delete networkRequests[key];
  });
  console.log("Firefox network requests cleared");
}

/**
 * Limit the number of stored requests
 * This ensures we don't keep more requests than maxRequestsToStore
 */
function limitStoredRequests() {
  const requestIds = Object.keys(networkRequests);
  const requestCount = requestIds.length;
  
  // Debug log to see if we're hitting the limit
  if (requestCount >= maxRequestsToStore) {
    console.log(`Firefox network: Limiting stored requests. Current: ${requestCount}, Max: ${maxRequestsToStore}`);
  }
  
  if (requestCount > maxRequestsToStore) {
    // Sort by startTime (oldest first)
    requestIds.sort((a, b) => {
      return networkRequests[a].startTime - networkRequests[b].startTime;
    });
    
    // Remove oldest entries to stay within limit
    const toRemove = requestCount - maxRequestsToStore;
    console.log(`Firefox network: Removing ${toRemove} oldest requests`);
    
    for (let i = 0; i < toRemove; i++) {
      delete networkRequests[requestIds[i]];
    }
  }
}

/**
 * Event handlers for Firefox webRequest API
 */
function handleBeforeRequest(details: any) {
  if (!isMonitoringActive || !shouldProcessRequest(details)) return {};
  
  try {
    // Generate a unique ID for this request if it doesn't exist
    const id = details.requestId || uuidv4();
    
    console.log(`Firefox captured request: ${details.method} ${details.url}`);
    
    // We can't access requestBody in Firefox with default permissions
    // Create or update request data
    networkRequests[id] = {
      ...networkRequests[id],
      id,
      url: details.url,
      method: details.method,
      startTime: details.timeStamp,
      type: details.type || guessResourceType(details.url)
    };
    
    // Limit stored requests
    limitStoredRequests();
  } catch (error) {
    console.error("Error in handleBeforeRequest:", error);
  }
  
  return {};
}

function handleBeforeSendHeaders(details: any) {
  if (!isMonitoringActive || !shouldProcessRequest(details)) return { requestHeaders: details.requestHeaders };
  
  try {
    const id = details.requestId || uuidv4();
    
    // Update request with headers
    networkRequests[id] = {
      ...networkRequests[id],
      id,
      url: details.url,
      method: details.method,
      requestHeaders: details.requestHeaders,
      startTime: details.timeStamp || networkRequests[id]?.startTime || Date.now(),
      type: details.type || networkRequests[id]?.type || guessResourceType(details.url)
    };
    
    // Limit stored requests
    limitStoredRequests();
  } catch (error) {
    console.error("Error in handleBeforeSendHeaders:", error);
  }
  
  return { requestHeaders: details.requestHeaders };
}

function handleHeadersReceived(details: any) {
  if (!isMonitoringActive || !shouldProcessRequest(details)) return { responseHeaders: details.responseHeaders };
  
  try {
    const id = details.requestId || uuidv4();
    
    // Find content type header
    let contentType = "";
    if (details.responseHeaders) {
      const contentTypeHeader = details.responseHeaders.find(
        (header: any) => header.name.toLowerCase() === "content-type"
      );
      if (contentTypeHeader) {
        contentType = contentTypeHeader.value;
      }
    }
    
    // Update request with response headers and status
    networkRequests[id] = {
      ...networkRequests[id],
      id,
      url: details.url,
      method: details.method,
      status: details.statusCode,
      statusText: getStatusText(details.statusCode),
      responseHeaders: details.responseHeaders,
      contentType,
      type: details.type || networkRequests[id]?.type || guessResourceType(details.url)
    };
    
    // Limit stored requests
    limitStoredRequests();
  } catch (error) {
    console.error("Error in handleHeadersReceived:", error);
  }
  
  return { responseHeaders: details.responseHeaders };
}

function handleCompleted(details: any) {
  if (!isMonitoringActive || !shouldProcessRequest(details)) return;
  
  try {
    const id = details.requestId || uuidv4();
    
    // Calculate size from content-length header
    let size = 0;
    if (networkRequests[id]?.responseHeaders) {
      const contentLengthHeader = networkRequests[id].responseHeaders.find(
        (header: any) => header.name.toLowerCase() === "content-length"
      );
      if (contentLengthHeader) {
        size = parseInt(contentLengthHeader.value, 10);
      }
    }
    
    // Update request with completion data
    networkRequests[id] = {
      ...networkRequests[id],
      id,
      url: details.url,
      method: details.method,
      status: details.statusCode,
      statusText: getStatusText(details.statusCode),
      endTime: details.timeStamp,
      size,
      type: details.type || networkRequests[id]?.type || guessResourceType(details.url)
    };
    
    // Limit stored requests
    limitStoredRequests();
  } catch (error) {
    console.error("Error in handleCompleted:", error);
  }
}

function handleError(details: any) {
  if (!isMonitoringActive || !shouldProcessRequest(details)) return;
  
  try {
    const id = details.requestId || uuidv4();
    
    // Update request with error data
    networkRequests[id] = {
      ...networkRequests[id],
      id,
      url: details.url,
      method: details.method,
      endTime: details.timeStamp,
      error: details.error,
      type: details.type || networkRequests[id]?.type || guessResourceType(details.url)
    };
    
    // Limit stored requests
    limitStoredRequests();
  } catch (error) {
    console.error("Error in handleError:", error);
  }
}

/**
 * Helper to determine if we should process this request
 */
function shouldProcessRequest(details: any): boolean {
  if (!details) return false;
  
  // Skip monitoring for our own extension requests
  if (details.url.startsWith('moz-extension://')) {
    return false;
  }
  
  return true;
}

/**
 * Guess resource type based on URL and extension
 */
function guessResourceType(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname.toLowerCase();
    
    // Check file extension
    if (path.endsWith('.js')) return 'script';
    if (path.endsWith('.css')) return 'stylesheet';
    if (path.endsWith('.html') || path.endsWith('.htm')) return 'document';
    if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'].some(ext => path.endsWith(ext))) return 'image';
    if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].some(ext => path.endsWith(ext))) return 'font';
    if (['.json', '.xml'].some(ext => path.endsWith(ext))) return 'xhr';
    
    // Check path components
    if (path.includes('/api/') || path.includes('/ajax/') || path.includes('/xhr/')) return 'xhr';
    
    return 'other';
  } catch (e) {
    return 'other';
  }
}

/**
 * Get status text from status code
 */
function getStatusText(statusCode: number): string {
  const statusTexts: Record<number, string> = {
    100: 'Continue',
    101: 'Switching Protocols',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: "I'm a teapot",
    422: 'Unprocessable Entity',
    425: 'Too Early',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required'
  };
  
  return statusTexts[statusCode] || 'Unknown Status';
} 