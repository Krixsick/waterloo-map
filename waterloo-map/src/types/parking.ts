export type ParkingFilter = "all" | "free" | "paid" | "restricted";
export type ParkingStatus = "free" | "paid" | "restricted" | "closed";
export type ParkingLot = {
  id: string;
  name: string;
  coordinates: [number, number];
  mapFeatureId: number;
  access: "visitor" | "evenings" | "after-six" | "residence" | "permit" | "closed";
  rate: string;
  hours: string;
  notes: string;
  payment: string;
  freeWeekends?: boolean;
};
