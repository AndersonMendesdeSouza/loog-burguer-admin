import type { TabStatus } from "../enums/tab-status.enum";
import type { OrderResponseDto } from "./orders-response.dto";

export interface TableTabResponseDto {
  id: string;
  status: TabStatus;
  orders: OrderResponseDto[];
  subtotal: string;
  total: string;
  openedAt: string;
  closedAt: string | null;
  closingTotal: string | null;
  paymentMethod: string | null;
}
