const HOSTED_API_URL = 'http://136.118.5.61'

export function getApiBase() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  }
  if (import.meta.env.PROD) {
    return HOSTED_API_URL
  }
  // Dev: use relative /api so Vite proxy sends to localhost:8080
  return ''
}
