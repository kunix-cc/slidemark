import { watch } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { parseSlidesFromFile } from "./parser.ts";
import { renderToString } from "./renderer.ts";

export async function startServer(inputFile: string, port: number): Promise<void> {
  const absPath = resolve(inputFile);
  const dir = dirname(absPath);
  const filename = basename(absPath);
  let html = await buildPage(absPath);

  const server = Bun.serve({
    port,
    websocket: {
      open(ws) {
        ws.subscribe("reload");
      },
      message() {},
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

      if (url.pathname === "/") {
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
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
        html = await buildPage(absPath);
        server.publish("reload", "reload");
        console.log(`[reload] ${new Date().toLocaleTimeString()}`);
      } catch (e) {
        console.error("Rebuild failed:", e);
      }
    }, 100);
  });
}

async function buildPage(inputFile: string): Promise<string> {
  const slides = await parseSlidesFromFile(inputFile);
  return renderToString(slides, { devMode: true });
}
