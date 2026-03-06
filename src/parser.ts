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
import { embedImages } from "./image.ts";
import { dirname } from "node:path";

export function parseSlides(content: string): SlideData[] {
  const parts = splitSlides(content);
  return parts.map((markdown, index) => ({
    index,
    markdown: markdown.trim(),
    html: md.html(markdown.trim(), { gfm: true }),
  }));
}

export async function parseSlidesWithHighlight(content: string, shikiTheme?: string): Promise<SlideData[]> {
  const slides = parseSlides(content);
  return Promise.all(
    slides.map(async (slide) => ({
      ...slide,
      html: await highlightHtml(slide.html, shikiTheme),
    }))
  );
}

export interface ParseOptions {
  embedLocalImages?: boolean;
  shikiTheme?: string;
}

export async function parseSlidesFromFile(path: string, options: ParseOptions = {}): Promise<SlideData[]> {
  const { embedLocalImages = true, shikiTheme } = options;
  const content = await Bun.file(path).text();
  const slides = await parseSlidesWithHighlight(content, shikiTheme);

  if (!embedLocalImages) return slides;

  const basePath = dirname(path);
  return Promise.all(
    slides.map(async (slide) => ({
      ...slide,
      html: await embedImages(slide.html, basePath),
    }))
  );
}
