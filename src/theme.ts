export interface ThemeConfig {
  name: string;
  bg: string;
  text: string;
  h1: string;
  h2: string;
  h3: string;
  accent: string;
  codeBg: string;
  codeInlineBg: string;
  blockquoteText: string;
  tableBorder: string;
  tableHeaderBg: string;
  slideNumber: string;
  shikiTheme: string;
}

const dark: ThemeConfig = {
  name: "dark",
  bg: "#1a1a2e",
  text: "#eee",
  h1: "#fff",
  h2: "#e0e0ff",
  h3: "#c0c0e0",
  accent: "#6c63ff",
  codeBg: "#0d0d1a",
  codeInlineBg: "rgba(255,255,255,0.1)",
  blockquoteText: "#bbb",
  tableBorder: "#444",
  tableHeaderBg: "rgba(255,255,255,0.08)",
  slideNumber: "#666",
  shikiTheme: "github-dark",
};

const light: ThemeConfig = {
  name: "light",
  bg: "#ffffff",
  text: "#333",
  h1: "#111",
  h2: "#2c3e50",
  h3: "#555",
  accent: "#3498db",
  codeBg: "#f5f5f5",
  codeInlineBg: "rgba(0,0,0,0.06)",
  blockquoteText: "#666",
  tableBorder: "#ddd",
  tableHeaderBg: "rgba(0,0,0,0.04)",
  slideNumber: "#aaa",
  shikiTheme: "github-light",
};

const ocean: ThemeConfig = {
  name: "ocean",
  bg: "#0b1929",
  text: "#c8d6e5",
  h1: "#e8f0fe",
  h2: "#7ec8e3",
  h3: "#5dade2",
  accent: "#00b4d8",
  codeBg: "#061220",
  codeInlineBg: "rgba(126,200,227,0.1)",
  blockquoteText: "#8899aa",
  tableBorder: "#1e3a5f",
  tableHeaderBg: "rgba(0,180,216,0.08)",
  slideNumber: "#4a6a8a",
  shikiTheme: "github-dark",
};

const forest: ThemeConfig = {
  name: "forest",
  bg: "#1a2e1a",
  text: "#d4e6d4",
  h1: "#e8f5e8",
  h2: "#81c784",
  h3: "#66bb6a",
  accent: "#4caf50",
  codeBg: "#0d1a0d",
  codeInlineBg: "rgba(129,199,132,0.1)",
  blockquoteText: "#8faa8f",
  tableBorder: "#2e5a2e",
  tableHeaderBg: "rgba(76,175,80,0.08)",
  slideNumber: "#5a7a5a",
  shikiTheme: "github-dark",
};

const sunset: ThemeConfig = {
  name: "sunset",
  bg: "#2d1b2e",
  text: "#f0ddd4",
  h1: "#fff0e6",
  h2: "#f4a261",
  h3: "#e07a5f",
  accent: "#e76f51",
  codeBg: "#1a0f1a",
  codeInlineBg: "rgba(244,162,97,0.1)",
  blockquoteText: "#c0a090",
  tableBorder: "#5a3a3a",
  tableHeaderBg: "rgba(231,111,81,0.08)",
  slideNumber: "#8a6a6a",
  shikiTheme: "github-dark",
};

const BUILTIN_THEMES: Record<string, ThemeConfig> = {
  dark,
  light,
  ocean,
  forest,
  sunset,
};

export function getBuiltinTheme(name: string): ThemeConfig | null {
  if (!Object.hasOwn(BUILTIN_THEMES, name)) return null;
  return BUILTIN_THEMES[name]!;
}

export function getAvailableThemes(): string[] {
  return Object.keys(BUILTIN_THEMES);
}

export function getDefaultTheme(): ThemeConfig {
  return dark;
}

export function themeToCSS(theme: ThemeConfig): string {
  return `:root {
  --slide-bg: ${theme.bg};
  --slide-text: ${theme.text};
  --slide-h1: ${theme.h1};
  --slide-h2: ${theme.h2};
  --slide-h3: ${theme.h3};
  --slide-accent: ${theme.accent};
  --slide-code-bg: ${theme.codeBg};
  --slide-code-inline-bg: ${theme.codeInlineBg};
  --slide-blockquote-text: ${theme.blockquoteText};
  --slide-table-border: ${theme.tableBorder};
  --slide-table-header-bg: ${theme.tableHeaderBg};
  --slide-number: ${theme.slideNumber};
}`;
}

export interface ResolvedTheme {
  theme: ThemeConfig;
  customCSS?: string;
}

export async function resolveTheme(themeArg: string | null): Promise<ResolvedTheme> {
  if (!themeArg) return { theme: getDefaultTheme() };

  // .css extension → custom CSS file
  if (themeArg.endsWith(".css")) {
    const file = Bun.file(themeArg);
    if (!(await file.exists())) {
      throw new Error(`Theme CSS file not found: ${themeArg}`);
    }
    const customCSS = await file.text();
    return { theme: getDefaultTheme(), customCSS };
  }

  // Builtin theme name
  const theme = getBuiltinTheme(themeArg);
  if (!theme) {
    throw new Error(
      `Unknown theme: "${themeArg}". Available themes: ${getAvailableThemes().join(", ")}`
    );
  }
  return { theme };
}
