import { createBrowserClient } from "@supabase/ssr";

export const createClient = (
  SUPABASE_URL: string | undefined,
  SERVICE_ROLE_KEY: string | undefined
) =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
