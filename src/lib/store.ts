
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Customer, ServiceType, NotificationStatus } from "@/types/schema";
import { v4 as uuidv4 } from "uuid";
import { addDays, addMonths, addYears, format } from "date-fns";
import { supabase } from "./supabase";

interface StoreState {
  customers: Customer[];
  serviceTypes: ServiceType[];
  notificationStatus: Record<string, NotificationStatus>;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'nextServiceDate'>) => void;
  removeCustomer: (id: string) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  getCustomerById: (id: string) => Customer | undefined;
  
  addServiceType: (name: string) => void;
  removeServiceType: (id: string) => void;
  updateServiceType: (id: string, name: string) => void;
  
  updateNotificationStatus: (customerId: string, status: NotificationStatus) => void;
  getNotificationStatus: (customerId: string) => NotificationStatus;
  
  // New functions for Supabase sync
  syncWithSupabase: () => Promise<void>;
}

// Calculate the next service date based on the service date, duration, and duration unit
const calculateNextServiceDate = (serviceDate: string, serviceDuration: number, serviceDurationUnit: "days" | "months" | "years"): string => {
  const date = new Date(serviceDate);
  
  switch (serviceDurationUnit) {
    case "days":
      return format(addDays(date, serviceDuration), 'yyyy-MM-dd');
    case "months":
      return format(addMonths(date, serviceDuration), 'yyyy-MM-dd');
    case "years":
      return format(addYears(date, serviceDuration), 'yyyy-MM-dd');
    default:
      return format(addMonths(date, serviceDuration), 'yyyy-MM-dd');
  }
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      customers: [],
      serviceTypes: [
        { id: uuidv4(), name: 'Solar' },
        { id: uuidv4(), name: 'Water Filter' },
        { id: uuidv4(), name: 'UPS' },
      ],
      notificationStatus: {},

      addCustomer: async (customer) => {
        const now = new Date();
        const nextServiceDate = calculateNextServiceDate(
          customer.serviceDate, 
          customer.serviceDuration,
          customer.serviceDurationUnit
        );

        const newCustomer: Customer = {
          ...customer,
          id: uuidv4(),
          nextServiceDate,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        // Add to local state first for immediate UI update
        set((state) => ({
          customers: [...state.customers, newCustomer],
        }));

        try {
          // Sync with Supabase
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Store in Supabase with user_id field
            await supabase.from('customers').insert({
              ...newCustomer,
              user_id: user.id
            });
          }
        } catch (error) {
          console.error("Error syncing customer to Supabase:", error);
        }
      },

      removeCustomer: async (id) => {
        // Remove from local state first
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));

        try {
          // Sync with Supabase
          await supabase.from('customers').delete().eq('id', id);
        } catch (error) {
          console.error("Error removing customer from Supabase:", error);
        }
      },

      updateCustomer: async (id, updatedCustomer) => {
        set((state) => {
          const customerIndex = state.customers.findIndex((c) => c.id === id);
          
          if (customerIndex === -1) return state;
          
          const customer = state.customers[customerIndex];
          
          // Calculate next service date if service date, duration, or duration unit changes
          let nextServiceDate = customer.nextServiceDate;
          if (
            (updatedCustomer.serviceDate && updatedCustomer.serviceDate !== customer.serviceDate) ||
            (updatedCustomer.serviceDuration !== undefined && 
             updatedCustomer.serviceDuration !== customer.serviceDuration) ||
            (updatedCustomer.serviceDurationUnit && 
             updatedCustomer.serviceDurationUnit !== customer.serviceDurationUnit)
          ) {
            nextServiceDate = calculateNextServiceDate(
              updatedCustomer.serviceDate || customer.serviceDate,
              updatedCustomer.serviceDuration !== undefined 
                ? updatedCustomer.serviceDuration 
                : customer.serviceDuration,
              updatedCustomer.serviceDurationUnit || customer.serviceDurationUnit
            );
          }
          
          const updatedCustomers = [...state.customers];
          const updatedCustomerData = {
            ...customer,
            ...updatedCustomer,
            nextServiceDate,
            updatedAt: new Date().toISOString(),
          };
          
          updatedCustomers[customerIndex] = updatedCustomerData;
          
          // Update in Supabase
          (async () => {
            try {
              await supabase
                .from('customers')
                .update(updatedCustomerData)
                .eq('id', id);
            } catch (error) {
              console.error("Error updating customer in Supabase:", error);
            }
          })();
          
          return { customers: updatedCustomers };
        });
      },

      getCustomerById: (id) => {
        return get().customers.find((c) => c.id === id);
      },

      addServiceType: async (name) => {
        const newType = { id: uuidv4(), name };
        
        // Update local state
        set((state) => ({
          serviceTypes: [...state.serviceTypes, newType],
        }));

        try {
          // Sync with Supabase
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('service_types').insert({
              ...newType,
              user_id: user.id
            });
          }
        } catch (error) {
          console.error("Error syncing service type to Supabase:", error);
        }
      },

      removeServiceType: async (id) => {
        // Update local state
        set((state) => ({
          serviceTypes: state.serviceTypes.filter((s) => s.id !== id),
        }));

        try {
          // Sync with Supabase
          await supabase.from('service_types').delete().eq('id', id);
        } catch (error) {
          console.error("Error removing service type from Supabase:", error);
        }
      },

      updateServiceType: async (id, name) => {
        // Update local state
        set((state) => {
          const typeIndex = state.serviceTypes.findIndex((s) => s.id === id);
          
          if (typeIndex === -1) return state;
          
          const updatedTypes = [...state.serviceTypes];
          updatedTypes[typeIndex] = { ...updatedTypes[typeIndex], name };
          
          return { serviceTypes: updatedTypes };
        });

        try {
          // Sync with Supabase
          await supabase
            .from('service_types')
            .update({ name })
            .eq('id', id);
        } catch (error) {
          console.error("Error updating service type in Supabase:", error);
        }
      },
      
      updateNotificationStatus: async (customerId, status) => {
        // Update local state
        set((state) => ({
          notificationStatus: {
            ...state.notificationStatus,
            [customerId]: status
          }
        }));

        try {
          // Sync with Supabase
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('notification_status').upsert({
              customer_id: customerId,
              user_id: user.id,
              last_sent: status.lastSent,
              is_sent: status.isSent
            });
          }
        } catch (error) {
          console.error("Error syncing notification status to Supabase:", error);
        }
      },
      
      getNotificationStatus: (customerId) => {
        return get().notificationStatus[customerId] || { lastSent: null, isSent: false };
      },

      // Function to sync all data with Supabase
      syncWithSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Fetch customers for current user
          const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id);

          // Fetch service types for current user
          const { data: serviceTypeData } = await supabase
            .from('service_types')
            .select('*')
            .eq('user_id', user.id);

          // Fetch notification status for current user
          const { data: notificationData } = await supabase
            .from('notification_status')
            .select('*')
            .eq('user_id', user.id);

          // Update local state with fetched data
          if (customerData) {
            set({ customers: customerData.map(c => ({ 
              id: c.id, 
              name: c.name,
              phoneNumber: c.phone_number,
              serviceType: c.service_type,
              serviceDate: c.service_date,
              serviceDuration: c.service_duration,
              serviceDurationUnit: c.service_duration_unit,
              nextServiceDate: c.next_service_date,
              createdAt: c.created_at,
              updatedAt: c.updated_at
            }))});
          }

          if (serviceTypeData) {
            set({ serviceTypes: serviceTypeData });
          }

          if (notificationData) {
            const notificationStatus = {};
            notificationData.forEach(n => {
              notificationStatus[n.customer_id] = {
                lastSent: n.last_sent,
                isSent: n.is_sent
              };
            });
            set({ notificationStatus });
          }
        } catch (error) {
          console.error("Error syncing with Supabase:", error);
        }
      }
    }),
    {
      name: "service-scheduler-store",
      // Only store these fields in localStorage
      partialize: (state) => ({
        customers: state.customers,
        serviceTypes: state.serviceTypes,
        notificationStatus: state.notificationStatus,
      }),
    }
  )
);

// Initialize sync with Supabase when auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    useStore.getState().syncWithSupabase();
  }
});
