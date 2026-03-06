import { test, expect, describe } from "bun:test";
import { resolveStaticFile, getMimeType } from "../src/static.ts";
import { join } from "node:path";

describe("getMimeType", () => {
  test("returns correct MIME for png", () => {
    expect(getMimeType("photo.png")).toBe("image/png");
  });

  test("returns correct MIME for jpg", () => {
    expect(getMimeType("photo.jpg")).toBe("image/jpeg");
  });

  test("returns correct MIME for jpeg", () => {
    expect(getMimeType("photo.jpeg")).toBe("image/jpeg");
  });

  test("returns correct MIME for gif", () => {
    expect(getMimeType("photo.gif")).toBe("image/gif");
  });

  test("returns correct MIME for svg", () => {
    expect(getMimeType("photo.svg")).toBe("image/svg+xml");
  });

  test("returns correct MIME for webp", () => {
    expect(getMimeType("photo.webp")).toBe("image/webp");
  });

  test("returns null for unknown extension", () => {
    expect(getMimeType("file.xyz")).toBeNull();
  });
});

describe("resolveStaticFile", () => {
  const baseDir = join(import.meta.dir, "fixtures");

  test("resolves existing file", () => {
    const result = resolveStaticFile("/test.png", baseDir);
    expect(result).not.toBeNull();
    expect(result!.path).toBe(join(baseDir, "test.png"));
    expect(result!.mime).toBe("image/png");
  });

  test("blocks path traversal with ..", () => {
    const result = resolveStaticFile("/../../../etc/passwd", baseDir);
    expect(result).toBeNull();
  });

  test("blocks encoded path traversal", () => {
    const result = resolveStaticFile("/%2e%2e/etc/passwd", baseDir);
    expect(result).toBeNull();
  });

  test("returns null for non-image extension", () => {
    const result = resolveStaticFile("/file.txt", baseDir);
    expect(result).toBeNull();
  });

  test("returns null for non-existent file", () => {
    const result = resolveStaticFile("/nonexistent.png", baseDir);
    expect(result).toBeNull();
  });

  test("resolves jpg file", () => {
    const result = resolveStaticFile("/test.jpg", baseDir);
    expect(result).not.toBeNull();
    expect(result!.mime).toBe("image/jpeg");
  });
});
