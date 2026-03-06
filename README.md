# slidemark

A CLI tool that turns Markdown into presentation slides.

## Features

- Single HTML file output from Markdown
- Live preview with auto-reload
- Syntax highlighting via [shiki](https://shiki.style)
- Local image embedding
- 5 built-in color themes + custom CSS themes
- Keyboard and touch navigation

## Install

```bash
bun install
```

## Usage

```bash
# Generate HTML
slidemark slides.md -o slides.html

# Live preview
slidemark slides.md --serve

# With a theme
slidemark slides.md --theme ocean -o slides.html

# Custom CSS theme
slidemark slides.md --theme ./my-theme.css --serve
```

Built-in themes: `dark` (default), `light`, `ocean`, `forest`, `sunset`

### Options

```
-o, --output <file>      Output HTML file (default: stdout)
-t, --theme <name|path>  Color theme or custom .css file
    --serve              Start live preview server
    --port <number>      Server port (default: 3000)
-h, --help               Show help
```

## Writing slides

Separate slides with `---`:

```markdown
# Title Slide

Welcome to my presentation

---

## Second Slide

- Bullet points
- **Bold** and `code`

---

## Code

\```typescript
const msg = "Hello, slidemark!";
\```
```

Local images work too: `![alt](./images/photo.png)`

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `→` `↓` `Space` | Next slide |
| `←` `↑` | Previous slide |
| `Home` / `End` | First / last slide |
| `T` / `Shift+T` | Cycle themes (preview mode) |

## Custom themes

Create a CSS file that overrides CSS variables:

```css
:root {
  --slide-bg: #fefefe;
  --slide-text: #222;
  --slide-h1: #000;
  --slide-h2: #1a5276;
  --slide-h3: #2e86c1;
  --slide-accent: #e74c3c;
  --slide-code-bg: #f0f0f0;
  --slide-code-inline-bg: rgba(0, 0, 0, 0.05);
  --slide-blockquote-text: #777;
  --slide-table-border: #ccc;
  --slide-table-header-bg: rgba(0, 0, 0, 0.03);
  --slide-number: #999;
}
```

## Development

```bash
bun test          # Run tests
bun run build     # Compile to standalone binary
```

## License

MIT
