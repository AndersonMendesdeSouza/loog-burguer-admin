export const TabStatus = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
} as const;

export type TabStatus = (typeof TabStatus)[keyof typeof TabStatus];
