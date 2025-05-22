import { TextToSpeech } from '../components/tts/TextToSpeech';

export default function TTSPage() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Gemini Text & Article to Speech</h1>
      <p class="text-gray-600 mb-8">
        Convert your text or web articles to natural-sounding speech using Google's Gemini API.
      </p>
      
      <TextToSpeech className="max-w-2xl" />
    </div>
  );
} 