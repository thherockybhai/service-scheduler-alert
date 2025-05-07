
import { Dashboard } from "@/components/Dashboard";
import { Navbar } from "@/components/Navbar";
import { NotificationService } from "@/components/NotificationService";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 container py-8">
        <Dashboard />
      </div>
      <NotificationService />
    </div>
  );
};

export default Index;
