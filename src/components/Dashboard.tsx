
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { CustomersTable } from "@/components/CustomersTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function Dashboard() {
  const { customers, serviceTypes } = useStore();
  
  // Prepare data for the pie chart
  const chartData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    
    customers.forEach((customer) => {
      typeCounts[customer.serviceType] = (typeCounts[customer.serviceType] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [customers]);
  
  // Calculate customers with upcoming service (next 30 days)
  const upcomingServicesCount = useMemo(() => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    return customers.filter((customer) => {
      const nextService = new Date(customer.nextServiceDate);
      return nextService >= today && nextService <= thirtyDaysLater;
    }).length;
  }, [customers]);
  
  // Calculate customers with overdue service
  const overdueServicesCount = useMemo(() => {
    const today = new Date();
    
    return customers.filter((customer) => {
      return new Date(customer.nextServiceDate) < today;
    }).length;
  }, [customers]);

  // Calculate customers needing SMS alert (next 5 days)
  const alertServicesCount = useMemo(() => {
    const today = new Date();
    const fiveDaysLater = new Date();
    fiveDaysLater.setDate(today.getDate() + 5);
    
    return customers.filter((customer) => {
      const nextService = new Date(customer.nextServiceDate);
      return nextService >= today && nextService <= fiveDaysLater;
    }).length;
  }, [customers]);

  // Colors for the chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Badge variant="outline">{customers.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              Customers requiring service
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Services
            </CardTitle>
            <Badge variant="outline">{upcomingServicesCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingServicesCount}</div>
            <p className="text-xs text-muted-foreground">
              Services due in the next 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              SMS Alerts
            </CardTitle>
            <Badge variant={alertServicesCount > 0 ? "destructive" : "outline"}>
              {alertServicesCount}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertServicesCount}</div>
            <p className="text-xs text-muted-foreground">
              Services requiring SMS alerts (next 5 days)
            </p>
          </CardContent>
        </Card>
      </div>

      {customers.length > 0 && (
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Service Type Distribution</CardTitle>
            <CardDescription>
              Distribution of service types across all customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      
      <CustomersTable />
    </div>
  );
}
