
import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import AddCustomerPage from "./pages/AddCustomerPage";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { AuthGuard } from "./components/AuthGuard";
import { supabase } from "./lib/supabase";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize tables in Supabase if they don't exist
    const initSupabaseTables = async () => {
      try {
        // This is just checking if we can access Supabase
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Supabase initialization error:", error);
        }
      } catch (err) {
        console.error("Failed to initialize Supabase:", err);
      }
    };

    initSupabaseTables();
  }, []);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Protected routes */}
              <Route element={<AuthGuard />}>
                <Route path="/" element={<Index />} />
                <Route path="/add-customer" element={<AddCustomerPage />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
