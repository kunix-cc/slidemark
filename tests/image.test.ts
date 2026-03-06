import { test, expect, describe } from "bun:test";
import { extractLocalImagePaths, encodeImageToDataUri, embedImages } from "../src/image.ts";
import { join } from "node:path";

describe("extractLocalImagePaths", () => {
  test("extracts relative image paths", () => {
    const html = '<img src="images/photo.png" alt="photo">';
    expect(extractLocalImagePaths(html)).toEqual(["images/photo.png"]);
  });

  test("extracts multiple image paths", () => {
    const html = '<img src="a.png"><img src="b.jpg">';
    expect(extractLocalImagePaths(html)).toEqual(["a.png", "b.jpg"]);
  });

  test("excludes HTTP URLs", () => {
    const html = '<img src="https://example.com/photo.png">';
    expect(extractLocalImagePaths(html)).toEqual([]);
  });

  test("excludes http URLs", () => {
    const html = '<img src="http://example.com/photo.png">';
    expect(extractLocalImagePaths(html)).toEqual([]);
  });

  test("excludes data URIs", () => {
    const html = '<img src="data:image/png;base64,abc123">';
    expect(extractLocalImagePaths(html)).toEqual([]);
  });

  test("handles mixed local and remote images", () => {
    const html = '<img src="local.png"><img src="https://remote.com/img.png"><img src="./sub/pic.jpg">';
    expect(extractLocalImagePaths(html)).toEqual(["local.png", "./sub/pic.jpg"]);
  });

  test("handles absolute paths", () => {
    const html = '<img src="/tmp/photo.png">';
    expect(extractLocalImagePaths(html)).toEqual(["/tmp/photo.png"]);
  });

  test("returns empty array for no images", () => {
    const html = "<p>No images here</p>";
    expect(extractLocalImagePaths(html)).toEqual([]);
  });

  test("handles single-quoted src", () => {
    const html = "<img src='photo.png'>";
    expect(extractLocalImagePaths(html)).toEqual(["photo.png"]);
  });
});

describe("encodeImageToDataUri", () => {
  const fixturesDir = join(import.meta.dir, "fixtures");

  test("encodes PNG file to data URI", async () => {
    const uri = await encodeImageToDataUri(join(fixturesDir, "test.png"));
    expect(uri).toStartWith("data:image/png;base64,");
  });

  test("encodes JPG file to data URI", async () => {
    const uri = await encodeImageToDataUri(join(fixturesDir, "test.jpg"));
    expect(uri).toStartWith("data:image/jpeg;base64,");
  });

  test("encodes SVG file to data URI", async () => {
    const uri = await encodeImageToDataUri(join(fixturesDir, "test.svg"));
    expect(uri).toStartWith("data:image/svg+xml;base64,");
  });

  test("encodes GIF file to data URI", async () => {
    const uri = await encodeImageToDataUri(join(fixturesDir, "test.gif"));
    expect(uri).toStartWith("data:image/gif;base64,");
  });

  test("encodes WebP file to data URI", async () => {
    const uri = await encodeImageToDataUri(join(fixturesDir, "test.webp"));
    expect(uri).toStartWith("data:image/webp;base64,");
  });

  test("returns null for non-existent file", async () => {
    const uri = await encodeImageToDataUri(join(fixturesDir, "nonexistent.png"));
    expect(uri).toBeNull();
  });

  test("returns null for unknown extension", async () => {
    const uri = await encodeImageToDataUri(join(fixturesDir, "test.xyz"));
    expect(uri).toBeNull();
  });
});

describe("embedImages", () => {
  const fixturesDir = join(import.meta.dir, "fixtures");

  test("replaces local image src with data URI", async () => {
    const html = '<img src="test.png" alt="test">';
    const result = await embedImages(html, fixturesDir);
    expect(result).toContain("data:image/png;base64,");
    expect(result).not.toContain('src="test.png"');
  });

  test("preserves alt attribute", async () => {
    const html = '<img src="test.png" alt="my image">';
    const result = await embedImages(html, fixturesDir);
    expect(result).toContain('alt="my image"');
  });

  test("leaves HTTP URLs unchanged", async () => {
    const html = '<img src="https://example.com/photo.png" alt="remote">';
    const result = await embedImages(html, fixturesDir);
    expect(result).toBe(html);
  });

  test("replaces missing image with alt text placeholder", async () => {
    const html = '<img src="missing.png" alt="my alt">';
    const result = await embedImages(html, fixturesDir);
    expect(result).not.toContain("<img");
    expect(result).toContain("my alt");
  });

  test("replaces missing image without alt with empty string", async () => {
    const html = '<img src="missing.png">';
    const result = await embedImages(html, fixturesDir);
    expect(result).not.toContain("<img");
  });

  test("handles multiple images", async () => {
    const html = '<img src="test.png" alt="a"><img src="test.jpg" alt="b">';
    const result = await embedImages(html, fixturesDir);
    expect(result).toContain("data:image/png;base64,");
    expect(result).toContain("data:image/jpeg;base64,");
  });

  test("handles duplicate same image", async () => {
    const html = '<img src="test.png" alt="first"><img src="test.png" alt="second">';
    const result = await embedImages(html, fixturesDir);
    expect(result).not.toContain('src="test.png"');
    expect(result).toContain('alt="first"');
    expect(result).toContain('alt="second"');
    const dataUriCount = (result.match(/data:image\/png;base64,/g) || []).length;
    expect(dataUriCount).toBe(2);
  });

  test("skips absolute path images", async () => {
    const html = '<img src="/etc/passwd" alt="secret">';
    const result = await embedImages(html, fixturesDir);
    expect(result).toBe(html);
  });
});
