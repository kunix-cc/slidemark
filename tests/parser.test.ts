import { test, expect, describe } from "bun:test";
import { parseSlides, parseSlidesWithHighlight } from "../src/parser.ts";

describe("parseSlides", () => {
  test("splits slides by ---", () => {
    const input = `# Slide 1

---

# Slide 2

---

# Slide 3`;
    const slides = parseSlides(input);
    expect(slides).toHaveLength(3);
    expect(slides[0]!.index).toBe(0);
    expect(slides[1]!.index).toBe(1);
    expect(slides[2]!.index).toBe(2);
  });

  test("converts markdown to HTML", () => {
    const input = "# Hello World";
    const slides = parseSlides(input);
    expect(slides).toHaveLength(1);
    expect(slides[0]!.html).toContain("<h1>");
    expect(slides[0]!.html).toContain("Hello World");
  });

  test("preserves original markdown", () => {
    const input = "# Title\n\nSome **bold** text";
    const slides = parseSlides(input);
    expect(slides[0]!.markdown).toBe("# Title\n\nSome **bold** text");
  });

  test("ignores --- inside code blocks", () => {
    const input = `# Code Example

\`\`\`yaml
key: value
---
another: value
\`\`\`

---

# Next Slide`;
    const slides = parseSlides(input);
    expect(slides).toHaveLength(2);
    expect(slides[0]!.html).toContain("key: value");
  });

  test("handles empty input", () => {
    const slides = parseSlides("");
    expect(slides).toHaveLength(0);
  });

  test("handles single slide without separator", () => {
    const input = "# Just one slide\n\nWith some content.";
    const slides = parseSlides(input);
    expect(slides).toHaveLength(1);
  });

  test("supports GFM features", () => {
    const input = "- [x] checked\n- [ ] unchecked";
    const slides = parseSlides(input);
    expect(slides[0]!.html).toContain("input");
  });
});

describe("parseSlidesWithHighlight", () => {
  test("applies shiki syntax highlighting to code blocks", async () => {
    const input = '```typescript\nconst x = 1;\n```';
    const slides = await parseSlidesWithHighlight(input);
    expect(slides[0]!.html).toContain("shiki");
    expect(slides[0]!.html).toContain("span");
  });

  test("leaves non-code slides unchanged", async () => {
    const input = "# Just a heading";
    const slides = await parseSlidesWithHighlight(input);
    expect(slides[0]!.html).toContain("<h1>");
    expect(slides[0]!.html).not.toContain("shiki");
  });

  test("handles unknown languages gracefully", async () => {
    const input = '```unknownlang\nfoo bar\n```';
    const slides = await parseSlidesWithHighlight(input);
    expect(slides[0]!.html).toContain("foo bar");
  });
});
