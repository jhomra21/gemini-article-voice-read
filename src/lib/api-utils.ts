/**
 * Returns the base API URL depending on the current environment
 * In development: http://127.0.0.1:8787
 * In production: [your-worker].workers.dev or the configured URL
 */
export function getApiBaseUrl(): string {
  // Check if we're in development mode (using Vite's env variable)
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    return 'http://127.0.0.1:8787';
  }
  
  // In production, use the deployed worker URL
  // This can be customized based on your Cloudflare deployment
  return 'https://gemini-article-voice-read.workers.dev';
} 