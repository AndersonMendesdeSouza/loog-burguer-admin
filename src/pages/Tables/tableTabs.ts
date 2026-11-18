import type { TabResponseDto } from "../../dtos/response/tab-response.dto";
import { OrderStatusEnum } from "../../dtos/enums/orders-status.enum";
import { TabStatus } from "../../dtos/enums/tab-status.enum";
import type { MockTab } from "./mockTables";
import type { OrderResponseDto } from "../../dtos/response/orders-response.dto";

// Mantém os componentes atuais, usando os IDs, preços e pedidos salvos pela API.
export function toTableTab(tab: TabResponseDto): MockTab {
  return {
    id: tab.id,
    apiTab: tab,
    type: "table",
    tableNumber: tab.table.number,
    customerName: `Mesa ${tab.table.number}`,
    openedAt: tab.openedAt,
    closedAt: tab.status === TabStatus.OPEN ? undefined : tab.closedAt ?? tab.openedAt,
    notes: "",
    orders: tab.orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      cancelled: order.status === OrderStatusEnum.CANCELED,
      items: order.items.map((item) => ({
        id: item.productId ?? item.id,
        name: item.name,
        description: item.description ?? "",
        category: "FOOD",
        image: item.imageUrl,
        priceInCents: Math.round(Number(item.unitPrice) * 100),
        quantity: item.quantity,
      })),
    })),
  };
}

export function toStandaloneOrder(order: OrderResponseDto): MockTab {
  const address = order.deliveryAddress ?? order.address;
  const deliveryAddress = order.deliveryAddress;
  return {
    id: order.id,
    apiOrder: order,
    type: order.type === "PICKUP" ? "pickup" : "delivery",
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    openedAt: order.createdAt,
    closedAt: order.status === OrderStatusEnum.DELIVERED || order.status === OrderStatusEnum.CANCELED ? order.updatedAt : undefined,
    notes: "",
    deliveryAddress: address ? {
      street: address.street, number: address.number,
      block: deliveryAddress?.block ?? "", lot: deliveryAddress?.lot ?? "",
      neighborhood: address.neighborhood, city: address.city, state: address.state,
      zipCode: address.zipCode, complement: address.complement ?? "", reference: address.reference ?? "",
    } : undefined,
    orders: [{
      id: order.id, createdAt: order.createdAt,
      cancelled: order.status === OrderStatusEnum.CANCELED,
      items: order.items.map((item) => ({
        id: item.productId ?? item.id, name: item.name, description: item.description ?? "",
        category: "FOOD", image: item.imageUrl,
        priceInCents: Math.round(Number(item.unitPrice) * 100), quantity: item.quantity,
      })),
    }],
  };
}
