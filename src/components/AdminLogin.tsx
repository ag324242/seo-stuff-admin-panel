"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import supabaseBrowserClient from "@/app-kit/supabase/supabaseClient";
import { Session } from "@supabase/supabase-js";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  // Check session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseBrowserClient.auth.getSession();
      if (data?.session) {
        console.log("Existing session found:", data.session);
        setSession(data.session);
        // Redirect if already logged in
        if (data.session.user?.user_metadata?.is_admin) {
          console.log("User is admin. Redirecting...");
          router.push("/");
        } else {
          console.warn("User is not an admin.");
          setError("You are not authorized to access the admin dashboard.");
        }
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabaseBrowserClient.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state changed:", session);
        setSession(session);

        if (session?.user?.user_metadata?.is_admin) {
          console.log("User is admin. Redirecting...");
          router.push("/");
        } else if (session) {
          console.warn("User is not an admin.");
          setError("You are not authorized to access the admin dashboard.");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Admin Login Attempt:", { email, password });

    try {
      const { data, error } = await supabaseBrowserClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        setError(error.message);
        return;
      }

      const user = data?.session?.user;
      console.log("User logged in:", user);

      if (user) {
        console.log("Checking user metadata:", user.user_metadata);
      }

      if (user && user.user_metadata?.is_admin) {
        console.log("Admin login successful. Redirecting...");
        setTimeout(() => router.push("/"), 500); // Slight delay before redirect
      } else {
        console.warn("Access denied: User is not an admin");
        setError("You are not authorized to access the admin dashboard.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex w-full justify-center items-center h-screen">
      <div className="w-full max-w-lg bg-white drop-shadow-xl rounded-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-lg transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
