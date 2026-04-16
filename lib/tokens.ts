export function generateAccessToken(prefix: "NUTRI" | "CLIENT") {
  const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `NEXO-${prefix}-${raw}`;
}