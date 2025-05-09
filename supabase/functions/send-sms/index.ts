
// This is a Supabase Edge Function for sending SMS via Twilio

// To deploy this function:
// 1. Install Supabase CLI
// 2. Run: supabase functions deploy send-sms

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface RequestBody {
  to: string;
  message: string;
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

serve(async (req) => {
  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { to, message, accountSid, authToken, fromNumber } = body;
    
    if (!to || !message || !accountSid || !authToken || !fromNumber) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Format phone number (ensure it has a "+" prefix)
    const formattedTo = to.startsWith("+") ? to : `+${to}`;
    const formattedFrom = fromNumber.startsWith("+") ? fromNumber : `+${fromNumber}`;
    
    // Twilio API URL
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Create Basic Auth header
    const authHeader = "Basic " + btoa(`${accountSid}:${authToken}`);
    
    // Prepare form data for Twilio API
    const formData = new URLSearchParams();
    formData.append("To", formattedTo);
    formData.append("From", formattedFrom);
    formData.append("Body", message);
    
    // Make request to Twilio API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": authHeader
      },
      body: formData.toString()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error("Twilio API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send SMS", details: result }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, messageId: result.sid }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in send-sms function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
