import React, { useContext, useEffect, useState } from "react";
import { errorHandler, logger } from "./utils/logger";
import supabaseBrowserClient from "@/app-kit/supabase/supabaseClient";
import { Session, User } from "@supabase/gotrue-js";
import axios from "axios";
import { identify, identityReset } from "@/app-kit/analytics/analytics";
import { usePlausible } from "next-plausible";
import supabaseServerClient from "./supabaseService";
// import * as fbq from "@/lib/fpixel";
interface IAuthContext {
  signOut: () => Promise<any>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  user: User | null | undefined;
  session: Session | null | undefined;
  isLoading: boolean;
  isAdmin?: boolean;
  showWelcome?: boolean;
  setShowWelcome: (show: boolean) => void;
  totalUsedCredits: UsedCredit[] | null;
  totalCredits: number | null;
  creditStatus: string
}

interface UsedCredit {
    userId: string; 
    totalCredits: number
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
  const [totalCredits, setTotalCredits] = useState<number | null>(null);
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

  const getUsedCredits = async () => {

    // CALCULATE EXPIRATION DATE (ONE YEAR AGO)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // GET LOGGED-IN USER
    const { data: { user } } = await supabaseServerClient.auth.getUser();
    if (!user || totalUsedCredits !== null) {
    return;
    }

    // USED
    const userCreditsMap = new Map();

    const { data: reports, error } = await supabaseClient
      .from("reports")
      .select("credits,created_at,user_id")
      .order("created_at", { ascending: false });

    if (reports) {
      const totalUsedCredits = reports
      .filter((report) => new Date(report.created_at) > oneYearAgo)
      .forEach((report) => {
        const userId = report.user_id;
        userCreditsMap.set(userId, (userCreditsMap.get(userId) || 0) + report.credits);
      });

    const userCreditsArray = Array.from(userCreditsMap, ([userId, totalCredits]) => ({
        userId,
        totalCredits,
    }))
    setTotalUsedCredits(userCreditsArray);
    }
    
  };

  useEffect(() => {
    logger("user", user);
    if (user) {
      identify(user.id);
      getUsedCredits();
    }
  }, [user,getUsedCredits]);



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
        signUp,
        signIn,
        user,
        session,
        isLoading,
        isAdmin,
        showWelcome,
        setShowWelcome,
        totalUsedCredits,
        totalCredits,
        creditStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
