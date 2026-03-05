import { parseArgs, printUsage } from "./src/cli.ts";
import { parseSlidesFromFile } from "./src/parser.ts";
import { renderToFile, renderToString } from "./src/renderer.ts";
import { startServer } from "./src/server.ts";

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

if (opts.serve) {
  await startServer(opts.inputFile, opts.port);
} else {
  const slides = await parseSlidesFromFile(opts.inputFile);

  if (slides.length === 0) {
    console.error("Error: No slides found in input file.");
    process.exit(1);
  }

  if (opts.outputFile) {
    await renderToFile(slides, opts.outputFile);
    console.log(`Written ${slides.length} slides to ${opts.outputFile}`);
  } else {
    process.stdout.write(renderToString(slides));
  }
}
