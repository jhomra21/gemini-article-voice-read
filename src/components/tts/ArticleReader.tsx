import { createSignal, Show } from 'solid-js';
import { useMutation } from '@tanstack/solid-query';
import { useApi } from '~/components/ApiProvider';

interface ArticleReaderProps {
  className?: string;
  onArticleExtracted?: (articleContent: ArticleContent) => void;
}

export interface ArticleContent {
  url: string;
  title: string;
  siteName: string;
  content: string;
  extractedAt: string;
}

export function ArticleReader(props: ArticleReaderProps) {
  const [url, setUrl] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const { baseUrl } = useApi();

  // Create a mutation to handle the API call
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
      const articleContent = await response.json();
      console.log('Article extracted:', articleContent.title);
      return articleContent as ArticleContent;
    },
    onSuccess: (articleContent) => {
      // Call the callback with the article content
      if (props.onArticleExtracted) {
        props.onArticleExtracted(articleContent);
      }
    },
    onError: (error) => {
      console.error('Error extracting article:', error);
      setError(error.message);
    },
  }));

  // Function to handle form submission
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    // Extract article
    extractArticleMutation.mutate(url());
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
      <form onSubmit={handleSubmit} class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label for="url" class="font-medium">
            Enter a URL to extract article content
          </label>
          <div class="flex space-x-2">
            <input
              id="url"
              type="url"
              value={url()}
              onInput={(e) => setUrl(e.target.value)}
              class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/article"
              required
            />
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={extractArticleMutation.isPending || !isValidUrl(url())}
            >
              {extractArticleMutation.isPending ? 'Extracting...' : 'Extract Article'}
            </button>
          </div>
        </div>
        
        <Show when={error()}>
          <div class="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
            {error()}
          </div>
        </Show>
      </form>

      <Show when={extractArticleMutation.isPending}>
        <div class="flex items-center justify-center p-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Show>
    </div>
  );
} 