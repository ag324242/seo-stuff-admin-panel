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

  const fetchAllReports = async () => {
    let allReports: Report[] = [];
    let lastFetchedCount = 0;
    let page = 0;
    const batchSize = 1000; 

    do {

        const { data: reports, error } = await supabaseClient
            .from("reports")
            .select("credits, created_at, user_id", { count: "exact" }) 
            .order("created_at", { ascending: false }) 
            .range(page * batchSize, (page + 1) * batchSize - 1); 

        if (error) {
            console.error("Error fetching reports:", error);
            break;
        }

        if (reports && reports.length > 0) {
            allReports = [...allReports, ...reports];
            lastFetchedCount = reports.length;
            page++;
        } else { 
            break; 
        }
    } while (lastFetchedCount === batchSize); 

    return allReports; 
};



const getUsedCredits = useCallback(async () => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: { user } } = await supabaseServerClient.auth.getUser();
  if (!user || totalUsedCredits?.length) return; 

  const reports = await fetchAllReports();
  if (!reports.length) return;

  const userCreditsMap = new Map();
  reports.forEach((report) => {
      userCreditsMap.set(report.user_id, (userCreditsMap.get(report.user_id) || 0) + report.credits);
  });

  const userCreditsArray = Array.from(userCreditsMap, ([userId, totalCredits]) => ({
      userId,
      totalCredits,
  }));

  setTotalUsedCredits(userCreditsArray);
}, [totalUsedCredits]);

useEffect(() => {
  if (user) {
    identify(user.id);
    getUsedCredits();
  }
}, [user, getUsedCredits]);


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
