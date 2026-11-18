import type { TabOrderItemRequestDto } from "./add-tab-order-request.dto";

export interface CreateTabOrderRequestDto {
  tableId: string;
  items: TabOrderItemRequestDto[];
}
