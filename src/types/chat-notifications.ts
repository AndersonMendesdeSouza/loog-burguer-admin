import type { ChatMessageResponseDto } from "../dtos/response/chat-message-response.dto";

export type MessageCreatedEvent = {
  orderId: string;
  customerName?: string;
  orderType?: "DINE_IN" | "DELIVERY" | "PICKUP";
  mesaId?: string | null;
  message: ChatMessageResponseDto;
};

export type MessageNotification = {
  id: string;
  orderId: string;
  customerName?: string;
  text: string;
  createdAt: string;
  read: boolean;
};
