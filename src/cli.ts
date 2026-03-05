export interface CliOptions {
  inputFile: string;
  outputFile: string | null;
  serve: boolean;
  port: number;
  help: boolean;
}

const USAGE = `Usage: slidemark <input.md> [options]

Options:
  -o, --output <file>   Output HTML file (default: stdout)
  --serve               Start live preview server
  --port <number>       Server port (default: 3000)
  -h, --help            Show this help message

Examples:
  slidemark slides.md -o slides.html
  slidemark slides.md --serve
  slidemark slides.md --serve --port 8080`;

export function printUsage(): void {
  console.log(USAGE);
}

export function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);

  const opts: CliOptions = {
    inputFile: "",
    outputFile: null,
    serve: false,
    port: 3000,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    switch (arg) {
      case "-h":
      case "--help":
        opts.help = true;
        break;
      case "-o":
      case "--output":
        opts.outputFile = args[++i] ?? "";
        break;
      case "--serve":
        opts.serve = true;
        break;
      case "--port":
        opts.port = parseInt(args[++i] ?? "3000", 10);
        break;
      default:
        if (!arg.startsWith("-") && !opts.inputFile) {
          opts.inputFile = arg;
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return opts;
}
