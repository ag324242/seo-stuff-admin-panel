'use client';

import { useSupabaseAuthContext } from "@/app-kit/supabase/SupabaseAuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Loading from "../components/common/loader/loading";
import Dashboard from "../screens/dashboard";



export default function Home() {
  const auth = useSupabaseAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);


 
  useEffect(() => {
    if (!auth.isLoading ) {
        if (auth.session) {
          setTimeout(() => {
            setLoading(false);
          }
          , 2000);
        } else {
            router.push("/auth/login");
        }
    }
}, [auth.isLoading, auth.session, router]);
  
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loading />
    </div>
  );
}

  return (
    <div className="min-h-screen bg-white">
      <Header/>
      <main className="pt-16 p-6">
        <Dashboard/>
      </main>
    </div>
  );
}
