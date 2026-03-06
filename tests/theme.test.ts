import { test, expect, describe } from "bun:test";
import {
  getBuiltinTheme,
  getAvailableThemes,
  getDefaultTheme,
  themeToCSS,
  resolveTheme,
  type ThemeConfig,
} from "../src/theme.ts";
import { parseSlides } from "../src/parser.ts";
import { renderToString } from "../src/renderer.ts";
import { join } from "node:path";

describe("getAvailableThemes", () => {
  test("returns 5 themes", () => {
    expect(getAvailableThemes()).toHaveLength(5);
  });

  test("includes expected theme names", () => {
    const themes = getAvailableThemes();
    expect(themes).toContain("dark");
    expect(themes).toContain("light");
    expect(themes).toContain("ocean");
    expect(themes).toContain("forest");
    expect(themes).toContain("sunset");
  });
});

describe("getBuiltinTheme", () => {
  test("returns ThemeConfig for valid name", () => {
    const theme = getBuiltinTheme("dark");
    expect(theme).not.toBeNull();
    expect(theme!.name).toBe("dark");
    expect(theme!.shikiTheme).toBe("github-dark");
  });

  test("returns null for unknown name", () => {
    expect(getBuiltinTheme("nonexistent")).toBeNull();
  });

  test("light theme has github-light shiki theme", () => {
    const theme = getBuiltinTheme("light");
    expect(theme!.shikiTheme).toBe("github-light");
  });
});

describe("getDefaultTheme", () => {
  test("returns dark theme", () => {
    expect(getDefaultTheme().name).toBe("dark");
  });
});

describe("themeToCSS", () => {
  test("generates :root block with CSS variables", () => {
    const theme = getDefaultTheme();
    const css = themeToCSS(theme);
    expect(css).toContain(":root {");
    expect(css).toContain("--slide-bg:");
    expect(css).toContain("--slide-text:");
    expect(css).toContain("--slide-accent:");
    expect(css).toContain(theme.bg);
  });
});

describe("template integration", () => {
  test("default theme produces CSS variables in output", () => {
    const slides = parseSlides("# Test");
    const html = renderToString(slides);
    expect(html).toContain("--slide-bg:");
    expect(html).toContain("var(--slide-bg)");
  });

  test("light theme applies correct background", () => {
    const slides = parseSlides("# Test");
    const theme = getBuiltinTheme("light")!;
    const html = renderToString(slides, { theme });
    expect(html).toContain("--slide-bg: #ffffff");
  });

  test("custom CSS is injected", () => {
    const slides = parseSlides("# Test");
    const html = renderToString(slides, { customCSS: ":root { --slide-bg: red; }" });
    expect(html).toContain(":root { --slide-bg: red; }");
  });

  test("each builtin theme produces valid output", () => {
    const slides = parseSlides("# Test");
    for (const name of getAvailableThemes()) {
      const theme = getBuiltinTheme(name)!;
      const html = renderToString(slides, { theme });
      expect(html).toContain(`--slide-bg: ${theme.bg}`);
      expect(html).toContain("<!DOCTYPE html>");
    }
  });
});

describe("resolveTheme", () => {
  test("null returns default theme", async () => {
    const result = await resolveTheme(null);
    expect(result.theme.name).toBe("dark");
    expect(result.customCSS).toBeUndefined();
  });

  test("builtin theme name resolves", async () => {
    const result = await resolveTheme("light");
    expect(result.theme.name).toBe("light");
  });

  test("unknown theme name throws", async () => {
    await expect(resolveTheme("nonexistent")).rejects.toThrow("Unknown theme");
  });

  test("error message lists available themes", async () => {
    await expect(resolveTheme("bad")).rejects.toThrow("dark");
  });

  test("css file path loads custom CSS", async () => {
    const cssPath = join(import.meta.dir, "fixtures", "custom-theme.css");
    await Bun.write(cssPath, ":root { --slide-bg: red; }");
    try {
      const result = await resolveTheme(cssPath);
      expect(result.theme.name).toBe("dark");
      expect(result.customCSS).toContain("--slide-bg: red");
    } finally {
      await Bun.file(cssPath).exists() && (await import("node:fs/promises")).unlink(cssPath);
    }
  });

  test("non-existent css file throws", async () => {
    await expect(resolveTheme("./nonexistent.css")).rejects.toThrow("not found");
  });
});
