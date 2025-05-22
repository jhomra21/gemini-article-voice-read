import type { WavConversionOptions } from './types';

// Constants for WAV header generation
const RIFF_HEADER_SIZE = 44; // Standard WAV header size: 44 bytes

export function convertToWav(rawData: string, mimeType: string): Uint8Array {
  // First decode the base64 data
  const audioData = base64ToUint8Array(rawData);
  
  // Parse the MIME type to get information about the audio format
  const options = parseMimeType(mimeType);
  
  // Create the WAV header
  const wavHeader = createWavHeader(audioData.length, options);
  
  // Combine the header and audio data
  return concatUint8Arrays(wavHeader, audioData);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

export function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
    sampleRate: 24000, // Default sample rate if not specified
    bitsPerSample: 16, // Default bits per sample if not specified
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

/**
 * Creates a WAV header for audio data
 * @param dataLength Length of the audio data in bytes (excluding header)
 * @param options WAV configuration options
 * @returns Uint8Array containing the WAV header
 */
export function createWavHeader(dataLength: number, options: WavConversionOptions): Uint8Array {
  const {
    numChannels = 1,
    sampleRate = 24000,
    bitsPerSample = 16,
  } = options;

  // http://soundfile.sapp.org/doc/WaveFormat
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = new Uint8Array(RIFF_HEADER_SIZE);
  
  // Helper function to write string to Uint8Array
  const writeString = (str: string, offset: number) => {
    for (let i = 0; i < str.length; i++) {
      buffer[offset + i] = str.charCodeAt(i);
    }
  };
  
  // Helper function to write 32-bit little-endian integer
  const writeUInt32LE = (value: number, offset: number) => {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
    buffer[offset + 2] = (value >> 16) & 0xff;
    buffer[offset + 3] = (value >> 24) & 0xff;
  };
  
  // Helper function to write 16-bit little-endian integer
  const writeUInt16LE = (value: number, offset: number) => {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
  };

  // For streaming, we need to ensure the data size is more accurate
  // We might not know the exact size, but we should make a reasonable estimate
  const totalFileSize = RIFF_HEADER_SIZE + dataLength;
  const dataChunkSize = dataLength;

  writeString('RIFF', 0);                  // ChunkID
  writeUInt32LE(totalFileSize - 8, 4);     // ChunkSize (file size minus 8 bytes for RIFF header)
  writeString('WAVE', 8);                  // Format
  writeString('fmt ', 12);                 // Subchunk1ID
  writeUInt32LE(16, 16);                   // Subchunk1Size (PCM)
  writeUInt16LE(1, 20);                    // AudioFormat (1 = PCM)
  writeUInt16LE(numChannels, 22);          // NumChannels
  writeUInt32LE(sampleRate, 24);           // SampleRate
  writeUInt32LE(byteRate, 28);             // ByteRate
  writeUInt16LE(blockAlign, 32);           // BlockAlign
  writeUInt16LE(bitsPerSample, 34);        // BitsPerSample
  writeString('data', 36);                 // Subchunk2ID
  writeUInt32LE(dataChunkSize, 40);        // Subchunk2Size

  return buffer;
}

/**
 * Merges multiple audio chunks into a single WAV file
 * @param chunks Array of audio chunk Uint8Arrays
 * @param options WAV configuration options
 * @returns Uint8Array containing the complete WAV file
 */
export function mergeAudioChunks(chunks: Uint8Array[], options: WavConversionOptions): Uint8Array {
  if (!chunks.length) return new Uint8Array(0);
  
  // Calculate total audio data size
  let totalAudioSize = 0;
  for (const chunk of chunks) {
    totalAudioSize += chunk.length;
  }
  
  // Create WAV header for the complete file
  const header = createWavHeader(totalAudioSize, options);
  
  // Allocate buffer for the entire file
  const result = new Uint8Array(header.length + totalAudioSize);
  
  // Write header
  result.set(header, 0);
  
  // Write audio data
  let offset = header.length;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
} 