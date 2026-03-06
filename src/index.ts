import { parseArgs, printUsage } from "./cli.ts";
import { parseSlidesFromFile } from "./parser.ts";
import { renderToFile, renderToString } from "./renderer.ts";
import { startServer } from "./server.ts";
import { resolveTheme } from "./theme.ts";

const opts = parseArgs(process.argv);

if (opts.help) {
  printUsage();
  process.exit(0);
}

if (!opts.inputFile) {
  console.error("Error: No input file specified.");
  printUsage();
  process.exit(1);
}

const file = Bun.file(opts.inputFile);
if (!(await file.exists())) {
  console.error(`Error: File not found: ${opts.inputFile}`);
  process.exit(1);
}

let resolved;
try {
  resolved = await resolveTheme(opts.theme);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`Error: ${msg}`);
  process.exit(1);
}

const { theme, customCSS } = resolved;

if (opts.serve) {
  await startServer(opts.inputFile, opts.port, { theme, customCSS });
} else {
  const slides = await parseSlidesFromFile(opts.inputFile, {
    shikiTheme: theme.shikiTheme,
  });

  if (slides.length === 0) {
    console.error("Error: No slides found in input file.");
    process.exit(1);
  }

  if (opts.outputFile) {
    await renderToFile(slides, opts.outputFile, { theme, customCSS });
    console.log(`Written ${slides.length} slides to ${opts.outputFile}`);
  } else {
    process.stdout.write(renderToString(slides, { theme, customCSS }));
  }
}
