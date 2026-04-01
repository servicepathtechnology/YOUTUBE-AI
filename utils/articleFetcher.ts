/**
 * Fetches and extracts readable text content from an article URL.
 * Uses native fetch + lightweight HTML parsing (no extra deps).
 */
export async function fetchArticleContent(url: string): Promise<{ title: string; content: string; thumbnail: string | null }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch article: HTTP ${res.status}`);

  const html = await res.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    || html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
    || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : new URL(url).hostname;

  // Extract OG image for thumbnail
  const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  const thumbnail = ogImageMatch ? ogImageMatch[1] : null;

  // Remove script, style, nav, header, footer, aside, form tags and their content
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Try to extract main article body
  const articleMatch = cleaned.match(/<article[\s\S]*?<\/article>/i)
    || cleaned.match(/<main[\s\S]*?<\/main>/i)
    || cleaned.match(/<div[^>]+(?:class|id)="[^"]*(?:article|content|post|entry|story|body)[^"]*"[\s\S]*?<\/div>/i);

  const bodyHtml = articleMatch ? articleMatch[0] : cleaned;

  // Strip all remaining HTML tags and decode entities
  const text = decodeHtmlEntities(
    bodyHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );

  if (text.length < 100) {
    throw new Error('Could not extract meaningful content from this URL. The page may require JavaScript or block scraping.');
  }

  // Limit to ~15000 words to avoid token overflow
  const words = text.split(/\s+/);
  const content = words.slice(0, 15000).join(' ');

  return { title, content, thumbnail };
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}
