import { useEffect, useState, useRef } from "react"
import "../styles.css"
import ReactJson from "react-json-view"

// Define request type
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

// Filter options
interface FilterOptions {
  url: string
  method: string[]
  status: string[]
  contentType: string[]
  type: string[]
}

// Toast notification
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NetworkPanelProps {
  theme?: string;
  enableShortcuts?: boolean;
  showCurlShortcut?: boolean;
  showAuthShortcut?: boolean;
  showUrlShortcut?: boolean;
}

// New imports for icons
const ResourceTypeIcons = {
  document: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#9c63f5" }}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  stylesheet: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#e84393" }}>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z"/>
      <line x1="16" y1="8" x2="2" y2="22"/>
      <line x1="17.5" y1="15" x2="9" y2="15"/>
    </svg>
  ),
  script: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#f1c40f" }}>
      <path d="m16 12 4 4-4 4"/>
      <path d="m8 12-4 4 4 4"/>
      <path d="m12 4 4 16"/>
    </svg>
  ),
  image: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#27ae60" }}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  font: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#00b894" }}>
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>
  ),
  fetch: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#3498db" }}>
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
  ),
  xhr: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#3498db" }}>
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
  ),
  other: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#7f8c8d" }}>
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  )
};

// Function to determine resource type icon based on URL and content type
const getResourceTypeIcon = (url: string, contentType?: string, type?: string) => {
  // First check explicit type if available
  if (type) {
    if (type === 'document') return ResourceTypeIcons.document();
    if (type === 'stylesheet') return ResourceTypeIcons.stylesheet();
    if (type === 'script') return ResourceTypeIcons.script();
    if (type === 'image') return ResourceTypeIcons.image();
    if (type === 'font') return ResourceTypeIcons.font();
    if (type === 'fetch') return ResourceTypeIcons.fetch();
    if (type === 'xhr') return ResourceTypeIcons.xhr();
  }
  
  const extension = url.split('.').pop()?.toLowerCase();
  
  if (contentType) {
    if (contentType.includes('text/html')) return ResourceTypeIcons.document();
    if (contentType.includes('text/css')) return ResourceTypeIcons.stylesheet();
    if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) return ResourceTypeIcons.script();
    if (contentType.includes('image/')) return ResourceTypeIcons.image();
    if (contentType.includes('font/') || contentType.includes('application/font')) return ResourceTypeIcons.font();
    if (contentType.includes('application/json')) return ResourceTypeIcons.fetch();
  }
  
  // Fallback to extension-based detection
  if (extension) {
    if (['html', 'htm'].includes(extension)) return ResourceTypeIcons.document();
    if (['css'].includes(extension)) return ResourceTypeIcons.stylesheet();
    if (['js', 'jsx', 'ts', 'tsx'].includes(extension)) return ResourceTypeIcons.script();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) return ResourceTypeIcons.image();
    if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(extension)) return ResourceTypeIcons.font();
  }
  
  // Default to XHR/fetch for API endpoints
  if (url.includes('/api/')) return ResourceTypeIcons.fetch();
  
  return ResourceTypeIcons.other();
};

