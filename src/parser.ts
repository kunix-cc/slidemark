export interface SlideData {
  index: number;
  markdown: string;
  html: string;
}

function splitSlides(content: string): string[] {
  const lines = content.split("\n");
  const slides: string[] = [];
  let current: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
    }

    if (!inCodeBlock && line.trim() === "---") {
      slides.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    slides.push(current.join("\n"));
  }

  return slides.filter((s) => s.trim().length > 0);
}

// @ts-ignore - Bun.markdown exists at runtime
const md = Bun.markdown;

import { highlightHtml } from "./highlighter.ts";

export function parseSlides(content: string): SlideData[] {
  const parts = splitSlides(content);
  return parts.map((markdown, index) => ({
    index,
    markdown: markdown.trim(),
    html: md.html(markdown.trim(), { gfm: true }),
  }));
}

export async function parseSlidesWithHighlight(content: string): Promise<SlideData[]> {
  const slides = parseSlides(content);
  return Promise.all(
    slides.map(async (slide) => ({
      ...slide,
      html: await highlightHtml(slide.html),
    }))
  );
}

export async function parseSlidesFromFile(path: string): Promise<SlideData[]> {
  const content = await Bun.file(path).text();
  return parseSlidesWithHighlight(content);
}
