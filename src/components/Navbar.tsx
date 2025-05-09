import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export function Navbar() {
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      navigate("/signin");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };
  
  return (
    <header className="border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-semibold text-xl text-primary flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          <span>Service Scheduler</span>
        </Link>
        <nav className="flex items-center gap-4 md:gap-6">
          <Link to="/">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link to="/add-customer">
            <Button>Add Customer</Button>
          </Link>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
