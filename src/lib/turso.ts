import { createClient } from "@libsql/client";

// Function to safely get environment variables in different contexts
const getEnvVar = (key: string): string | undefined => {
  // Browser context with Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  
  // Cloudflare Workers context
  if (typeof globalThis !== 'undefined' && 'VITE_TURSO_DATABASE_URL' in globalThis) {
    return (globalThis as any)[key];
  }
  
  return undefined;
};

// Get the database URL and auth token
const dbUrl = getEnvVar('VITE_TURSO_DATABASE_URL');
const authToken = getEnvVar('VITE_TURSO_AUTH_TOKEN');

if (!dbUrl || !authToken) {
  console.error('Missing Turso database credentials');
}

export const turso = createClient({
  url: dbUrl!,
  authToken: authToken!,
}); 