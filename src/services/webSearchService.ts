interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface DuckDuckGoResponse {
  AbstractText?: string;
  AbstractURL?: string;
  AbstractSource?: string;
  RelatedTopics?: Array<{
    Text?: string;
    FirstURL?: string;
    Topics?: Array<{ Text?: string; FirstURL?: string }>;
  }>;
  Results?: Array<{
    Text?: string;
    FirstURL?: string;
  }>;
}

/**
 * Search using DuckDuckGo Instant Answer API (no key, CORS-friendly).
 * Falls back to scraping related topics for broader coverage.
 */
export const webSearch = async (query: string): Promise<string> => {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Could not reach DuckDuckGo. Check your internet connection.");
  }

  if (!response.ok) {
    throw new Error(`Web search failed (${response.status})`);
  }

  const json = (await response.json()) as DuckDuckGoResponse;

  const results: SearchResult[] = [];

  // Instant answer / abstract
  if (json.AbstractText && json.AbstractURL) {
    results.push({
      title: json.AbstractSource ?? "Summary",
      url: json.AbstractURL,
      snippet: json.AbstractText
    });
  }

  // Direct results
  json.Results?.forEach((r) => {
    if (r.Text && r.FirstURL) {
      results.push({ title: r.Text.split(" - ")[0] ?? r.Text, url: r.FirstURL, snippet: r.Text });
    }
  });

  // Related topics (flat + nested)
  json.RelatedTopics?.forEach((topic) => {
    if (topic.Text && topic.FirstURL) {
      results.push({ title: topic.Text.split(" - ")[0] ?? topic.Text, url: topic.FirstURL, snippet: topic.Text });
    }
    topic.Topics?.forEach((sub) => {
      if (sub.Text && sub.FirstURL) {
        results.push({ title: sub.Text.split(" - ")[0] ?? sub.Text, url: sub.FirstURL, snippet: sub.Text });
      }
    });
  });

  if (results.length === 0) {
    return `[Web Search: no results found for "${query}"]`;
  }

  const top = results.slice(0, 6);
  const formatted = top
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
    .join("\n\n");

  return `[Web Search Results for: "${query}"]\n\n${formatted}\n\n[Use the above information to answer the user's question. Cite sources where relevant.]`;
};
