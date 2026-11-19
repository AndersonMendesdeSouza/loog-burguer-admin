import { OrderStatusEnum } from "../dtos/enums/orders-status.enum";

type OrderStatusData = {
  status: OrderStatusEnum;
  type?: string;
  mesaId?: string | null;
  tableId?: string | null;
};

export function isTableOrder(order: Omit<OrderStatusData, "status">): boolean {
  return (
    order.type === "DINE_IN" || Boolean(order.tableId || order.mesaId?.trim())
  );
}

export function getOrderStatus(order: OrderStatusData): OrderStatusEnum {
  if (order.status === OrderStatusEnum.KITCHEN_ACCEPTED)
    return OrderStatusEnum.PREPARING;
  if (
    (isTableOrder(order) || order.type === "PICKUP") &&
    (order.status === OrderStatusEnum.ON_ROUTE ||
      order.status === OrderStatusEnum.OUT_FOR_DELIVERY)
  ) {
    return OrderStatusEnum.READY;
  }
  if (order.status === OrderStatusEnum.OUT_FOR_DELIVERY)
    return OrderStatusEnum.ON_ROUTE;
  return order.status;
}

export function isFinishedOrder(order: OrderStatusData): boolean {
  const status = getOrderStatus(order);
  return status === OrderStatusEnum.DELIVERED;
}
