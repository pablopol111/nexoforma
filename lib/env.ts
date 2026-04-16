const requiredPublic = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

const requiredServer = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

export function getSupabasePublicEnv() {
  for (const key of requiredPublic) {
    if (!process.env[key]) {
      throw new Error(`Falta la variable de entorno ${key}.`);
    }
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  };
}

export function getSupabaseServerEnv() {
  const publicEnv = getSupabasePublicEnv();

  for (const key of requiredServer) {
    if (!process.env[key]) {
      throw new Error(`Falta la variable de entorno ${key}.`);
    }
  }

  return {
    ...publicEnv,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
}
