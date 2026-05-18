const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const formatRelativeTime = (iso: string): string => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const seconds = Math.round((then - now) / 1000);
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 60) return "just now";
  if (absSeconds < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (absSeconds < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (absSeconds < 604800) return rtf.format(Math.round(seconds / 86400), "day");
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: new Date().getFullYear() === new Date(iso).getFullYear() ? undefined : "numeric"
  }).format(new Date(iso));
};

export const makeSessionTitle = (content: string, fallback: string): string => {
  const clean = content.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 40 ? `${clean.slice(0, 40)}...` : clean;
};
