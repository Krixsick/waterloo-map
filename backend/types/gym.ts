export interface GymOccupy {
  name: string | undefined;
  occupancy: number | undefined;
  remaining: number | undefined;
  maxOccupancy: number | undefined;
  ratio: number | undefined;
  percent: number | undefined;
}

export type GymBusyness = {
  overall?: GymOccupy;
  facilities: Record<string, GymOccupy>;
};

export type GymFullInfo = {
  hours: Record<string, string>;
  busyness: GymBusyness;
};