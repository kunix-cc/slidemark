import { test, expect, describe } from "bun:test";
import { parseArgs } from "../src/cli.ts";

describe("parseArgs", () => {
  const argv = (args: string) => ["bun", "index.ts", ...args.split(" ").filter(Boolean)];

  test("parses input file", () => {
    const opts = parseArgs(argv("slides.md"));
    expect(opts.inputFile).toBe("slides.md");
  });

  test("parses output flag -o", () => {
    const opts = parseArgs(argv("slides.md -o out.html"));
    expect(opts.inputFile).toBe("slides.md");
    expect(opts.outputFile).toBe("out.html");
  });

  test("parses --output flag", () => {
    const opts = parseArgs(argv("slides.md --output out.html"));
    expect(opts.outputFile).toBe("out.html");
  });

  test("parses --serve flag", () => {
    const opts = parseArgs(argv("slides.md --serve"));
    expect(opts.serve).toBe(true);
  });

  test("parses --port flag", () => {
    const opts = parseArgs(argv("slides.md --serve --port 8080"));
    expect(opts.serve).toBe(true);
    expect(opts.port).toBe(8080);
  });

  test("parses --help flag", () => {
    const opts = parseArgs(argv("--help"));
    expect(opts.help).toBe(true);
  });

  test("parses -h flag", () => {
    const opts = parseArgs(argv("-h"));
    expect(opts.help).toBe(true);
  });

  test("parses --theme with name", () => {
    const opts = parseArgs(argv("slides.md --theme light"));
    expect(opts.theme).toBe("light");
  });

  test("parses -t shorthand", () => {
    const opts = parseArgs(argv("slides.md -t ocean"));
    expect(opts.theme).toBe("ocean");
  });

  test("parses --theme with css path", () => {
    const opts = parseArgs(argv("slides.md --theme ./custom.css"));
    expect(opts.theme).toBe("./custom.css");
  });

  test("defaults", () => {
    const opts = parseArgs(argv("slides.md"));
    expect(opts.outputFile).toBeNull();
    expect(opts.serve).toBe(false);
    expect(opts.port).toBe(3000);
    expect(opts.theme).toBeNull();
    expect(opts.help).toBe(false);
  });

  test("no input file", () => {
    const opts = parseArgs(argv(""));
    expect(opts.inputFile).toBe("");
  });
});
