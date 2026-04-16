export type UserRole = "admin" | "nutritionist" | "client";

export type ProfileRecord = {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
};

export type ClientProfileRecord = {
  client_user_id: string;
  height_cm: number | null;
  reference_weight_kg: number | null;
  target_weight_kg: number | null;
  created_at: string;
  updated_at: string;
};

export type EntryRecord = {
  id: string;
  client_user_id: string;
  recorded_by_user_id: string;
  entry_date: string;
  weight_kg: number;
  steps: number;
  created_at: string;
};