export type UserRole = "admin" | "nutritionist" | "client";
export type UserStatus = "pending" | "active" | "blocked";

export type ProfileRecord = {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
};

export type ClientProfileRecord = {
  client_user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  sex: "male" | "female" | null;
  height_cm: number | null;
  reference_weight_kg: number | null;
  target_weight_kg: number | null;
  profile_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyEntryRecord = {
  id: string;
  client_user_id: string;
  entry_date: string;
  weight_kg: number;
  steps: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type MeasurementEntryRecord = {
  id: string;
  client_user_id: string;
  entry_date: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  thigh_relaxed_cm: number | null;
  biceps_normal_cm: number | null;
  biceps_flexed_cm: number | null;
  chest_cm: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
};
