export interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

export type SpeakerMode = 'single' | 'multi';

export interface Speaker {
  id: string;
  nameInPrompt: string; // Name used in the text prompt (e.g., "Joe", "Speaker1")
  voiceId: string;     // Selected voice ID from VOICE_OPTIONS
}

// Types mirroring Python SDK for Gemini TTS config (for JS SDK's config object)
export interface PrebuiltVoiceConfigJS {
  voiceName: string; // e.g., 'Kore', 'Puck'
}

export interface VoiceConfigJS {
  prebuiltVoiceConfig: PrebuiltVoiceConfigJS;
}

export interface SpeakerVoiceConfigJS {
  speaker: string; // Corresponds to Speaker.nameInPrompt
  voiceConfig: VoiceConfigJS;
}

export interface MultiSpeakerVoiceConfigJS {
  speakerVoiceConfigs: SpeakerVoiceConfigJS[];
}

export interface SpeechConfigJS {
  voiceConfig?: VoiceConfigJS;
  multiSpeakerVoiceConfig?: MultiSpeakerVoiceConfigJS;
}

// This was for the non-streaming ai.models.generateContent config
export interface GenerateContentConfigTTS {
  responseModalities?: string[]; // Should be ["AUDIO"]
  speechConfig?: SpeechConfigJS;
}

// New type for config object passed to ai.models.generateContentStream
export interface GenerateContentStreamConfigTTS {
  responseModalities?: string[]; // Should be ["AUDIO"]
  speechConfig?: SpeechConfigJS;
  // Add other relevant stream config parameters if any, e.g. temperature
  temperature?: number; 
}

export interface ApiKeyError {
  message: string;
}

export const TTS_MODELS = {
  FLASH: 'gemini-2.5-flash-preview-tts',
  PRO: 'gemini-2.5-pro-preview-tts',
};

export const TEXT_GENERATION_MODEL = 'gemini-2.5-flash-preview-04-17';

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Zephyr', name: 'Zephyr', description: 'Bright' },
  { id: 'Puck', name: 'Puck', description: 'Upbeat' },
  { id: 'Charon', name: 'Charon', description: 'Informative' },
  { id: 'Kore', name: 'Kore', description: 'Firm' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Excitable' },
  { id: 'Leda', name: 'Leda', description: 'Youthful' },
  { id: 'Orus', name: 'Orus', description: 'Firm' },
  { id: 'Aoede', name: 'Aoede', description: 'Breezy' },
  { id: 'Callirhoe', name: 'Callirhoe', description: 'Easy-going' },
  { id: 'Autonoe', name: 'Autonoe', description: 'Bright' },
  { id: 'Enceladus', name: 'Enceladus', description: 'Breathy' },
  { id: 'Iapetus', name: 'Iapetus', description: 'Clear' },
  { id: 'Umbriel', name: 'Umbriel', description: 'Easy-going' },
  { id: 'Algieba', name: 'Algieba', description: 'Smooth' },
  { id: 'Despina', name: 'Despina', description: 'Smooth' },
  { id: 'Erinome', name: 'Erinome', description: 'Clear' },
  { id: 'Algenib', name: 'Algenib', description: 'Gravelly' },
  { id: 'Rasalgethi', name: 'Rasalgethi', description: 'Informative' },
  { id: 'Laomedeia', name: 'Laomedeia', description: 'Upbeat' },
  { id: 'Achernar', name: 'Achernar', description: 'Soft' },
  { id: 'Alnilam', name: 'Alnilam', description: 'Firm' },
  { id: 'Schedar', name: 'Schedar', description: 'Even' },
  { id: 'Gacrux', name: 'Gacrux', description: 'Mature' },
  { id: 'Pulcherrima', name: 'Pulcherrima', description: 'Forward' },
  { id: 'Achird', name: 'Achird', description: 'Friendly' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', description: 'Casual' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', description: 'Gentle' },
  { id: 'Sadachbia', name: 'Sadachbia', description: 'Lively' },
  { id: 'Sadaltager', name: 'Sadaltager', description: 'Knowledgeable' },
  { id: 'Sulafar', name: 'Sulafar', description: 'Warm' },
];

export const DEFAULT_VOICE_ID = VOICE_OPTIONS[0].id;
export const MAX_SPEAKERS = 2;

export interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
} 