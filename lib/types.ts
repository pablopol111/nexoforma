export type UserRole = "admin" | "nutritionist" | "client";

export type ProfileRecord = {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
};
