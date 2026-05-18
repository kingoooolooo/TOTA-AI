const extensionLanguageMap: Record<string, string> = {
  css: "css",
  html: "html",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  md: "markdown",
  py: "python",
  ts: "typescript",
  tsx: "typescript",
  txt: "plaintext",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml"
};

export const getLanguageFromPath = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return extensionLanguageMap[ext] ?? "plaintext";
};
