import { createHighlighter, type Highlighter } from "shiki";

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: [],
    });
  }
  return highlighter;
}

const PRECODE_RE =
  /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function highlightHtml(html: string): Promise<string> {
  const hl = await getHighlighter();
  const matches: { full: string; lang: string; code: string }[] = [];

  for (const m of html.matchAll(PRECODE_RE)) {
    matches.push({ full: m[0], lang: m[1]!, code: decodeHtmlEntities(m[2]!) });
  }

  if (matches.length === 0) return html;

  // Load any missing languages
  const loadedLangs = new Set(hl.getLoadedLanguages());
  const needed = [...new Set(matches.map((m) => m.lang))].filter(
    (l) => !loadedLangs.has(l)
  );
  for (const lang of needed) {
    try {
      await hl.loadLanguage(lang as any);
    } catch {
      // Unknown language - will fall back to plain text
    }
  }

  let result = html;
  for (const { full, lang, code } of matches) {
    const loaded = new Set(hl.getLoadedLanguages());
    const highlighted = hl.codeToHtml(code, {
      lang: loaded.has(lang) ? lang : "text",
      theme: "github-dark",
    });
    result = result.replace(full, highlighted);
  }

  return result;
}
