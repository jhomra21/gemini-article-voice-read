import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import articleRouter from './routes/article'
import speechRouter from './routes/speech'
// import { convertToWav } from './lib/audio-utils'

// Define a type for the binding that Hono will expect for environment variables
type Bindings = {
    GEMINI_API_KEY: string;
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
  message: 'Gemini Article Reader API',
  version: '1.0.0',
  endpoints: ['/', '/speech/generate', '/article/extract']
}))

// Add article routes
app.route('/article', articleRouter)

// Add speech routes
app.route('/speech', speechRouter)

export default app