
import { Dashboard } from "@/components/Dashboard";
import { Navbar } from "@/components/Navbar";
import { NotificationService } from "@/components/NotificationService";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";

const Index = () => {
  const [userName, setUserName] = useState<string>("");
  const { syncWithSupabase } = useStore();
  
  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email || "User");
        // Sync data from Supabase for this user
        syncWithSupabase();
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
