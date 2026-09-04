export interface CampusFoodInfo {
  name: string;
  location: string | null;
  description: string;
  paymentMethods: string[];
  hours: Record<string, string>;
  exceptions: string[];
  url: string;
}
