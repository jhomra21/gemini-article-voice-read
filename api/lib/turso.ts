import { createClient } from "@libsql/client";

export const createTursoClient = (env: {
  VITE_TURSO_DATABASE_URL: string;
  VITE_TURSO_AUTH_TOKEN: string;
}) => {
  return createClient({
    url: env.VITE_TURSO_DATABASE_URL,
    authToken: env.VITE_TURSO_AUTH_TOKEN,
  });
}; 