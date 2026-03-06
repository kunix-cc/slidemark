import { join } from "node:path";
import { getMimeType } from "./mime.ts";

// Matches single-line <img> tags with src attribute
const IMG_SRC_RE = /<img\s[^>]*?src=["']([^"']+)["'][^>]*?>/g;

function isRemoteOrData(src: string): boolean {
  return /^https?:\/\//i.test(src) || src.startsWith("data:");
}

function isLocalRelative(src: string): boolean {
  return !isRemoteOrData(src) && !src.startsWith("/");
}

export function extractLocalImagePaths(html: string): string[] {
  const paths: string[] = [];
  for (const m of html.matchAll(IMG_SRC_RE)) {
    const src = m[1]!;
    if (!isRemoteOrData(src)) {
      paths.push(src);
    }
  }
  return paths;
}

export async function encodeImageToDataUri(filePath: string): Promise<string | null> {
  const mime = getMimeType(filePath);
  if (!mime) return null;

  const file = Bun.file(filePath);
  if (!(await file.exists())) return null;

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mime};base64,${base64}`;
}

function extractAlt(imgTag: string): string {
  const m = imgTag.match(/alt=["']([^"']*)["']/);
  return m ? m[1]! : "";
}

export async function embedImages(html: string, basePath: string): Promise<string> {
  // Collect unique local relative src values and resolve them in parallel
  const pendingMap = new Map<string, Promise<string | null>>();

  for (const m of html.matchAll(IMG_SRC_RE)) {
    const src = m[1]!;
    if (isLocalRelative(src) && !pendingMap.has(src)) {
      const absPath = join(basePath, src);
      pendingMap.set(src, encodeImageToDataUri(absPath));
    }
  }

  if (pendingMap.size === 0) return html;

  // Resolve all data URIs in parallel
  const resolvedMap = new Map<string, string | null>();
  await Promise.all(
    [...pendingMap.entries()].map(async ([src, p]) => {
      resolvedMap.set(src, await p);
    })
  );

  // Replace all matches using callback to avoid $-substitution bugs and handle duplicates
  return html.replace(IMG_SRC_RE, (full, src: string) => {
    if (!isLocalRelative(src)) return full;
    const dataUri = resolvedMap.get(src);
    if (dataUri) {
      return full
        .replace(`src="${src}"`, () => `src="${dataUri}"`)
        .replace(`src='${src}'`, () => `src='${dataUri}'`);
    }
    const alt = extractAlt(full);
    return alt ? `<span class="image-placeholder">${alt}</span>` : "";
  });
}
