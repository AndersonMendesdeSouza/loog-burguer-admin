import type { TabOrderItemRequestDto } from "./add-tab-order-request.dto";
import type { OrderDeliveryAddressRequestDto } from "./order-delivery-address-request.dto";

export interface CreateAdminOrderRequestDto {
  type: "PICKUP" | "DELIVERY";
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: OrderDeliveryAddressRequestDto;
  items: TabOrderItemRequestDto[];
}
