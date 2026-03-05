import type { SlideData } from "./parser.ts";
import { buildHtml, type TemplateOptions } from "./template.ts";

export function renderToString(slides: SlideData[], options?: TemplateOptions): string {
  return buildHtml(slides, options);
}

export async function renderToFile(
  slides: SlideData[],
  outputPath: string,
  options?: TemplateOptions
): Promise<void> {
  const html = buildHtml(slides, options);
  await Bun.write(outputPath, html);
}
