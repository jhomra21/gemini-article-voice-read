import { Hono, type Context } from 'hono'

// Define bindings for environment variables
type Bindings = {
  GEMINI_API_KEY: string;
}

const articleRouter = new Hono<{ Bindings: Bindings }>();

/**
 * Extract article content from a URL
 * This endpoint fetches a webpage and extracts the main article content
 */
articleRouter.post('/extract', async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { url } = await c.req.json();
    
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }
    
    console.log(`Processing article extraction request for URL: ${url}`);
    
    try {
      // Fetch the webpage content
      const articleContent = await fetchArticleContent(url);
      return c.json(articleContent);
    } catch (error: unknown) {
      console.error('Error extracting article:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ 
        error: 'Failed to extract article content', 
        details: errorMessage 
      }, 500);
    }
  } catch (error: unknown) {
    console.error('Error processing request:', error);
    return c.json({ error: 'Invalid request format' }, 400);
  }
});

/**
 * Fetches and extracts the main content from a URL
 * Uses a simplified extraction algorithm to get the main article content
 */
async function fetchArticleContent(url: string) {
  try {
    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
    
    // Simple content extraction - gets the text from article, main, or content divs
    // This is a simple implementation - in a production app, you'd use a more robust solution
    const contentRegex = /<article[^>]*>([\s\S]*?)<\/article>|<main[^>]*>([\s\S]*?)<\/main>|<div[^>]*class="(?:.*?\b)(?:content|article|post)(?:\b.*?)"[^>]*>([\s\S]*?)<\/div>/gi;
    const contentMatches = [...html.matchAll(contentRegex)];
    
    let content = '';
    
    if (contentMatches.length > 0) {
      // Use the longest match as it's likely the main content
      const longestMatch = contentMatches.reduce((longest, match) => {
        const matchContent = match[1] || match[2] || match[3] || '';
        return matchContent.length > longest.length ? matchContent : longest;
      }, '');
      
      // Remove HTML tags and clean up the text
      content = cleanHtml(longestMatch);
    } else {
      // Fallback: extract paragraphs from the body
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        const paragraphs = [...bodyMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
          .map(m => m[1])
          .filter(p => p.trim().length > 100); // Only paragraphs with meaningful content
        
        content = paragraphs.map(p => cleanHtml(p)).join('\n\n');
      }
    }
    
    // If still no content, use meta description as fallback
    if (!content) {
      const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
      content = metaDescMatch ? metaDescMatch[1] : 'Could not extract content. The page might be dynamic or protected.';
    }
    
    // Get the site name
    const siteNameMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"[^>]*>/i);
    const siteName = siteNameMatch ? siteNameMatch[1] : new URL(url).hostname;
    
    return {
      url,
      title,
      siteName,
      content,
      extractedAt: new Date().toISOString()
    };
  } catch (error: unknown) {
    console.error('Error in fetchArticleContent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch article: ${errorMessage}`);
  }
}

/**
 * Cleans HTML content by removing tags and normalizing whitespace
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export default articleRouter; 