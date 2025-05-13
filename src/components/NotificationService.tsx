import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { addDays, isPast, parseISO, isEqual, format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Customer } from "@/types/schema";
import { supabase } from "@/lib/supabase";
import { Settings, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getTwilioConfig, updateTwilioConfig } from "@/lib/twilioConfig";

interface NotificationServiceProps {
  checkInterval?: number; // Time in seconds between checks
}

export const NotificationService = ({ checkInterval = 60 }: NotificationServiceProps) => {
  const { customers, updateNotificationStatus, getNotificationStatus } = useStore();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Twilio configuration
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load Twilio config on component mount
  useEffect(() => {
    const loadTwilioConfig = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const config = await getTwilioConfig();
          setAccountSid(config.accountSid);
          setAuthToken(config.authToken);
          setPhoneNumber(config.phoneNumber);
        }
      } catch (error) {
        console.error("Error loading Twilio config:", error);
      }
    };
    
    loadTwilioConfig();
  }, []);

  const saveTwilioConfig = async () => {
    setIsLoading(true);
    try {
      await updateTwilioConfig({
        accountSid,
        authToken,
        phoneNumber,
      });
      
      setIsConfiguring(false);
      toast.success("Twilio configuration saved", {
        description: "Your SMS settings have been updated"
      });
    } catch (error) {
      toast.error("Failed to save configuration");
      console.error("Error saving Twilio config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check for upcoming service dates
  const checkUpcomingServices = async () => {
    const today = new Date();
    
    // Find customers who need notification (5 days before service date)
    const customersNeedingNotification = customers.filter((customer) => {
      // Parse next service date
      const nextServiceDate = parseISO(customer.nextServiceDate);
      
      // Calculate date 5 days before service
      const notificationDate = addDays(nextServiceDate, -5);
      
      // Get notification status for this customer
      const notificationStatus = getNotificationStatus(customer.id);
      
      // Check if today is the day to send notification
      // and notification hasn't been sent yet
      return (
        isEqual(
          new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          new Date(notificationDate.getFullYear(), notificationDate.getMonth(), notificationDate.getDate())
        ) && 
        !notificationStatus.isSent
      );
    });

    // Send notifications if needed
    if (customersNeedingNotification.length > 0) {
      for (const customer of customersNeedingNotification) {
        try {
          // Format the next service date for the SMS
          const formattedNextServiceDate = format(
            parseISO(customer.nextServiceDate),
            "MMMM dd, yyyy"
          );
          
          // Create reminder message with new format
          const message = `Hey, Your ${customer.serviceType} service is scheduled on ${formattedNextServiceDate}`;
          
          // Send SMS notification
          await sendSMSNotification(customer, message);
          
          // Update notification status
          updateNotificationStatus(customer.id, {
            lastSent: new Date().toISOString(),
            isSent: true,
          });
          
          console.log(`Notification sent to ${customer.name}`);
          toast.success(`Notification sent to ${customer.name}`);
        } catch (error) {
          console.error(`Failed to send notification to ${customer.name}:`, error);
          toast.error(`Failed to send notification to ${customer.name}`);
        }
      }
    }
  };

  // Function to send SMS for completed service
  const sendCompletionSMS = async (customer: Customer) => {
    try {
      // Format the next service date for the SMS
      const formattedNextServiceDate = format(
        parseISO(customer.nextServiceDate),
        "MMMM dd, yyyy"
      );
      
      // Create completion message with new format
      const message = `Hey, Thank you for choosing Kitkat! Service for ${customer.serviceType} is done and the next Service date is ${formattedNextServiceDate}. Have a great day!`;
      
      // Send SMS notification
      await sendSMSNotification(customer, message);
      
      toast.success(`Service completion notification sent to ${customer.name}`);
    } catch (error) {
      console.error(`Failed to send completion notification to ${customer.name}:`, error);
      toast.error(`Failed to send completion notification to ${customer.name}`);
    }
  };

  // Function to send SMS via Twilio (through Supabase Edge Function)
  const sendSMSNotification = async (customer: Customer, message: string) => {
    try {
      const config = await getTwilioConfig();
      
      // Call Supabase Edge Function to send SMS
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: customer.phoneNumber,
          message: message,
          accountSid: config.accountSid,
          authToken: config.authToken,
          fromNumber: config.phoneNumber
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error("Error sending SMS notification:", error);
      throw error;
    }
  };

  // Check for notifications periodically
  useEffect(() => {
    if (!userId) return;
    
    // Initial check
    checkUpcomingServices();
    
    // Set up interval for checking
    const intervalId = setInterval(checkUpcomingServices, checkInterval * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [customers, userId]);

  // Add capability to trigger completion SMS manually
  // Properly typed with the window interface extension in vite-env.d.ts
  window.sendServiceCompletionSMS = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      await sendCompletionSMS(customer);
    } else {
      console.error(`Customer with ID ${customerId} not found`);
    }
  };

  if (isConfiguring) {
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-white shadow-lg rounded-lg border z-50 w-80">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Configure Twilio SMS</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setIsConfiguring(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Account SID
            </label>
            <Input 
              type="text" 
              value={accountSid} 
              onChange={(e) => setAccountSid(e.target.value)}
              className="text-sm"
              placeholder="AC..."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Auth Token
            </label>
            <Input 
              type="password" 
              value={authToken} 
              onChange={(e) => setAuthToken(e.target.value)}
              className="text-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Phone Number
            </label>
            <Input 
              type="text" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-sm"
              placeholder="+1234567890"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsConfiguring(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={saveTwilioConfig}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsConfiguring(true)}
        className="flex items-center gap-2 shadow-md"
      >
        <Settings className="h-4 w-4" />
        SMS Settings
      </Button>
    </div>
  );
};
