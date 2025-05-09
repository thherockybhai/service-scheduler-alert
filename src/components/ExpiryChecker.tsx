
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";

export function ExpiryChecker() {
  const { customers } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Calculate days remaining for each customer
  const customersWithDaysLeft = useMemo(() => {
    const today = new Date();
    
    return customers.map(customer => {
      const nextServiceDate = new Date(customer.nextServiceDate);
      const diffTime = nextServiceDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...customer,
        daysLeft
      };
    });
  }, [customers]);
  
  // Sort customers by days remaining (ascending)
  const sortedCustomers = useMemo(() => {
    return [...customersWithDaysLeft].sort((a, b) => a.daysLeft - b.daysLeft);
  }, [customersWithDaysLeft]);
  
  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return sortedCustomers;
    
    return sortedCustomers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber.includes(searchTerm)
    );
  }, [sortedCustomers, searchTerm]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiry Checker</CardTitle>
        <CardDescription>
          Customers sorted by days remaining until next service date
        </CardDescription>
        <div className="relative w-full sm:w-[300px] mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Last Service Date</TableHead>
                <TableHead>Days Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>
                      {customer.phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(customer.serviceDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className={
                      customer.daysLeft <= 0 ? "text-red-500 font-bold" :
                      customer.daysLeft <= 5 ? "text-red-500" :
                      customer.daysLeft <= 30 ? "text-yellow-500" :
                      "text-green-500"
                    }>
                      {customer.daysLeft <= 0 
                        ? `Overdue by ${Math.abs(customer.daysLeft)} days` 
                        : `${customer.daysLeft} days`}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
