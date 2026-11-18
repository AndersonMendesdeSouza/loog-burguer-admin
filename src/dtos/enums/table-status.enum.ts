export const TableStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  INACTIVE: "INACTIVE",
} as const;

export type TableStatus = (typeof TableStatus)[keyof typeof TableStatus];
