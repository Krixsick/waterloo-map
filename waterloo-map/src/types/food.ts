export interface CampusFoodInfo {
  name: string;
  location: string | null;
  features: string[];
  paymentMethods: string[];
  hours: Record<string, string>;
  exceptions: string[];
  url: string;
}
