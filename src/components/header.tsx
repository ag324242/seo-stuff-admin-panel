"use client";

import supabaseBrowserClient from "@/app-kit/supabase/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabaseBrowserClient.auth.signOut();
      if (error) {
        console.error("Sign-out error:", error.message);
        return;
      }
      router.push("/auth/login");
    } catch (err) {
      console.error("Unexpected error during sign-out:", err);
    }
  };

  return (
    <header className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="text-xl flex gap-2 items-center font-bold ">
          <Image src="/image/logo.png" alt="Your Logo" width={40} height={40} />
          <h2 className="text-xl font-semibold">
            SEO STUFF<span className="text-sm ml-2 font-light">v2.1</span>
          </h2>
        </div>

        {/* Desktop Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="hidden md:block bg-primary text-white px-4 py-2 rounded-lg"
        >
          Sign Out
        </button>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            className="text-gray-700 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full right-0 w-[20%] flex flex-col items-center bg-white shadow-md p-4">
          <button
            onClick={handleSignOut}
            className="bg-primary text-white px-4 py-2 rounded-lg w-full"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
