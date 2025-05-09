
export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  serviceType: string;
  serviceDate: string;
  serviceDuration: number;
  serviceDurationUnit: "days" | "months" | "years";
  nextServiceDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceType {
  id: string;
  name: string;
}

export interface NotificationStatus {
  lastSent: string | null;
  isSent: boolean;
}

export interface SMSMessage {
  to: string;
  message: string;
}
