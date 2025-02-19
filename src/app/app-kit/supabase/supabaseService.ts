import {createBrowserClient} from "@supabase/ssr";

const supabaseServerClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_SECRET!
);

export default supabaseServerClient;