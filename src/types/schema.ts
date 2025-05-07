
export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  serviceType: string;
  serviceDate: string;
  serviceDuration: number;
  nextServiceDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceType {
  id: string;
  name: string;
}
