
import { createClient } from '@supabase/supabase-js';

// Use the actual Supabase URL and anon key for the connected project
const supabaseUrl = 'https://reelifhkeylkqsxibsjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZWxpZmhrZXlsa3FzeGlic2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MTk2MzYsImV4cCI6MjA2MjE5NTYzNn0.8sLRjIgPFswGctGxFrfkIIBIYAOJViodRK7nDpFc46Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return true; // Since we now have hardcoded valid credentials
};
