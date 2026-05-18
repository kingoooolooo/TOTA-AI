export const normalizeBaseUrl = (baseUrl: string, defaultPath = "/v1"): string => {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;

  try {
    const url = new URL(trimmed);
    if ((url.pathname === "" || url.pathname === "/") && defaultPath) {
      url.pathname = defaultPath;
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
};
