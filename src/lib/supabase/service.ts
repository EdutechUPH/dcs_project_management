// src/lib/supabase/service.ts
// Use this client ONLY in server-side code (Server Actions, Route Handlers).
// It uses the service role key which BYPASSES Row Level Security.
// Never expose this client or its key to the browser.
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // Prevent the service client from persisting sessions or listening for auth changes.
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