// Toast component
const Toast = ({ toast, onClose }: { toast: Toast, onClose: (id: string) => void }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set new timer
    timerRef.current = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []); // Empty dependency array to run only once on mount
  
  return (
    <div 
      style={{ 
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: toast.type === 'success' ? '#28a745' : toast.type === 'error' ? '#dc3545' : '#17a2b8',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 9999,
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: '250px'
      }}
    >
      <span>{toast.message}</span>
      <button 
        onClick={() => onClose(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          marginLeft: '10px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ×
      </button>
    </div>
  );
};

const NetworkPanel = ({ 
  theme = "dark",
  enableShortcuts = true,
  showCurlShortcut = true, 
  showAuthShortcut = true,
  showUrlShortcut = true
}: NetworkPanelProps) => {
  const [requests, setRequests] = useState<RequestData[]>([])
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null)
  const [activeTab, setActiveTab] = useState<"headers" | "body" | "request" | "response" | "auth" | "preview">("headers")
  const [hoverInfo, setHoverInfo] = useState<{ id: string, top: number, left: number } | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  
  // Filter states
  const [filters, setFilters] = useState<FilterOptions>({
    url: "",
    method: [],
    status: [],
    contentType: [],
    type: []
  })
  
  // Track open filter dropdowns
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  
  // JSON viewer states
  const [requestJsonCollapsed, setRequestJsonCollapsed] = useState<number | boolean>(1)
  const [responseJsonCollapsed, setResponseJsonCollapsed] = useState<number | boolean>(1)
  const [requestJsonSearch, setRequestJsonSearch] = useState<string>("")
  const [responseJsonSearch, setResponseJsonSearch] = useState<string>("")
  const [requestJsonKey, setRequestJsonKey] = useState<number>(0)
  const [responseJsonKey, setResponseJsonKey] = useState<number>(0)
  
  // Port connection to background script
  const [port, setPort] = useState<chrome.runtime.Port | null>(null)
  
  // Dark mode styles
  const isDark = theme === "dark" || 
                (theme === "system" && 
                 window.matchMedia && 
                 window.matchMedia('(prefers-color-scheme: dark)').matches)
  const bgColor = isDark ? "#1e2130" : "#fff"
  const textColor = isDark ? "#e9ecef" : "#333"
  const headerBgColor = isDark ? "#1a1c28" : "#f5f5f5"
  const borderColor = isDark ? "#4a5568" : "#e2e8f0"
  const tableHeaderBg = isDark ? "#1a202c" : "#f8f9fa"
  const tableBgHover = isDark ? "#2a2f45" : "#f5f5f5"
  const tableBgSelected = isDark ? "#2d3348" : "#e6f0ff"
  const cardBg = isDark ? "#242a38" : "#fff"
  const hoverCardBg = isDark ? "rgba(45, 51, 72, 0.85)" : "rgba(255, 255, 255, 0.85)"
  
  // Connect to background script
  useEffect(() => {
    const newPort = chrome.runtime.connect({ name: "sleuth-network" })
    
    // Store port reference in state
    setPort(newPort)
    
    newPort.onMessage.addListener((message) => {
      if (message.type === "networkRequests") {
        setRequests(message.data)
      }
    })
    
    return () => {
      newPort.disconnect()
    }
  }, [])
  
  // Clear all requests
  const handleClearRequests = () => {
    if (port) {
      port.postMessage({ type: "clearNetworkRequests" })
      
      // Also clear the local state to give immediate feedback
      setRequests([])
      setSelectedRequest(null)
    }
  }
  
  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    
    // First remove any existing toasts with the same message
    setToasts(prev => {
      const filtered = prev.filter(toast => toast.message !== message);
      return [...filtered, { id, message, type }];
    });
    
    // Automatically remove this toast after 4 seconds as a backup
    setTimeout(() => {
      closeToast(id);
    }, 4500);
  };
  
  // Close toast notification
  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Copy as cURL command
  const copyAsCurl = (request: RequestData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let curlCommand = `curl -X ${request.method} '${request.url}'`
    
    // Add headers
    request.requestHeaders?.forEach((header) => {
      curlCommand += ` -H '${header.name}: ${header.value}'`
    })
    
    // Add request body if it exists
    if (request.requestBody && request.method !== "GET") {
      // Simplified implementation - would need to handle different body formats
      curlCommand += ` -d '${JSON.stringify(request.requestBody)}'`
    }
    
    navigator.clipboard.writeText(curlCommand)
    showToast("cURL command copied to clipboard");
  }
  
  // Copy URL
  const copyUrl = (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(url)
    showToast("URL copied to clipboard");
  }
  
  // Copy auth header
  const copyAuthHeader = (request: RequestData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const authHeader = request.requestHeaders?.find(
      (header) => header.name.toLowerCase() === "authorization"
    )
    
    if (authHeader) {
      // Only copy the value, not the key
      navigator.clipboard.writeText(authHeader.value)
      showToast("Auth header value copied to clipboard");
    } else {
      showToast("No authorization header found", "error");
    }
  }
  
  // Get request size in human-readable format
  const formatSize = (bytes?: number): string => {
    if (bytes === undefined) return "-";
    if (bytes === 0) return "0 B";
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };
  
  // Format time duration
  const formatTime = (start: number, end?: number): string => {
    if (!end) return "-";
    const duration = end - start;
    return `${duration.toFixed(0)}ms`;
  };
  
  // Better determine the request type based on headers and initiator
  const determineRequestType = (request: RequestData): string => {
    // If type is already properly set by the background script, use it
    if (request.type && ["fetch", "xhr", "script", "stylesheet", "document", "image", "font"].includes(request.type)) {
      return request.type;
    }
    
    // Check initiator for clues
    if (request.initiator) {
      if (request.initiator.includes("fetch")) {
        return "fetch";
      }
      if (request.initiator.includes("xmlhttprequest") || request.initiator.includes("xhr")) {
        return "xhr";
      }
    }
    
    // Check request headers
    const hasXRequestedWith = request.requestHeaders?.some(
      h => h.name.toLowerCase() === "x-requested-with" && h.value.toLowerCase().includes("xmlhttprequest")
    );
    
    if (hasXRequestedWith) {
      return "xhr";
    }
    
    // Check content type for clues
    if (request.contentType) {
      if (request.contentType.includes("application/json")) {
        // Most JSON responses are from API calls (either XHR or fetch)
        return "fetch"; // Default to fetch for API calls
      }
      if (request.contentType.includes("javascript")) {
        return "script";
      }
      if (request.contentType.includes("css")) {
        return "stylesheet";
      }
      if (request.contentType.includes("html")) {
        return "document";
      }
      if (request.contentType.includes("image/")) {
        return "image";
      }
      if (request.contentType.includes("font")) {
        return "font";
      }
    }
    
    // Check URL patterns
    if (request.url) {
      const url = request.url.toLowerCase();
      if (url.includes("/api/") || url.includes("/graphql")) {
        return "fetch";
      }
      
      // Check file extensions
      const extension = url.split('.').pop()?.toLowerCase();
      if (extension) {
        if (['js', 'jsx', 'mjs'].includes(extension)) return "script";
        if (['css'].includes(extension)) return "stylesheet";
        if (['html', 'htm'].includes(extension)) return "document";
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'].includes(extension)) return "image";
        if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(extension)) return "font";
      }
    }
    
    // For any request with JSON request body that doesn't match other categories
    if (request.requestBody && typeof request.requestBody === 'object') {
      return "fetch";
    }
    
    // Default to "other" if we can't determine
    return request.type || "other";
  }
  
  // Apply filters
  const filteredRequests = requests.filter((request) => {
    // Determine request type if not already set
    const requestType = determineRequestType(request);
    
    return (
      (filters.url === "" || request.url.includes(filters.url)) &&
      (filters.method.length === 0 || filters.method.includes(request.method)) &&
      (filters.status.length === 0 || 
        filters.status.some(s => request.status?.toString().startsWith(s))) &&
      (filters.contentType.length === 0 || 
        filters.contentType.some(ct => request.contentType?.includes(ct))) &&
      (filters.type.length === 0 || 
        filters.type.includes(requestType))
    )
  })
  
  // Sort requests by timestamp (latest first)
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aTime = a.endTime || a.startTime;
    const bTime = b.endTime || b.startTime;
    return bTime - aTime; // Descending order (latest first)
  });
  
  // Get method color
  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "#28a745"; // Green
      case "POST": return "#007bff"; // Blue
      case "PUT": return "#ffc107"; // Yellow
      case "DELETE": return "#dc3545"; // Red
      case "OPTIONS": return "#fd7e14"; // Orange
      case "PATCH": return "#6f42c1"; // Purple
      default: return "#6c757d"; // Gray
    }
  };
  
  // Get status color
  const getStatusColor = (status?: number) => {
    if (!status) return { bg: isDark ? "#2d3348" : "#e9ecef", text: isDark ? "#adb5bd" : "#6c757d" };
    
    if (status >= 200 && status < 300) {
      return { bg: isDark ? "#173626" : "#d4edda", text: isDark ? "#28a745" : "#155724" }; // Success (green)
    } else if (status >= 300 && status < 400) {
      return { bg: isDark ? "#172b3b" : "#cce5ff", text: isDark ? "#0d6efd" : "#004085" }; // Redirect (blue)
    } else if (status >= 400 && status < 500) {
      return { bg: isDark ? "#372429" : "#f8d7da", text: isDark ? "#dc3545" : "#721c24" }; // Client Error (red)
    } else if (status >= 500) {
      return { bg: isDark ? "#372429" : "#f8d7da", text: isDark ? "#dc3545" : "#721c24" }; // Server Error (red)
    }
    
    return { bg: isDark ? "#2d3348" : "#e9ecef", text: isDark ? "#adb5bd" : "#6c757d" }; // Default (gray)
  };
  
  // Calculate width of panels based on selection
  const requestListWidth = selectedRequest ? "50%" : "100%";
  const detailsPanelWidth = selectedRequest ? "50%" : "0%";
  
  // Handle multi-select filter
  const handleFilterChange = (filterType: keyof FilterOptions, value: string | string[]) => {
    if (filterType === 'url') {
      setFilters(prev => ({ ...prev, [filterType]: value as string }));
    } else {
      // For multi-select filters
      if (typeof value === 'string') {
        // Toggle the value in the array
        setFilters(prev => {
          const currentValues = prev[filterType] as string[];
          const valueIndex = currentValues.indexOf(value);
          
          if (valueIndex === -1) {
            // Add value if not present
            return { ...prev, [filterType]: [...currentValues, value] };
          } else {
            // Remove value if already present
            return { 
              ...prev, 
              [filterType]: currentValues.filter(item => item !== value) 
            };
          }
        });
      }
    }
  };
  
  // Add event listener to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilter && containerRef.current) {
        const filterElement = document.getElementById(openFilter);
        const filterButton = document.getElementById(`${openFilter}-button`);
        
        if (filterElement && filterButton && 
            !filterElement.contains(event.target as Node) && 
            !filterButton.contains(event.target as Node)) {
          filterElement.style.display = "none";
          setOpenFilter(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFilter]);
  
  // Toggle filter dropdown
  const toggleFilter = (filterId: string) => {
    const element = document.getElementById(filterId);
    if (element) {
      const isCurrentlyOpen = element.style.display === "block";
      
      // Close all open filters first
      if (openFilter) {
        const currentOpenFilter = document.getElementById(openFilter);
        if (currentOpenFilter) {
          currentOpenFilter.style.display = "none";
        }
      }
      
      // Toggle the clicked filter
      if (!isCurrentlyOpen) {
        element.style.display = "block";
        setOpenFilter(filterId);
      } else {
        element.style.display = "none";
        setOpenFilter(null);
      }
    }
  };
  
  // Handle mouse enter with delay
  const handleMouseEnter = (requestId: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    
    // Set new timeout to show hover after 1 second
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoverInfo({ id: requestId, top: 0, left: 0 });
    }, 1000);
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    // Clear the timeout if mouse leaves before hover is shown
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Hide the hover info
    setHoverInfo(null);
  };
  
  return (
    <div ref={containerRef} className="flex flex-col h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Header */}
      <div style={{ backgroundColor: headerBgColor, padding: "12px 16px", borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-center justify-between">
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
            Network Sleuth
            <span style={{ fontSize: "14px", fontWeight: "normal", opacity: 0.7, marginLeft: "8px" }}>
              {filteredRequests.length} requests
            </span>
          </h1>
          <div className="flex space-x-2">
            <button 
              onClick={handleClearRequests}
              style={{ 
                padding: "4px 8px", 
                backgroundColor: "transparent", 
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "28px"
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
            
            {/* Filter by URL */}
            <input
              type="text"
              placeholder="Filter URL"
              value={filters.url}
              onChange={(e) => setFilters({...filters, url: e.target.value})}
              style={{ 
                border: `1px solid ${borderColor}`,
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "12px",
                backgroundColor: isDark ? "#2d3348" : "#fff",
                color: textColor,
                width: "150px"
              }}
            />
            
            {/* Filter by method - multi-select */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => toggleFilter("method-filter")}
                id="method-filter-button"
                style={{ 
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  backgroundColor: isDark ? "#2d3348" : "#fff",
                  color: textColor,
                  minWidth: "120px",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                {filters.method.length > 0 ? `Methods (${filters.method.length})` : "All Methods"}
                <span style={{ marginLeft: "4px" }}>▼</span>
              </button>
              <div 
                id="method-filter"
                style={{ 
                  display: "none", 
                  position: "absolute", 
                  top: "100%", 
                  left: 0, 
                  zIndex: 10,
                  backgroundColor: isDark ? "#2d3348" : "#fff",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  width: "150px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  marginTop: "4px",
                  maxHeight: "200px",
                  overflowY: "auto"
                }}
              >
                {["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"].map(method => (
                  <div 
                    key={method}
                    style={{ 
                      padding: "6px 8px", 
                      cursor: "pointer",
                      backgroundColor: filters.method.includes(method) ? (isDark ? "#3a4160" : "#e6f7ff") : "transparent",
                      display: "flex",
                      alignItems: "center"
                    }}
                    onClick={() => handleFilterChange("method", method)}
                  >
                    <input 
                      type="checkbox" 
                      checked={filters.method.includes(method)} 
                      onChange={() => {}} 
                      style={{ marginRight: "6px" }}
                    />
                    {method}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filter by status - multi-select */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => toggleFilter("status-filter")}
                id="status-filter-button"
                style={{ 
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  backgroundColor: isDark ? "#2d3348" : "#fff",
                  color: textColor,
                  minWidth: "120px",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                {filters.status.length > 0 ? `Status (${filters.status.length})` : "All Status"}
                <span style={{ marginLeft: "4px" }}>▼</span>
              </button>
              <div 
                id="status-filter"
                style={{ 
                  display: "none", 
                  position: "absolute", 
                  top: "100%", 
                  left: 0, 
                  zIndex: 10,
                  backgroundColor: isDark ? "#2d3348" : "#fff",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  width: "150px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  marginTop: "4px",
                  maxHeight: "200px",
                  overflowY: "auto"
                }}
              >
                {[
                  { value: "2", label: "2xx (Success)" },
                  { value: "3", label: "3xx (Redirect)" },
                  { value: "4", label: "4xx (Client Error)" },
                  { value: "5", label: "5xx (Server Error)" }
                ].map(status => (
                  <div 
                    key={status.value}
                    style={{ 
                      padding: "6px 8px", 
                      cursor: "pointer",
                      backgroundColor: filters.status.includes(status.value) ? (isDark ? "#3a4160" : "#e6f7ff") : "transparent",
                      display: "flex",
                      alignItems: "center"
                    }}
                    onClick={() => handleFilterChange("status", status.value)}
                  >
                    <input 
                      type="checkbox" 
                      checked={filters.status.includes(status.value)} 
                      onChange={() => {}} 
                      style={{ marginRight: "6px" }}
                    />
                    {status.label}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filter by type - multi-select */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => toggleFilter("type-filter")}
                id="type-filter-button"
                style={{ 
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  backgroundColor: isDark ? "#2d3348" : "#fff",
                  color: textColor,
                  minWidth: "120px",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                {filters.type.length > 0 ? `Type (${filters.type.length})` : "All Types"}
                <span style={{ marginLeft: "4px" }}>▼</span>
              </button>
              <div 
                id="type-filter"
                style={{ 
                  display: "none", 
                  position: "absolute", 
                  top: "100%", 
                  left: 0, 
                  zIndex: 10,
                  backgroundColor: isDark ? "#2d3348" : "#fff",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  width: "150px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  marginTop: "4px",
                  maxHeight: "200px",
                  overflowY: "auto"
                }}
              >
                {[
                  { value: "fetch", label: "Fetch" },
                  { value: "xhr", label: "XHR" },
                  { value: "script", label: "Script" },
                  { value: "stylesheet", label: "Stylesheet" },
                  { value: "document", label: "Document" },
                  { value: "image", label: "Image" },
                  { value: "font", label: "Font" },
                  { value: "other", label: "Other" }
                ].map(type => (
                  <div 
                    key={type.value}
                    style={{ 
                      padding: "6px 8px", 
                      cursor: "pointer",
                      backgroundColor: filters.type.includes(type.value) ? (isDark ? "#3a4160" : "#e6f7ff") : "transparent",
                      display: "flex",
                      alignItems: "center"
                    }}
                    onClick={() => handleFilterChange("type", type.value)}
                  >
                    <input 
                      type="checkbox" 
                      checked={filters.type.includes(type.value)} 
                      onChange={() => {}} 
                      style={{ marginRight: "6px" }}
                    />
                    {type.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-grow h-full overflow-hidden">
        {/* Requests list */}
        <div className="overflow-y-auto border-r" style={{ maxHeight: '100%', borderColor, width: requestListWidth, transition: 'width 0.3s ease' }}>
          <table className="w-full border-collapse" style={{ borderCollapse: "collapse" }}>
            <thead className="sticky top-0" style={{ backgroundColor: headerBgColor }}>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "8px 12px" }}>Method</th>
                <th style={{ padding: "8px 4px", width: "24px" }}></th>
                <th style={{ padding: "8px 12px" }}>Name</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto">
              {sortedRequests.map((request) => {
                const statusStyle = getStatusColor(request.status);
                const methodColor = getMethodColor(request.method);
                const selected = selectedRequest?.id === request.id;
                const isHovered = hoverInfo?.id === request.id;
                const requestType = determineRequestType(request);
                
                return (
                  <tr 
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    onMouseEnter={() => handleMouseEnter(request.id)}
                    onMouseLeave={handleMouseLeave}
                    style={{ 
                      cursor: "pointer",
                      backgroundColor: selected ? tableBgSelected : "transparent",
                      borderBottom: `1px solid ${borderColor}`,
                      position: "relative"
                    }}
                    onMouseOver={(e) => {
                      if (!selected) e.currentTarget.style.backgroundColor = tableBgHover;
                    }}
                    onMouseOut={(e) => {
                      if (!selected) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ 
                        color: methodColor,
                        fontWeight: "bold",
                        fontSize: "14px"
                      }}>
                        {request.method}
                      </span>
                    </td>
                    <td style={{ padding: "8px 4px", textAlign: "center" }}>
                      {getResourceTypeIcon(request.url, request.contentType, requestType)}
                    </td>
                    <td style={{ padding: "8px 12px", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span>{new URL(request.url).pathname}</span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ 
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        fontSize: "14px"
                      }}>
                        {request.status || "-"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      {enableShortcuts && (
                        <div className="flex space-x-1 justify-end">
                          {showUrlShortcut && (
                            <button
                              onClick={(e) => copyUrl(request.url, e)}
                              style={{
                                padding: "3px 5px",
                                fontSize: "10px",
                                backgroundColor: isDark ? "#2d3348" : "#e9ecef",
                                border: `1px solid ${borderColor}`,
                                color: textColor,
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                              title="Copy URL">
                              URL
                            </button>
                          )}
                          {showAuthShortcut && (
                            <button
                              onClick={(e) => copyAuthHeader(request, e)}
                              style={{
                                padding: "3px 5px",
                                fontSize: "10px",
                                backgroundColor: isDark ? "#2d3348" : "#e9ecef",
                                border: `1px solid ${borderColor}`,
                                color: textColor,
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                              title="Copy Auth Header">
                              Auth
                            </button>
                          )}
                          {showCurlShortcut && (
                            <button
                              onClick={(e) => copyAsCurl(request, e)}
                              style={{
                                padding: "3px 5px",
                                fontSize: "10px",
                                backgroundColor: isDark ? "#2d3348" : "#e9ecef",
                                border: `1px solid ${borderColor}`,
                                color: textColor,
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                              title="Copy as cURL">
                              cURL
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    
                    {/* Hover detail card */}
                    {isHovered && hoverInfo && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: hoverInfo.top,
                          left: hoverInfo.left,
                          zIndex: 10,
                          backgroundColor: hoverCardBg,
                          border: `1px solid ${borderColor}`,
                          borderRadius: '4px',
                          padding: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          width: '400px',
                          pointerEvents: 'none',
                          backdropFilter: 'blur(2px)'
                        }}
                      >
                        <div style={{ marginBottom: '8px', wordBreak: 'break-all' }}>
                          <strong>URL:</strong> {request.url}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <strong>Method:</strong> {request.method}
                          </div>
                          <div>
                            <strong>Status:</strong> {request.status || '-'}
                          </div>
                          <div>
                            <strong>Type:</strong> {requestType}
                          </div>
                          <div>
                            <strong>Content:</strong> {request.contentType || requestType || '-'}
                          </div>
                          <div>
                            <strong>Size:</strong> {formatSize(request.size)}
                          </div>
                          <div>
                            <strong>Time:</strong> {formatTime(request.startTime, request.endTime)}
                          </div>
                          <div>
                            <strong>Initiator:</strong> {request.initiator || '-'}
                          </div>
                        </div>
                      </div>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Request details */}
        <div className="overflow-y-auto flex flex-col" style={{ 
          maxHeight: '100%', 
          width: detailsPanelWidth,
          transition: 'width 0.3s ease',
          overflow: selectedRequest ? 'auto' : 'hidden'
        }}>
          {selectedRequest ? (
            <>
              {/* Request details tabs */}
              <div className="flex border-b sticky top-0" style={{ backgroundColor: headerBgColor, borderColor }}>
                <button
                  onClick={() => setActiveTab("headers")}
                  style={{ 
                    padding: "8px 16px", 
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "headers" ? `2px solid ${getMethodColor(selectedRequest.method)}` : "none",
                    color: textColor,
                    cursor: "pointer",
                    fontWeight: activeTab === "headers" ? "bold" : "normal",
                  }}>
                  Headers
                </button>
                <button
                  onClick={() => setActiveTab("request")}
                  style={{ 
                    padding: "8px 16px", 
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "request" ? `2px solid ${getMethodColor(selectedRequest.method)}` : "none",
                    color: textColor,
                    cursor: "pointer",
                    fontWeight: activeTab === "request" ? "bold" : "normal",
                  }}>
                  Request
                </button>
                <button
                  onClick={() => setActiveTab("response")}
                  style={{ 
                    padding: "8px 16px", 
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "response" ? `2px solid ${getMethodColor(selectedRequest.method)}` : "none",
                    color: textColor,
                    cursor: "pointer",
                    fontWeight: activeTab === "response" ? "bold" : "normal",
                  }}>
                  Response
                </button>
                <button
                  onClick={() => setActiveTab("auth")}
                  style={{ 
                    padding: "8px 16px", 
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "auth" ? `2px solid ${getMethodColor(selectedRequest.method)}` : "none",
                    color: textColor,
                    cursor: "pointer",
                    fontWeight: activeTab === "auth" ? "bold" : "normal",
                  }}>
                  Auth
                </button>
                <button
                  onClick={() => setSelectedRequest(null)}
                  style={{ 
                    padding: "8px 12px", 
                    background: "transparent",
                    border: "none",
                    marginLeft: "auto",
                    color: textColor,
                    cursor: "pointer",
                  }}>
                  &times;
                </button>
              </div>
              
              {/* Tab content */}
              <div className="p-0 overflow-y-auto flex-grow" style={{ backgroundColor: bgColor }}>
                {activeTab === "headers" && (
                  <div>
                    <div style={{ padding: "12px 16px" }}>
                      <div style={{ 
                        marginBottom: "20px", 
                        borderBottom: `1px solid ${borderColor}`,
                        paddingBottom: "16px"
                      }}>
                        <h3 style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "16px" }}>Request URL</h3>
                        <div style={{ 
                          fontFamily: "monospace", 
                          wordBreak: "break-all", 
                          fontSize: "13px",
                          backgroundColor: cardBg,
                          padding: "12px",
                          borderRadius: "4px",
                          border: `1px solid ${borderColor}`
                        }}>
                          {selectedRequest.url}
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedRequest.url);
                              showToast("URL copied to clipboard");
                            }}
                            style={{
                              marginLeft: "8px",
                              padding: "2px 6px",
                              backgroundColor: isDark ? "#2d3348" : "#e9ecef",
                              border: `1px solid ${borderColor}`,
                              color: textColor,
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "11px",
                              display: "inline-flex",
                              alignItems: "center",
                              verticalAlign: "middle"
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      
                      <h3 style={{ fontWeight: "bold", marginBottom: "16px", fontSize: "16px" }}>Request Headers ({selectedRequest.requestHeaders?.length || 0})</h3>
                      
                      <div style={{ 
                        border: `1px solid ${borderColor}`, 
                        borderRadius: "4px", 
                        overflow: "hidden", 
                        marginBottom: "24px",
                        backgroundColor: cardBg
                      }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={{ 
                                padding: "10px 16px", 
                                textAlign: "left", 
                                fontWeight: "500", 
                                borderBottom: `1px solid ${borderColor}`,
                                width: "30%"
                              }}>Name</th>
                              <th style={{ 
                                padding: "10px 16px", 
                                textAlign: "left", 
                                fontWeight: "500", 
                                borderBottom: `1px solid ${borderColor}`,
                              }}>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRequest.requestHeaders?.map((header, index) => (
                              <tr key={index} style={{ borderBottom: index < (selectedRequest.requestHeaders?.length || 0) - 1 ? `1px solid ${borderColor}` : 'none' }}>
                                <td style={{ 
                                  padding: "10px 16px", 
                                  fontWeight: "500", 
                                  fontSize: "13px"
                                }}>{header.name}</td>
                                <td style={{ 
                                  padding: "10px 16px", 
                                  fontSize: "13px", 
                                  wordBreak: "break-all",
                                  position: "relative"
                                }}>
                                  {header.value}
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(header.value);
                                      showToast("Header value copied to clipboard");
                                    }}
                                    style={{
                                      position: "absolute",
                                      right: "16px",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      opacity: 0.7,
                                      color: textColor,
                                    }}
                                    title="Copy value"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <h3 style={{ fontWeight: "bold", marginBottom: "16px", fontSize: "16px" }}>Response Headers ({selectedRequest.responseHeaders?.length || 0})</h3>
                      
                      <div style={{ 
                        border: `1px solid ${borderColor}`, 
                        borderRadius: "4px", 
                        overflow: "hidden",
                        backgroundColor: cardBg
                      }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={{ 
                                padding: "10px 16px", 
                                textAlign: "left", 
                                fontWeight: "500", 
                                borderBottom: `1px solid ${borderColor}`,
                                width: "30%"
                              }}>Name</th>
                              <th style={{ 
                                padding: "10px 16px", 
                                textAlign: "left", 
                                fontWeight: "500", 
                                borderBottom: `1px solid ${borderColor}`,
                              }}>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRequest.responseHeaders?.map((header, index) => (
                              <tr key={index} style={{ borderBottom: index < (selectedRequest.responseHeaders?.length || 0) - 1 ? `1px solid ${borderColor}` : 'none' }}>
                                <td style={{ 
                                  padding: "10px 16px", 
                                  fontWeight: "500", 
                                  fontSize: "13px"
                                }}>{header.name}</td>
                                <td style={{ 
                                  padding: "10px 16px", 
                                  fontSize: "13px", 
                                  wordBreak: "break-all",
                                  position: "relative"
                                }}>
                                  {header.value}
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(header.value);
                                      showToast("Header value copied to clipboard");
                                    }}
                                    style={{
                                      position: "absolute",
                                      right: "16px",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      opacity: 0.7,
                                      color: textColor,
                                    }}
                                    title="Copy value"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "request" && (
                  <div style={{ padding: "12px 16px" }}>
                    <h3 style={{ fontWeight: "bold", marginBottom: "16px", fontSize: "16px" }}>Request Body</h3>
                    <div style={{ 
                      border: `1px solid ${borderColor}`, 
                      borderRadius: "4px", 
                      overflow: "hidden",
                      backgroundColor: cardBg
                    }}>
                      {selectedRequest.requestBody ? (
                        <div style={{ padding: "16px" }}>
                          {(() => {
                            try {
                              const jsonData = typeof selectedRequest.requestBody === 'string' 
                                ? JSON.parse(selectedRequest.requestBody) 
                                : selectedRequest.requestBody;
                              
                              return (
                                <>
                                  <div style={{ 
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    marginBottom: "8px",
                                    gap: "8px",
                                    alignItems: "center"
                                  }}>
                                    <div style={{ position: "relative", flex: 1 }}>
                                      <input
                                        type="text"
                                        placeholder="Search in JSON..."
                                        value={requestJsonSearch}
                                        onChange={(e) => setRequestJsonSearch(e.target.value)}
                                        style={{
                                          padding: "4px 8px 4px 28px",
                                          fontSize: "12px",
                                          width: "100%",
                                          border: `1px solid ${borderColor}`,
                                          borderRadius: "4px",
                                          backgroundColor: isDark ? "#242a38" : "#fff",
                                          color: textColor
                                        }}
                                      />
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="14" 
                                        height="14" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                        style={{
                                          position: "absolute",
                                          left: "8px",
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          color: isDark ? "#adb5bd" : "#6c757d",
                                          pointerEvents: "none"
                                        }}
                                      >
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                      </svg>
                                      {requestJsonSearch && (
                                        <button
                                          onClick={() => setRequestJsonSearch("")}
                                          style={{
                                            position: "absolute",
                                            right: "8px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            cursor: "pointer",
                                            color: isDark ? "#adb5bd" : "#6c757d"
                                          }}
                                        >
                                          &times;
                                        </button>
                                      )}
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                      <button
                                        onClick={() => {
                                          setRequestJsonCollapsed(1);
                                          setRequestJsonKey(prevKey => prevKey + 1);
                                        }}
                                        style={{
                                          padding: "4px 8px",
                                          backgroundColor: isDark ? "#2d3348" : "#e9ecef",
                                          border: `1px solid ${borderColor}`,
                                          color: textColor,
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                          fontSize: "12px"
                                        }}
                                      >
                                        Collapse All
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRequestJsonCollapsed(false);
                                          setRequestJsonKey(prevKey => prevKey + 1);
                                        }}
                                        style={{
                                          padding: "4px 8px",
                                          backgroundColor: isDark ? "#2d3348" : "#e9ecef",
                                          border: `1px solid ${borderColor}`,
                                          color: textColor,
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                          fontSize: "12px"
                                        }}
                                      >
                                        Expand All
                                      </button>
                                    </div>
                                  </div>
                                  <ReactJson 
                                    key={requestJsonKey}
                                    src={jsonData}
                                    theme={isDark ? "monokai" : "rjv-default"}
                                    collapsed={requestJsonCollapsed}
                                    displayDataTypes={false}
                                    enableClipboard={true}
                                    name={null}
                                    {...(requestJsonSearch ? {
                                      shouldCollapse: (field: any) => {
                                        // Always expand if there's a search term
                                        if (requestJsonSearch) {
                                          const fieldName = String(field.name).toLowerCase();
                                          const fieldValue = JSON.stringify(field.value || '').toLowerCase();
                                          return !fieldName.includes(requestJsonSearch.toLowerCase()) && 
                                                !fieldValue.includes(requestJsonSearch.toLowerCase());
                                        }
                                        return typeof requestJsonCollapsed === 'number' 
                                          ? (field.depth || 0) >= requestJsonCollapsed 
                                          : requestJsonCollapsed;
                                      }
                                    } : {})}
                                  />
                                </>
                              );
                            } catch (error) {
                              // If not valid JSON, display as text
                              return (
                                <pre style={{
                                  margin: 0,
                                  fontSize: "13px",
                                  whiteSpace: "pre-wrap",
                                }}>
                                  {typeof selectedRequest.requestBody === 'string' 
                                    ? selectedRequest.requestBody 
                                    : JSON.stringify(selectedRequest.requestBody, null, 2)}
                                </pre>
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        <div style={{ padding: "16px", color: isDark ? "#adb5bd" : "#6c757d", textAlign: "center" }}>
                          No request body available
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTab === "response" && (
                  <div style={{ padding: "12px 16px" }}>
                    <h3 style={{ fontWeight: "bold", marginBottom: "16px", fontSize: "16px" }}>Response Body</h3>
                    <div style={{ 
                      border: `1px solid ${borderColor}`, 
                      borderRadius: "4px", 
                      overflow: "hidden",
                      backgroundColor: cardBg
                    }}>
                      {selectedRequest.responseBody ? (
                        <div style={{ padding: "16px" }}>
                          {(() => {
                            try {
                              // First try to parse as JSON
                              if (selectedRequest.contentType?.includes("application/json") || 
                                  (selectedRequest.responseBody && selectedRequest.responseBody.trim().startsWith('{'))) {
                                const jsonData = JSON.parse(selectedRequest.responseBody);
                                return (
                                  <>
                                    <div style={{ 
                                      display: "flex", 
                                      justifyContent: "space-between", 
                                      marginBottom: "8px",
                                      gap: "8px",
                                      alignItems: "center"
                                    }}>
                                      <div style={{ position: "relative", flex: 1 }}>
                                        <input
                                          type="text"
                                          placeholder="Search in JSON..."
                                          value={responseJsonSearch}
                                          onChange={(e) => setResponseJsonSearch(e.target.value)}
                                          style={{
                                            padding: "4px 8px 4px 28px",
                                            fontSize: "12px",
                                            width: "100%",
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: "4px",
                                            backgroundColor: isDark ? "#242a38" : "#fff",
                                            color: textColor
                                          }}
                                        />
                                        <svg 
                                          xmlns="http://www.w3.org/2000/svg" 
                                          width="14" 
                                          height="14" 
                                          viewBox="0 0 24 24" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                          style={{
                                            position: "absolute",
                                            left: "8px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: isDark ? "#adb5bd" : "#6c757d",
                                            pointerEvents: "none"
                                          }}
                                        >
                                          <circle cx="11" cy="11" r="8"></circle>
                                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        </svg>
                                        {responseJsonSearch && (
                                          <button
                                            onClick={() => setResponseJsonSearch("")}
                                            style={{
                                              position: "absolute",
                                              right: "8px",
                                              top: "50%",
                                              transform: "translateY(-50%)",
                                              background: "none",
                                              border: "none",
                                              padding: 0,
                                              cursor: "pointer",
                                              color: isDark ? "#adb5bd" : "#6c757d"
                                            }}
                                          >
                                            &times;
                                          </button>
                                        )}
                                      </div>
                                      <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                          onClick={() => {
                                            setResponseJsonCollapsed(1);
                                            setResponseJsonKey(prevKey => prevKey + 1);
                                          }}
                                          style={{
                                            padding: "4px 8px",
                                            backgroundColor: isDark ? "#2d3348" : "#e9ecef",
                                            border: `1px solid ${borderColor}`,
                                            color: textColor,
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "12px"
                                          }}
                                        >
                                          Collapse All
                                        </button>
                                        <button
                                          onClick={() => {
                                            setResponseJsonCollapsed(false);
                                            setResponseJsonKey(prevKey => prevKey + 1);
                                          }}
                                          style={{
                                            padding: "4px 8px",
                                            backgroundColor: isDark ? "#2d3348" : "#e9ecef",
                                            border: `1px solid ${borderColor}`,
                                            color: textColor,
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "12px"
                                          }}
                                        >
                                          Expand All
                                        </button>
                                      </div>
                                    </div>
                                    <ReactJson 
                                      key={responseJsonKey}
                                      src={jsonData}
                                      theme={isDark ? "monokai" : "rjv-default"}
                                      collapsed={responseJsonCollapsed}
                                      displayDataTypes={false}
                                      enableClipboard={true}
                                      name={null}
                                      {...(responseJsonSearch ? {
                                        shouldCollapse: (field: any) => {
                                          // Always expand if there's a search term
                                          if (responseJsonSearch) {
                                            const fieldName = String(field.name).toLowerCase();
                                            const fieldValue = JSON.stringify(field.value || '').toLowerCase();
                                            return !fieldName.includes(responseJsonSearch.toLowerCase()) && 
                                                  !fieldValue.includes(responseJsonSearch.toLowerCase());
                                          }
                                          return typeof responseJsonCollapsed === 'number' 
                                            ? (field.depth || 0) >= responseJsonCollapsed 
                                            : responseJsonCollapsed;
                                        }
                                      } : {})}
                                    />
                                  </>
                                );
                              } else {
                                // Not JSON or doesn't look like JSON
                                throw new Error("Not JSON");
                              }
                            } catch (error) {
                              // If not valid JSON, display as text
                              return (
                                <pre style={{
                                  margin: 0,
                                  fontSize: "13px",
                                  whiteSpace: "pre-wrap",
                                }}>
                                  {selectedRequest.responseBody}
                                </pre>
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        <div style={{ padding: "16px", color: isDark ? "#adb5bd" : "#6c757d", textAlign: "center" }}>
                          No response body available
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTab === "auth" && (
                  <div style={{ padding: "12px 16px" }}>
                    <h3 style={{ fontWeight: "bold", marginBottom: "16px", fontSize: "16px" }}>Authentication</h3>
                    
                    <div style={{ 
                      border: `1px solid ${borderColor}`, 
                      borderRadius: "4px", 
                      overflow: "hidden", 
                      backgroundColor: cardBg
                    }}>
                      {selectedRequest.requestHeaders?.find(h => h.name.toLowerCase() === "authorization") ? (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {selectedRequest.requestHeaders
                              .filter(header => header.name.toLowerCase() === "authorization")
                              .map((header, index) => (
                                <tr key={index}>
                                  <td style={{ 
                                    padding: "16px", 
                                    fontSize: "13px", 
                                    wordBreak: "break-all"
                                  }}>
                                    <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                                      {header.name}:
                                    </div>
                                    <div style={{ fontFamily: "monospace" }}>
                                      {header.value}
                                    </div>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(header.value);
                                        showToast("Auth header value copied to clipboard");
                                      }}
                                      style={{
                                        marginTop: "12px",
                                        padding: "6px 12px",
                                        backgroundColor: isDark ? "#2d3348" : "#e9ecef",
                                        border: `1px solid ${borderColor}`,
                                        color: textColor,
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px"
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                      </svg>
                                      Copy Auth Value
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ padding: "16px", color: isDark ? "#adb5bd" : "#6c757d", textAlign: "center" }}>
                          No authentication information found
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTab === "preview" && (
                  <div style={{ padding: "12px 16px" }}>
                    {selectedRequest.contentType?.includes("image/") ? (
                      <img 
                        src={selectedRequest.url} 
                        alt="Preview" 
                        style={{ maxWidth: "100%", border: `1px solid ${borderColor}`, borderRadius: "4px" }}
                      />
                    ) : selectedRequest.contentType?.includes("text/html") ? (
                      <iframe 
                        src={selectedRequest.url} 
                        style={{ width: "100%", height: "400px", border: `1px solid ${borderColor}`, borderRadius: "4px" }}
                        title="HTML Preview"
                      />
                    ) : (
                      <div style={{ color: isDark ? "#adb5bd" : "#6c757d", textAlign: "center", padding: "40px" }}>
                        Preview not available for this content type
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
      
      {/* Toast notifications */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={closeToast} />
        ))}
      </div>
    </div>
  )
}

export default NetworkPanel 