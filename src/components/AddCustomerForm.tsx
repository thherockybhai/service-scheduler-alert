
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const phoneRegex = /^\d{10}$/;

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().refine((val) => phoneRegex.test(val), {
    message: "Phone number must be exactly 10 digits",
  }),
  serviceType: z.string().min(1, "Service type is required"),
  serviceDate: z.date({
    required_error: "Service date is required",
  }),
  serviceDuration: z.coerce.number().int().min(1, "Duration must be at least 1"),
  serviceDurationUnit: z.enum(["days", "months", "years"], {
    required_error: "Duration unit is required",
  }),
});

type FormData = z.infer<typeof formSchema>;

export function AddCustomerForm() {
  const [newServiceType, setNewServiceType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { serviceTypes, addServiceType, addCustomer } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Initialize the form with defaults
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      serviceType: "",
      serviceDuration: 6,
      serviceDurationUnit: "months",
    },
  });

  // Check if user is authenticated to prevent Row Level Security issues
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to add customers",
          variant: "destructive",
        });
        navigate("/signin");
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [navigate, toast]);

  // Fetch service types if they're empty (handles initial load)
  useEffect(() => {
    if (serviceTypes.length === 0) {
      // This will trigger syncWithSupabase which will fetch service types
      useStore.getState().syncWithSupabase();
    }
  }, [serviceTypes.length]);
  
  const handleSubmitServiceType = () => {
    if (newServiceType.trim()) {
      addServiceType(newServiceType.trim());
      form.setValue('serviceType', newServiceType.trim());
      setNewServiceType("");
      setDialogOpen(false);
      
      toast({
        title: "Service Type Added",
        description: `${newServiceType} has been added to service types.`,
      });
    }
  };

  const setToday = () => {
    form.setValue('serviceDate', new Date());
  };

  const onSubmit = (data: FormData) => {
    addCustomer({
      name: data.name,
      phoneNumber: data.phoneNumber,
      serviceType: data.serviceType,
      serviceDate: format(data.serviceDate, "yyyy-MM-dd"),
      serviceDuration: data.serviceDuration,
      serviceDurationUnit: data.serviceDurationUnit,
    });

    toast({
      title: "Customer Added",
      description: "The customer has been added successfully.",
    });
    
    navigate("/");
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Add New Customer</h3>
        <p className="text-sm text-muted-foreground">
          Add a new customer with their service details.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="1234567890" 
                      {...field} 
                      maxLength={10}
                      onChange={(e) => {
                        // Allow only numbers
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a 10-digit phone number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceTypes.length > 0 ? (
                        serviceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No service types available
                        </SelectItem>
                      )}
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left font-normal"
                            type="button"
                          >
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add new service type
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Service Type</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="flex gap-2">
                              <Input
                                placeholder="New service type"
                                value={newServiceType}
                                onChange={(e) => setNewServiceType(e.target.value)}
                              />
                              <Button 
                                onClick={handleSubmitServiceType}
                                type="button"
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="serviceDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Service Date</FormLabel>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            type="button"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={setToday}
                      className="shrink-0"
                    >
                      Today
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 grid-cols-3">
            <FormField
              control={form.control}
              name="serviceDuration"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Service Duration</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      min={1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 6 : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="serviceDurationUnit"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormDescription>
            How often the service needs to be performed (default is 6 months)
          </FormDescription>
          
          <div className="flex justify-end">
            <Button type="submit">
              Add Customer
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
