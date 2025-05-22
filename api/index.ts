import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import albums from './albums'
import songs from './songs'

// Define a type for the binding that Hono will expect for environment variables
type Bindings = {
  VITE_TURSO_DATABASE_URL: string;
  VITE_TURSO_AUTH_TOKEN: string;
  // Add other environment bindings if you have them
}



const app = new Hono<{ Bindings: Bindings }>()

// Apply CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}))

// Root endpoint
app.get('/', (c: Context<{ Bindings: Bindings }>) => c.json({
  message: 'Ana Maria Admin API',
  version: '1.0.0',
  endpoints: ['/albums', '/songs']
}))

// Mount album and song routes
app.route('/albums', albums)
app.route('/songs', songs)



export default app