import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  specialty: string | null;
  onboarding_completed: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
    return data;
  };

  useEffect(() => {
    const rememberMe = localStorage.getItem("rememberMe");
    const activeSession = sessionStorage.getItem("activeSession");

    // Determine if we should clear the session (Remember Me was off + new browser session)
    const shouldClearSession = rememberMe === "false" && !activeSession;

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Then handle session initialization
    const initSession = async () => {
      if (shouldClearSession) {
        // Sign out to clear the persisted session
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Mark this browser tab as having an active session
      sessionStorage.setItem("activeSession", "true");

      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        setSession(existingSession);
        setUser(existingSession.user);
        fetchProfile(existingSession.user.id);
      }
      setLoading(false);
    };

    initSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("activeSession");
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
