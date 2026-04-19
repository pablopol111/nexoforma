export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return /^[a-z0-9._-]{3,30}$/.test(value);
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPassword(value: string) {
  return value.length >= 8;
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatShortDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatNumber(value: number | null | undefined, fractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("es-ES", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value);
}

export function formatSteps(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function toNullableNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function makeFullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function isProfileCompleteForMeasurements(profile: { height_cm?: number | null; reference_weight_kg?: number | null; target_weight_kg?: number | null }) {
  return Boolean(profile.height_cm && profile.reference_weight_kg && profile.target_weight_kg);
}

export function dayDiffFromToday(value: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const target = new Date(value);
  target.setHours(0,0,0,0);
  return Math.round((today.getTime() - target.getTime()) / 86400000);
}
