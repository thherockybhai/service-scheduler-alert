
import { Dashboard } from "@/components/Dashboard";
import { Navbar } from "@/components/Navbar";
import { NotificationService } from "@/components/NotificationService";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const Index = () => {
  const [userName, setUserName] = useState<string>("");
  const { syncWithSupabase } = useStore();
  
  useEffect(() => {
    // Check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      toast.error("Supabase configuration is missing", {
        description: "Please connect your Lovable project to Supabase using the green button in the top right corner."
      });
      return;
    }
    
    const getUserInfo = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
          setUserName(user.email || "User");
          // Sync data from Supabase for this user
          syncWithSupabase();
        }
        
        if (error) {
          console.error("User info error:", error);
        }
      } catch (e) {
        console.error("Failed to get user info:", e);
      }
    };
    
    getUserInfo();
  }, [syncWithSupabase]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 container py-8">
        {userName && (
          <h1 className="text-2xl font-bold mb-6">Welcome, {userName.split('@')[0]}</h1>
        )}
        <Dashboard />
      </div>
      <NotificationService checkInterval={60} /> {/* Set to check every 60 seconds for testing */}
    </div>
  );
};

export default Index;
