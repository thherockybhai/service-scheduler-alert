import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Customer, ServiceType } from "@/types/schema";
import { v4 as uuidv4 } from "uuid";
import { addMonths, format } from "date-fns";

interface StoreState {
  customers: Customer[];
  serviceTypes: ServiceType[];
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'nextServiceDate'>) => void;
  removeCustomer: (id: string) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  getCustomerById: (id: string) => Customer | undefined;
  
  addServiceType: (name: string) => void;
  removeServiceType: (id: string) => void;
  updateServiceType: (id: string, name: string) => void;
}

// Calculate the next service date based on the service date and duration
const calculateNextServiceDate = (serviceDate: string, serviceDuration: number): string => {
  const date = new Date(serviceDate);
  return format(addMonths(date, serviceDuration), 'yyyy-MM-dd');
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

      addCustomer: (customer) => {
        const now = new Date();
        const nextServiceDate = calculateNextServiceDate(
          customer.serviceDate, 
          customer.serviceDuration
        );

        const newCustomer: Customer = {
          ...customer,
          id: uuidv4(),
          nextServiceDate,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        set((state) => ({
          customers: [...state.customers, newCustomer],
        }));
      },

      removeCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },

      updateCustomer: (id, updatedCustomer) => {
        set((state) => {
          const customerIndex = state.customers.findIndex((c) => c.id === id);
          
          if (customerIndex === -1) return state;
          
          const customer = state.customers[customerIndex];
          
          // Calculate next service date if service date or duration changes
          let nextServiceDate = customer.nextServiceDate;
          if (
            (updatedCustomer.serviceDate && updatedCustomer.serviceDate !== customer.serviceDate) ||
            (updatedCustomer.serviceDuration !== undefined && 
             updatedCustomer.serviceDuration !== customer.serviceDuration)
          ) {
            nextServiceDate = calculateNextServiceDate(
              updatedCustomer.serviceDate || customer.serviceDate,
              updatedCustomer.serviceDuration !== undefined 
                ? updatedCustomer.serviceDuration 
                : customer.serviceDuration
            );
          }
          
          const updatedCustomers = [...state.customers];
          updatedCustomers[customerIndex] = {
            ...customer,
            ...updatedCustomer,
            nextServiceDate,
            updatedAt: new Date().toISOString(),
          };
          
          return { customers: updatedCustomers };
        });
      },

      getCustomerById: (id) => {
        return get().customers.find((c) => c.id === id);
      },

      addServiceType: (name) => {
        set((state) => ({
          serviceTypes: [...state.serviceTypes, { id: uuidv4(), name }],
        }));
      },

      removeServiceType: (id) => {
        set((state) => ({
          serviceTypes: state.serviceTypes.filter((s) => s.id !== id),
        }));
      },

      updateServiceType: (id, name) => {
        set((state) => {
          const typeIndex = state.serviceTypes.findIndex((s) => s.id === id);
          
          if (typeIndex === -1) return state;
          
          const updatedTypes = [...state.serviceTypes];
          updatedTypes[typeIndex] = { ...updatedTypes[typeIndex], name };
          
          return { serviceTypes: updatedTypes };
        });
      },
    }),
    {
      name: "service-scheduler-store",
    }
  )
);
