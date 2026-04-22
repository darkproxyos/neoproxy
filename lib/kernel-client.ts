import axios from 'axios'

// Python kernel client configuration
const KERNEL_BASE_URL = process.env.KERNEL_URL || 'http://localhost:8000'

// Create axios instance with timeout and retry logic
const kernelClient = axios.create({
  baseURL: KERNEL_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
kernelClient.interceptors.request.use(
  (config) => {
    console.log(`[Kernel API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[Kernel API] Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
kernelClient.interceptors.response.use(
  (response) => {
    console.log(`[Kernel API] Response ${response.status} from ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('[Kernel API] Response error:', error.message)
    return Promise.reject(error)
  }
)

// Mock data for fallback
const MOCK_STATUS = {
  status: "offline",
  uptime: 0,
  modules: [],
  timestamp: new Date().toISOString(),
  version: "0.2.0",
  error: "Python kernel not available"
}

const MOCK_LOGS = {
  logs: [{
    id: "fallback_001",
    timestamp: new Date().toISOString(),
    level: "ERROR",
    module: "api",
    message: "Failed to connect to Python kernel",
    details: { error: "Connection refused", url: KERNEL_BASE_URL }
  }],
  total: 1,
  timestamp: new Date().toISOString()
}

const MOCK_REGISTER = {
  id: "fallback_obj_001",
  hash: "fallback_hash_001",
  status: "error",
  timestamp: new Date().toISOString(),
  error: "Python kernel not available"
}

// Helper function to handle kernel requests with fallback
async function withFallback<T>(
  request: () => Promise<T>,
  fallbackData: T
): Promise<T> {
  try {
    return await request()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.warn(`[Kernel API] Using fallback data due to: ${errorMessage}`)
    return fallbackData
  }
}

export { kernelClient, withFallback, MOCK_STATUS, MOCK_LOGS, MOCK_REGISTER }
