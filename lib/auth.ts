export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function usernameToEmail(username: string) {
  const normalized = normalizeUsername(username);
  return `${normalized}@nexoforma.local`;
}

export function roleToPath(role: string | null | undefined) {
  switch (role) {
    case "admin":
      return "/admin";
    case "nutritionist":
      return "/nutritionist";
    case "client":
      return "/client";
    default:
      return "/";
  }
}
