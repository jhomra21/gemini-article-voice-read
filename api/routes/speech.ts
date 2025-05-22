import { Hono, type Context } from 'hono'
import { GeminiService } from '../lib/gemini-service'
import type { TextToSpeechRequest } from '../lib/gemini-service'
import { createWavHeader } from '../lib/audio-utils'

// Define bindings for environment variables
type Bindings = {
  GEMINI_API_KEY: string;
}

const speechRouter = new Hono<{ Bindings: Bindings }>();

// Maximum text length for a single TTS request (2000 chars should be safe)
const MAX_CHUNK_SIZE = 2000;

/**
 * Text-to-speech endpoint
 * Converts text to speech using the Gemini API
 */
speechRouter.post('/generate', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    // Get API key from environment
    const apiKey = c.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500);
    }
    
    // Parse request body
    const requestData = await c.req.json() as TextToSpeechRequest;
    
    // Validate request
    if (!requestData.text) {
      return c.json({ error: 'Text is required' }, 400);
    }
    
    const fullText = requestData.text;
    console.log(`Processing TTS request for text length: ${fullText.length} characters`);
    
    // Check if text is too long and needs to be chunked
    if (fullText.length > MAX_CHUNK_SIZE) {
      console.log(`Text exceeds maximum chunk size (${MAX_CHUNK_SIZE}), processing first chunk`);
      
      // For now, just process the first chunk to make sure it works
      // In a real implementation, you'd want to process all chunks and combine them
      requestData.text = fullText.substring(0, MAX_CHUNK_SIZE);
      
      // Find a good breaking point (end of sentence)
      const lastPeriod = requestData.text.lastIndexOf('.');
      if (lastPeriod > MAX_CHUNK_SIZE * 0.7) { // Only break at period if it's not too early
        requestData.text = requestData.text.substring(0, lastPeriod + 1);
      }
      
      console.log(`Truncated text to ${requestData.text.length} characters`);
    }
    
    // Initialize Gemini service
    const geminiService = new GeminiService(apiKey);
    
    // Generate speech - collect all chunks into a buffer
    const audioDataChunks: Uint8Array[] = [];
    const audioStream = await geminiService.generateSpeech(requestData);
    
    const reader = audioStream.getReader();
    let done = false;
    
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        audioDataChunks.push(value);
      }
    }
    
    // Log the chunk counts and sizes for debugging
    console.log(`Received ${audioDataChunks.length} audio chunks`);
    audioDataChunks.forEach((chunk, i) => {
      console.log(`Chunk ${i+1}: ${chunk.length} bytes`);
    });
    
    // Check if we actually received any audio data
    if (audioDataChunks.length === 0 || audioDataChunks.every(chunk => chunk.length === 0)) {
      console.error('No audio data received from the API');
      return c.json({ 
        error: 'No audio data received from the TTS service',
        details: 'The API returned an empty response. The text might be too long or contain unsupported content.' 
      }, 500);
    }
    
    // Combine all chunks into a single Uint8Array
    let totalLength = 0;
    audioDataChunks.forEach(chunk => {
      totalLength += chunk.length;
    });
    
    console.log(`Total audio data size: ${totalLength} bytes`);
    
    const pcmData = new Uint8Array(totalLength);
    let offset = 0;
    
    audioDataChunks.forEach(chunk => {
      pcmData.set(chunk, offset);
      offset += chunk.length;
    });
    
    // Create WAV header according to Google's docs
    // PCM format with 24000 Hz sample rate, 1 channel (mono), 16-bit
    const wavHeader = createWavHeader(pcmData.length, {
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 16
    });
    
    // Concatenate header and PCM data to create a complete WAV file
    const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
    wavFile.set(wavHeader);
    wavFile.set(pcmData, wavHeader.length);
    
    console.log(`Final WAV file size: ${wavFile.length} bytes`);
    
    // Return the audio data with the correct content type
    return new Response(wavFile, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': wavFile.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return c.json({ 
      error: 'Failed to generate speech', 
      details: String(error),
      suggestion: 'Try with a shorter text or check if the API key is valid'
    }, 500);
  }
});

export default speechRouter; 