import type { SlideData } from "./parser.ts";
import { type ThemeConfig, getDefaultTheme, themeToCSS } from "./theme.ts";

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: var(--slide-bg);
  color: var(--slide-text);
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

.slide-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 6vh 8vw;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
  overflow-y: auto;
}

.slide.active {
  opacity: 1;
  pointer-events: auto;
}

.slide h1 {
  font-size: clamp(2rem, 5vw, 4rem);
  margin-bottom: 0.6em;
  color: var(--slide-h1);
  line-height: 1.2;
}

.slide h2 {
  font-size: clamp(1.5rem, 3.5vw, 2.8rem);
  margin-bottom: 0.5em;
  color: var(--slide-h2);
  line-height: 1.3;
}

.slide h3 {
  font-size: clamp(1.2rem, 2.5vw, 2rem);
  margin-bottom: 0.5em;
  color: var(--slide-h3);
}

.slide p {
  font-size: clamp(1rem, 2vw, 1.5rem);
  line-height: 1.7;
  margin-bottom: 0.8em;
}

.slide ul, .slide ol {
  font-size: clamp(1rem, 2vw, 1.5rem);
  line-height: 1.8;
  padding-left: 1.5em;
  margin-bottom: 0.8em;
}

.slide li { margin-bottom: 0.3em; }

.slide code {
  background: var(--slide-code-inline-bg);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}

.slide pre {
  background: var(--slide-code-bg);
  padding: 1.2em 1.5em;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1em;
  font-size: clamp(0.8rem, 1.5vw, 1.1rem);
  line-height: 1.5;
}

.slide pre code {
  background: none;
  padding: 0;
}

.slide pre.shiki {
  background: var(--slide-code-bg) !important;
}

.slide blockquote {
  border-left: 4px solid var(--slide-accent);
  padding-left: 1em;
  margin-bottom: 1em;
  color: var(--slide-blockquote-text);
  font-style: italic;
}

.slide img {
  max-width: 80%;
  max-height: 60vh;
  border-radius: 8px;
}

.slide table {
  border-collapse: collapse;
  margin-bottom: 1em;
  font-size: clamp(0.9rem, 1.5vw, 1.2rem);
}

.slide th, .slide td {
  border: 1px solid var(--slide-table-border);
  padding: 0.5em 1em;
  text-align: left;
}

.slide th { background: var(--slide-table-header-bg); }

.progress-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--slide-accent);
  transition: width 0.3s ease;
  z-index: 100;
}

.slide-number {
  position: fixed;
  bottom: 12px;
  right: 20px;
  font-size: 0.85rem;
  color: var(--slide-number);
  z-index: 100;
}
`;

const JS = `
(function() {
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  const progress = document.querySelector('.progress-bar');
  const counter = document.querySelector('.slide-number');
  let current = 0;

  function show(n) {
    current = Math.max(0, Math.min(n, total - 1));
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    progress.style.width = total > 1 ? ((current / (total - 1)) * 100) + '%' : '100%';
    counter.textContent = (current + 1) + ' / ' + total;
    history.replaceState(null, '', '#' + (current + 1));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      show(current + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      show(current - 1);
    } else if (e.key === 'Home') {
      show(0);
    } else if (e.key === 'End') {
      show(total - 1);
    }
  });

  let touchStartX = 0;
  document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });

  const initial = parseInt(location.hash.slice(1), 10);
  show(isNaN(initial) ? 0 : initial - 1);
})();
`;

const WS_RELOAD_JS = `
(function() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  let ws;
  let themes = [];
  let currentThemeIndex = 0;

  // Theme toast indicator
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
    'background:rgba(0,0,0,0.7);color:#fff;padding:8px 20px;border-radius:20px;' +
    'font-size:14px;z-index:1000;opacity:0;transition:opacity 0.3s;pointer-events:none;';
  document.body.appendChild(toast);
  let toastTimer;
  function showToast(text) {
    toast.textContent = text;
    toast.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1500);
  }

  // Fetch theme list
  let themeSwitchEnabled = true;
  fetch('/api/themes').then(r => r.json()).then(data => {
    if (data.customThemeActive) { themeSwitchEnabled = false; return; }
    themes = data.themes;
    currentThemeIndex = themes.indexOf(data.current);
    if (currentThemeIndex < 0) currentThemeIndex = 0;
  }).catch(e => console.warn('[slidemark] Failed to fetch themes:', e));

  function switchTheme(direction) {
    if (!themeSwitchEnabled || themes.length === 0) return;
    currentThemeIndex = (currentThemeIndex + direction + themes.length) % themes.length;
    const name = themes[currentThemeIndex];
    showToast('Theme: ' + name);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send('theme:' + name);
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 't' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      switchTheme(1);
    } else if (e.key === 'T' && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      switchTheme(-1);
    }
  });

  function connect() {
    ws = new WebSocket(proto + '//' + location.host + '/ws');
    ws.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
    ws.onclose = () => setTimeout(connect, 1000);
  }
  connect();
})();
`;

export interface TemplateOptions {
  title?: string;
  devMode?: boolean;
  theme?: ThemeConfig;
  customCSS?: string;
}

export function buildHtml(slides: SlideData[], options: TemplateOptions = {}): string {
  const { title = "slidemark", devMode = false, theme = getDefaultTheme(), customCSS } = options;

  const sections = slides
    .map(
      (s, i) =>
        `    <section class="slide${i === 0 ? " active" : ""}">\n${s.html}\n    </section>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${themeToCSS(theme)}${CSS}</style>
${customCSS ? `  <style>${customCSS}</style>` : ""}
</head>
<body>
  <div class="slide-container">
${sections}
  </div>
  <div class="progress-bar"></div>
  <div class="slide-number"></div>
  <script>${JS}</script>
${devMode ? `  <script>${WS_RELOAD_JS}</script>` : ""}
</body>
</html>`;
}
