import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { getMimeType } from "./mime.ts";

export { getMimeType } from "./mime.ts";

export interface StaticFileResult {
  path: string;
  mime: string;
}

export function resolveStaticFile(urlPath: string, baseDir: string): StaticFileResult | null {
  const decoded = decodeURIComponent(urlPath);

  // Fast-path rejection for path traversal attempts.
  // The resolve()+startsWith() check below is the authoritative guard.
  if (decoded.includes("..")) return null;

  const resolvedBase = resolve(baseDir);
  const filePath = resolve(join(baseDir, decoded));

  // Ensure resolved path is strictly within baseDir
  if (!filePath.startsWith(resolvedBase + "/") && filePath !== resolvedBase) return null;

  const mime = getMimeType(filePath);
  if (!mime) return null;

  if (!existsSync(filePath)) return null;

  return { path: filePath, mime };
}
