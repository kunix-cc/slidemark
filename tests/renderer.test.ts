import { test, expect, describe } from "bun:test";
import { parseSlides } from "../src/parser.ts";
import { renderToString } from "../src/renderer.ts";

describe("renderToString", () => {
  test("produces valid HTML document", () => {
    const slides = parseSlides("# Hello\n\n---\n\n# World");
    const html = renderToString(slides);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  test("wraps each slide in a section", () => {
    const slides = parseSlides("# One\n\n---\n\n# Two\n\n---\n\n# Three");
    const html = renderToString(slides);
    const sectionCount = (html.match(/<section class="slide/g) || []).length;
    expect(sectionCount).toBe(3);
  });

  test("first slide has active class", () => {
    const slides = parseSlides("# First\n\n---\n\n# Second");
    const html = renderToString(slides);
    expect(html).toContain('class="slide active"');
  });

  test("includes navigation JS", () => {
    const slides = parseSlides("# Test");
    const html = renderToString(slides);
    expect(html).toContain("ArrowRight");
    expect(html).toContain("ArrowLeft");
  });

  test("includes progress bar and slide number", () => {
    const slides = parseSlides("# Test");
    const html = renderToString(slides);
    expect(html).toContain("progress-bar");
    expect(html).toContain("slide-number");
  });

  test("devMode includes WebSocket reload script", () => {
    const slides = parseSlides("# Test");
    const html = renderToString(slides, { devMode: true });
    expect(html).toContain("WebSocket");
    expect(html).toContain("reload");
  });

  test("production mode excludes WebSocket script", () => {
    const slides = parseSlides("# Test");
    const html = renderToString(slides, { devMode: false });
    expect(html).not.toContain("WebSocket");
  });

  test("custom title", () => {
    const slides = parseSlides("# Test");
    const html = renderToString(slides, { title: "My Presentation" });
    expect(html).toContain("<title>My Presentation</title>");
  });
});
