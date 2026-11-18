export const OrderType = {
  DINE_IN: "DINE_IN",
  DELIVERY: "DELIVERY",
  PICKUP: "PICKUP",
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];
