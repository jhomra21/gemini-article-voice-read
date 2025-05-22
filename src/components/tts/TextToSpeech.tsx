import { createSignal, Show, onCleanup, createEffect } from 'solid-js';
import { useMutation } from '@tanstack/solid-query';
import { VOICE_OPTIONS, type VoiceOption } from '~/lib/voice-options';
import { useApi } from '~/components/ApiProvider';
import { AutoplayToggle } from '../ui/AutoplayToggle';

interface TextToSpeechProps {
  className?: string;
}

interface ArticleContent {
  url: string;
  title: string;
  siteName: string;
  content: string;
  extractedAt: string;
}

type InputMode = 'text' | 'article';

export function TextToSpeech(props: TextToSpeechProps) {
  const [text, setText] = createSignal('');
  const [selectedVoice, setSelectedVoice] = createSignal(VOICE_OPTIONS[0].id);
  const [audioUrl, setAudioUrl] = createSignal<string | null>(null);
  const [rawAudioBlob, setRawAudioBlob] = createSignal<Blob | null>(null);
  const [, setIsPlaying] = createSignal(false);
  const [autoplay, setAutoplay] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [showDebug, setShowDebug] = createSignal(false);
  const [processingStatus, setProcessingStatus] = createSignal<string | null>(null);
  const { baseUrl } = useApi();
  let audioRef: HTMLAudioElement | undefined;
  
  // Article-related state
  const [inputMode, setInputMode] = createSignal<InputMode>('text');
  const [articleUrl, setArticleUrl] = createSignal('');
  const [articleContent, setArticleContent] = createSignal<ArticleContent | null>(null);
  const [editMode, setEditMode] = createSignal(false);
  const [editedArticleContent, setEditedArticleContent] = createSignal('');

  // Clean up any blob URLs when component unmounts
  onCleanup(() => {
    if (audioUrl()) {
      URL.revokeObjectURL(audioUrl()!);
    }
  });

  // Create effect to handle autoplay when audio URL changes
  createEffect(() => {
    if (audioUrl() && autoplay() && audioRef) {
      console.log('Autoplaying audio...');
      // Brief timeout to ensure the audio element has loaded the new source
      setTimeout(() => {
        audioRef?.play().catch(err => {
          console.error('Autoplay failed:', err);
          setError(`Autoplay failed: ${err.message || 'Browser blocked autoplay'}`);
        });
      }, 100);
    }
  });

  // Create a mutation to handle the API call for TTS
  const generateSpeechMutation = useMutation(() => ({
    mutationFn: async (text: string) => {
      setError(null);
      setRawAudioBlob(null);
      
      // Show processing status
      setProcessingStatus(`Preparing text (${text.length} characters)...`);
      
      console.log(`Sending TTS request to ${baseUrl}/speech/generate`);
      console.log(`Text length: ${text.length} characters`);
      console.log(`Selected voice: ${selectedVoice()}`);
      
      // Check if text is very long and warn user
      if (text.length > 2000) {
        setProcessingStatus(`Text is long (${text.length} chars). Only processing first part...`);
      }
      const modifiedText = 'read this out calmly and in a friendly tone(excited when necessary): ' + text;
      
      setProcessingStatus('Generating audio...');
      const response = await fetch(`${baseUrl}/speech/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: modifiedText,
          voiceId: selectedVoice(),
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || 'Failed to generate speech';
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
          if (errorData.suggestion) {
            errorMessage += `\n\nSuggestion: ${errorData.suggestion}`;
          }
        } catch (e) {
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // Get the audio data as an ArrayBuffer
      setProcessingStatus('Receiving audio data...');
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Received audio data: ${arrayBuffer.byteLength} bytes`);
      
      if (arrayBuffer.byteLength <= 44) {
        throw new Error('Received empty audio data (only header). Text may be too long or contains unsupported content.');
      }
      
      setProcessingStatus('Processing audio...');
      // Create a blob with the correct mime type
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
      setRawAudioBlob(audioBlob);
      
      // Create a URL for the blob
      const url = URL.createObjectURL(audioBlob);
      console.log('Created blob URL:', url);
      setProcessingStatus(null);
      
      // Return the URL
      return url;
    },
    onSuccess: (url) => {
      // Set the audio URL
      setAudioUrl(url);
      setProcessingStatus(null);
    },
    onError: (error) => {
      console.error('Error generating speech:', error);
      setError(error.message);
      setProcessingStatus(null);
    },
  }));
  
  // Create a mutation to handle article extraction
  const extractArticleMutation = useMutation(() => ({
    mutationFn: async (url: string) => {
      setError(null);
      
      console.log(`Sending article extraction request to ${baseUrl}/article/extract`);
      console.log(`URL: ${url}`);
      
      const response = await fetch(`${baseUrl}/article/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || 'Failed to extract article';
        } catch (e) {
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // Get the article content
      const article = await response.json();
      console.log('Article extracted:', article.title);
      return article as ArticleContent;
    },
    onSuccess: (article) => {
      setArticleContent(article);
      setEditedArticleContent(article.content);
    },
    onError: (error) => {
      console.error('Error extracting article:', error);
      setError(error.message);
    },
  }));

  // Function to handle form submission for TTS
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    // Clear previous audio if any
    if (audioUrl()) {
      URL.revokeObjectURL(audioUrl()!);
      setAudioUrl(null);
    }
    
    // Get the text to convert based on current mode
    const textToConvert = inputMode() === 'text' 
      ? text() 
      : (editMode() ? editedArticleContent() : articleContent()?.content || '');
    
    if (!textToConvert.trim()) {
      setError('Please enter some text to convert');
      return;
    }
    
    // Generate speech
    generateSpeechMutation.mutate(textToConvert);
  };
  
  // Function to handle article extraction
  const handleArticleExtract = (e: Event) => {
    e.preventDefault();
    
    if (!isValidUrl(articleUrl())) {
      setError('Please enter a valid URL');
      return;
    }
    
    // Extract article
    extractArticleMutation.mutate(articleUrl());
  };

  // Function to handle audio playback
  const handlePlay = () => {
    setIsPlaying(true);
    console.log('Audio playback started');
  };

  const handlePause = () => {
    setIsPlaying(false);
    console.log('Audio playback paused');
  };

  const handleEnded = () => {
    setIsPlaying(false);
    console.log('Audio playback ended');
  };
  
  const handleError = (e: Event) => {
    const audioElement = e.target as HTMLAudioElement;
    console.error('Audio playback error:', audioElement.error);
    setError(`Audio playback error: ${audioElement.error?.message || 'Unknown error'}`);
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug());
  };

  const downloadRawAudio = () => {
    if (rawAudioBlob()) {
      const downloadUrl = URL.createObjectURL(rawAudioBlob()!);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `speech-${new Date().toISOString()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    }
  };

  const handleAutoplayChange = (enabled: boolean) => {
    console.log(`Autoplay ${enabled ? 'enabled' : 'disabled'}`);
    setAutoplay(enabled);
  };
  
  // Function to toggle edit mode for article content
  const toggleArticleEditMode = () => {
    setEditMode(!editMode());
    
    // Reset edited content when enabling edit mode
    if (!editMode() && articleContent()) {
      setEditedArticleContent(articleContent()!.content);
    }
  };
  
  // Function to validate URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div class={`flex flex-col gap-4 ${props.className || ''}`}>
      <h2 class="text-2xl font-semibold">Text to Speech</h2>
      
      {/* Mode selector */}
      <div class="flex border-b border-gray-300 mb-4">
        <button
          class={`py-2 px-4 ${inputMode() === 'text' ? 
            'border-b-2 border-blue-500 text-blue-600' : 
            'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setInputMode('text')}
        >
          Direct Text
        </button>
        <button
          class={`py-2 px-4 ${inputMode() === 'article' ? 
            'border-b-2 border-blue-500 text-blue-600' : 
            'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setInputMode('article')}
        >
          Article from URL
        </button>
      </div>
      
      {/* Direct Text Input Mode */}
      <Show when={inputMode() === 'text'}>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label for="text" class="font-medium">
              Enter text to convert to speech
            </label>
            <textarea
              id="text"
              value={text()}
              onInput={(e) => setText(e.target.value)}
              class="w-full h-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter text to convert to speech..."
              required
            />
          </div>
        </div>
      </Show>
      
      {/* Article Mode */}
      <Show when={inputMode() === 'article'}>
        <div class="flex flex-col gap-4">
          {/* URL Input Form */}
          <form onSubmit={handleArticleExtract} class="flex flex-col gap-2">
            <label for="article-url" class="font-medium">
              Enter a URL to extract article content
            </label>
            <div class="flex space-x-2">
              <input
                id="article-url"
                type="url"
                value={articleUrl()}
                onInput={(e) => setArticleUrl(e.target.value)}
                class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/article"
                required
              />
              <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={extractArticleMutation.isPending || !isValidUrl(articleUrl())}
              >
                {extractArticleMutation.isPending ? 'Extracting...' : 'Extract Article'}
              </button>
            </div>
          </form>
          
          {/* Show spinner while loading */}
          <Show when={extractArticleMutation.isPending}>
            <div class="flex items-center justify-center p-4">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </Show>
          
          {/* Article Content Display */}
          <Show when={articleContent()}>
            <div class="flex flex-col gap-4 border border-gray-200 rounded-md p-4">
              <div class="flex justify-between items-center">
                <h3 class="text-xl font-semibold">{articleContent()?.title}</h3>
                <div class="text-sm text-gray-500">
                  Source: {articleContent()?.siteName}
                </div>
              </div>
              
              <div class="flex justify-between items-center">
                <a 
                  href={articleContent()?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="text-blue-500 hover:underline text-sm"
                >
                  Original Article
                </a>
                
                <button
                  type="button"
                  onClick={toggleArticleEditMode}
                  class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editMode() ? 'Preview' : 'Edit Content'}
                </button>
              </div>
              
              <div class="border border-gray-300 rounded-md p-4 bg-white">
                <Show when={editMode()}>
                  <textarea
                    value={editedArticleContent()}
                    onInput={(e) => setEditedArticleContent(e.target.value)}
                    class="w-full h-64 p-2 border-none focus:outline-none focus:ring-0"
                    placeholder="Article content..."
                  />
                </Show>
                
                <Show when={!editMode() && articleContent()}>
                  <div class="prose max-w-none h-64 overflow-y-auto">
                    {articleContent()?.content.split('\n\n').map((paragraph) => (
                      <p class="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </Show>
              </div>
              
              <div class="text-sm text-gray-500">
                Extracted at: {new Date(articleContent()?.extractedAt || '').toLocaleString()}
              </div>
            </div>
          </Show>
        </div>
      </Show>
      
      {/* Common Voice Selection and TTS Controls */}
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-2">
          <label for="voice" class="font-medium">
            Select a voice
          </label>
          <select
            id="voice"
            value={selectedVoice()}
            onChange={(e) => setSelectedVoice(e.target.value)}
            class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VOICE_OPTIONS.map((voice: VoiceOption) => (
              <option value={voice.id}>
                {voice.name} - {voice.description}
              </option>
            ))}
          </select>
        </div>
        
        <div class="flex justify-end">
          <AutoplayToggle 
            defaultEnabled={true}
            onChange={handleAutoplayChange}
          />
        </div>
        
        <Show when={error()}>
          <div class="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
            {error()}
          </div>
        </Show>
        
        <button
          type="button"
          onClick={handleSubmit}
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={generateSpeechMutation.isPending}
        >
          {generateSpeechMutation.isPending ? 'Generating...' : 'Generate Speech'}
        </button>
      </div>
      
      {/* Audio Player */}
      <Show when={audioUrl()}>
        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-medium">Generated Audio</h3>
          <audio
            ref={audioRef}
            src={audioUrl()!}
            controls
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            class="w-full"
          />
          
          <div class="flex items-center gap-2 mt-2">
            <button 
              type="button"
              onClick={toggleDebug} 
              class="text-sm text-gray-500 underline"
            >
              {showDebug() ? "Hide Debug" : "Show Debug"}
            </button>
          </div>
          
          <Show when={showDebug()}>
            <div class="p-3 bg-gray-100 border border-gray-300 rounded-md mt-2">
              <h4 class="text-sm font-medium mb-2">Debug Info</h4>
              <p class="text-xs mb-2">API URL: {baseUrl}/speech/generate</p>
              <p class="text-xs mb-2">Audio size: {rawAudioBlob() ? (rawAudioBlob()!.size / 1024).toFixed(2) + ' KB' : 'N/A'}</p>
              <button
                type="button"
                onClick={downloadRawAudio}
                disabled={!rawAudioBlob()}
                class="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Download Raw Audio
              </button>
            </div>
          </Show>
        </div>
      </Show>

      {/* Processing Status Indicator */}
      <Show when={processingStatus()}>
        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <div class="flex items-center">
            <div class="w-4 h-4 mr-2 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            {processingStatus()}
          </div>
        </div>
      </Show>

      {/* Error Message */}
      <Show when={error()}>
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <strong>Error:</strong> {error()}
        </div>
      </Show>

      {/* Debug Info for Audio Playback Issues */}
      <Show when={showDebug() && rawAudioBlob()}>
        <div class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs font-mono">
          <div><strong>Audio info:</strong></div>
          <div>Size: {rawAudioBlob()?.size} bytes</div>
          <div>Type: {rawAudioBlob()?.type}</div>
          <button 
            onClick={downloadRawAudio}
            class="mt-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
          >
            Download Raw Audio
          </button>
        </div>
      </Show>
    </div>
  );
} 