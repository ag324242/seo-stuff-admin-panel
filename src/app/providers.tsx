'use client';

import { SupabaseAuthContextProvider } from "@/app-kit/supabase/SupabaseAuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SupabaseAuthContextProvider>{children}</SupabaseAuthContextProvider>;
}