import { watch } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { parseSlidesFromFile } from "./parser.ts";
import { renderToString } from "./renderer.ts";
import { resolveStaticFile } from "./static.ts";
import { getBuiltinTheme, getAvailableThemes, getDefaultTheme, type ThemeConfig } from "./theme.ts";

export interface ServerOptions {
  theme?: ThemeConfig;
  customCSS?: string;
}

export async function startServer(inputFile: string, port: number, serverOpts: ServerOptions = {}): Promise<void> {
  const absPath = resolve(inputFile);
  const dir = dirname(absPath);
  const filename = basename(absPath);

  let currentTheme = serverOpts.theme ?? getDefaultTheme();
  let html = await buildPage(absPath, { ...serverOpts, theme: currentTheme });
  let isBuilding = false;

  const server = Bun.serve({
    port,
    websocket: {
      open(ws) {
        ws.subscribe("reload");
      },
      message(_ws, message) {
        const msg = typeof message === "string" ? message : "";
        if (msg.startsWith("theme:")) {
          if (isBuilding) return;
          const themeName = msg.slice(6);
          if (themeName.length > 64) return;
          const newTheme = getBuiltinTheme(themeName);
          if (newTheme) {
            currentTheme = newTheme;
            isBuilding = true;
            buildPage(absPath, { ...serverOpts, theme: currentTheme })
              .then((newHtml) => {
                html = newHtml;
                server.publish("reload", "reload");
                console.log(`[theme] ${themeName} ${new Date().toLocaleTimeString()}`);
              })
              .catch((e) => console.error("Theme switch failed:", e))
              .finally(() => { isBuilding = false; });
          }
        }
      },
      close(ws) {
        ws.unsubscribe("reload");
      },
    },
    fetch(req, server) {
      const url = new URL(req.url);

      if (url.pathname === "/ws") {
        if (server.upgrade(req)) return undefined;
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      if (url.pathname === "/api/themes") {
        return Response.json({
          themes: getAvailableThemes(),
          current: currentTheme.name,
          customThemeActive: !!serverOpts.customCSS,
        });
      }

      if (url.pathname === "/") {
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // Serve static image files relative to the markdown file directory
      const staticFile = resolveStaticFile(url.pathname, dir);
      if (staticFile) {
        return new Response(Bun.file(staticFile.path), {
          headers: { "Content-Type": staticFile.mime },
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(`slidemark server running at http://localhost:${server.port}`);
  console.log(`Watching ${inputFile} for changes...`);
  console.log("Press Ctrl+C to stop.\n");

  // Watch the directory instead of the file directly.
  // Editors like vim do save-and-rename which breaks direct file watchers.
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch(dir, (_event, changedFile) => {
    if (changedFile !== filename) return;
    if (debounceTimer) return;
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      try {
        html = await buildPage(absPath, { ...serverOpts, theme: currentTheme });
        server.publish("reload", "reload");
        console.log(`[reload] ${new Date().toLocaleTimeString()}`);
      } catch (e) {
        console.error("Rebuild failed:", e);
      }
    }, 100);
  });
}

async function buildPage(inputFile: string, opts: ServerOptions): Promise<string> {
  const slides = await parseSlidesFromFile(inputFile, {
    embedLocalImages: false,
    shikiTheme: opts.theme?.shikiTheme,
  });
  return renderToString(slides, {
    devMode: true,
    theme: opts.theme,
    customCSS: opts.customCSS,
  });
}
