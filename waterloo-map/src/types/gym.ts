export interface GymOccupy {
  name: string | undefined;
  occupancy: number | undefined;
  remaining: number | undefined;
  maxOccupancy: number | undefined;
  ratio: number | undefined;
  percent: number | undefined;
}

export interface GymFullInfo {
  hours: Record<string, string> | null;
  busyness: GymOccupy | null;
}

//unnecessary
// export interface GymHours {
//   monday: number | undefined;
//   tuesday: number | undefined;
//   wednesday: number | undefined;
//   thursday: number | undefined;
//   friday: number | undefined;
//   saturday: number | undefined;
//   sunday: number | undefined;
// }
