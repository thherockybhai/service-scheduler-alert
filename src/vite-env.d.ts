
/// <reference types="vite/client" />

interface Window {
  sendServiceCompletionSMS: (customerId: string) => Promise<void>;
}
