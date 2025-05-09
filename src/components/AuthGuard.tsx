
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const AuthGuard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        setIsAuthenticated(!!data.user);
        
        if (error) {
          console.error("Auth error:", error);
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error("Auth check failed:", e);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  if (isAuthenticated === null) {
    // Still checking auth state
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
};
