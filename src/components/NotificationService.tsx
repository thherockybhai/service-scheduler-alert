
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { addDays, isPast, parseISO, isEqual } from "date-fns";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

interface NotificationServiceProps {
  checkInterval?: number; // Time in seconds between checks
}

export const NotificationService = ({ checkInterval = 3600 }: NotificationServiceProps) => {
  const { customers, updateNotificationStatus, getNotificationStatus } = useStore();
  const [webhookUrl, setWebhookUrl] = useState<string>(localStorage.getItem('smsWebhookUrl') || '');
  const [isConfiguring, setIsConfiguring] = useState(false);

  const saveWebhook = () => {
    localStorage.setItem('smsWebhookUrl', webhookUrl);
    setIsConfiguring(false);
    toast({
      title: "Webhook saved",
      description: "Your SMS webhook URL has been saved",
    });
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
    if (customersNeedingNotification.length > 0 && webhookUrl) {
      for (const customer of customersNeedingNotification) {
        try {
          // Send SMS notification via webhook
          await sendSMSNotification(customer);
          
          // Update notification status
          updateNotificationStatus(customer.id, {
            lastSent: new Date().toISOString(),
            isSent: true,
          });
          
          console.log(`Notification sent to ${customer.name}`);
        } catch (error) {
          console.error(`Failed to send notification to ${customer.name}:`, error);
        }
      }
    }
  };

  // Function to send SMS via webhook (e.g., to Zapier, Twilio, etc.)
  const sendSMSNotification = async (customer: Customer) => {
    if (!webhookUrl) {
      console.error("SMS webhook URL not configured");
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Handle CORS for external services
        body: JSON.stringify({
          to: customer.phoneNumber,
          message: `Reminder: Your ${customer.serviceType} service is scheduled in 5 days on ${customer.nextServiceDate}. Please contact us if you need to reschedule.`,
          customerName: customer.name,
          serviceType: customer.serviceType,
          serviceDate: customer.nextServiceDate
        }),
      });

      return response;
    } catch (error) {
      console.error("Error sending SMS notification:", error);
      throw error;
    }
  };

  // Check for notifications periodically
  useEffect(() => {
    // Initial check
    checkUpcomingServices();
    
    // Set up interval for checking
    const intervalId = setInterval(checkUpcomingServices, checkInterval * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [customers, webhookUrl]);

  if (isConfiguring) {
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-white shadow-lg rounded-lg border z-50 w-80">
        <h3 className="text-sm font-medium mb-2">Configure SMS Webhook</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Enter your SMS service webhook URL (Twilio, Zapier, etc.)
        </p>
        <input 
          type="text" 
          value={webhookUrl} 
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="w-full mb-2 p-2 text-sm border rounded"
          placeholder="https://hooks.zapier.com/hooks/catch/..."
        />
        <div className="flex justify-end gap-2">
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
            onClick={saveWebhook}
          >
            Save
          </Button>
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
        <span className="bg-green-500 w-2 h-2 rounded-full"></span>
        SMS Notifications
      </Button>
    </div>
  );
};
