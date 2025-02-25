import React, { useContext, useEffect, useState } from "react";
import { errorHandler, logger } from "./utils/logger";
import supabaseBrowserClient from "@/app-kit/supabase/supabaseClient";
import { Session, User } from "@supabase/gotrue-js";
import axios from "axios";
import { identify, identityReset } from "@/app-kit/analytics/analytics";
import { usePlausible } from "next-plausible";
import supabaseServerClient from "./supabaseService";
import { useCallback } from "react";
// import * as fbq from "@/lib/fpixel";
interface IAuthContext {
  signOut: () => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  user: User | null | undefined;
  session: Session | null | undefined;
  isLoading: boolean;
  isAdmin?: boolean;
  totalUsedCredits: UsedCredit[] | null;
  creditStatus: string  
}

interface UsedCredit {
    userId: string; 
    totalCredits: number
}

interface Report {
  credits: number;
  created_at: string;
  user_id: string;
}


// @ts-ignore
const AuthContext = React.createContext<IAuthContext>({});

export function useSupabaseAuthContext() {
  return useContext(AuthContext);
}

// @ts-ignore
export function SupabaseAuthContextProvider({ children }) {
  const plausible = usePlausible();
  const supabaseClient = supabaseBrowserClient;
  const [session, setSession] = useState<Session | null>();
  const [user, setUser] = useState<User | null>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [totalUsedCredits, setTotalUsedCredits] = useState<UsedCredit[] | null>(null);
  const [creditStatus, setCreditStatus] = useState("");

  useEffect(() => {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      logger("Auth event", event, session);
      if (event === "INITIAL_SESSION") {
        setSession(session);
        setIsLoading(false);
      }
      if (event === "SIGNED_OUT") {
        setSession(null);
      } else if (event === "SIGNED_IN") {
        setSession(session);
      }
    });
  }, []);

  useEffect(() => {
    logger("Session Data - Loading:", isLoading, "Data:", session);
    if (session?.user.id === user?.id) {
      return;
    }
    if (session) {
      setUser(session.user);
      // setIsAdmin(session.user?.id === ADMIN_ID);
    } else if (!session && user) {
      // clear user
      setUser(null);
    }
  }, [session]);

useEffect(() => {
  if (user) {
    identify(user.id);
  }
}, [user]);


  useEffect(() => {
    logger("user", user);
    if (user) {
      identify(user.id);
    }
  }, [user,]);



  async function signUp(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    if (error) {
      throw error;
    }

    return true;
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorHandler(error);
    }

    return { data, error };
  }

  async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      errorHandler(error);
    }

    identityReset();
    return true;
  }

  

  return (
    <AuthContext.Provider
      value={{
        signOut,
        signIn,
        user,
        session,
        isLoading,
        isAdmin,
        totalUsedCredits,
        creditStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
