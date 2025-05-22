import { createSignal, Show } from 'solid-js';
import type { ArticleContent } from './ArticleReader';

interface ArticleExtractorProps {
  className?: string;
  articleContent: ArticleContent;
  onTextSelected?: (text: string) => void;
}

export function ArticleExtractor(props: ArticleExtractorProps) {
  const [editMode, setEditMode] = createSignal(false);
  const [editedContent, setEditedContent] = createSignal(props.articleContent.content);
  
  // Function to handle text selection for TTS
  const handleSelectAll = () => {
    if (props.onTextSelected) {
      props.onTextSelected(editMode() ? editedContent() : props.articleContent.content);
    }
  };
  
  // Function to toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode());
    
    // Reset edited content when enabling edit mode
    if (!editMode()) {
      setEditedContent(props.articleContent.content);
    }
  };
  
  return (
    <div class={`flex flex-col gap-4 ${props.className || ''}`}>
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold">{props.articleContent.title}</h2>
          <div class="text-sm text-gray-500">
            Source: {props.articleContent.siteName}
          </div>
        </div>
        
        <div class="flex justify-between items-center">
          <a 
            href={props.articleContent.url} 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-blue-500 hover:underline text-sm"
          >
            Original Article
          </a>
          
          <div class="flex gap-2">
            <button
              type="button"
              onClick={toggleEditMode}
              class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {editMode() ? 'Preview' : 'Edit Content'}
            </button>
            
            <button
              type="button"
              onClick={handleSelectAll}
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Use for TTS
            </button>
          </div>
        </div>
      </div>
      
      <div class="border border-gray-300 rounded-md p-4 bg-white">
        <Show when={editMode()}>
          <textarea
            value={editedContent()}
            onInput={(e) => setEditedContent(e.target.value)}
            class="w-full h-96 p-2 border-none focus:outline-none focus:ring-0"
            placeholder="Article content..."
          />
        </Show>
        
        <Show when={!editMode()}>
          <div class="prose max-w-none h-96 overflow-y-auto">
            {editMode() ? editedContent() : props.articleContent.content.split('\n\n').map((paragraph) => (
              <p class="mb-4">{paragraph}</p>
            ))}
          </div>
        </Show>
      </div>
      
      <div class="text-sm text-gray-500">
        Extracted at: {new Date(props.articleContent.extractedAt).toLocaleString()}
      </div>
    </div>
  );
} 