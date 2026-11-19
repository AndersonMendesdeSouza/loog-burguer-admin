import type { ChatMessageResponseDto } from "../dtos/response/chat-message-response.dto";

export type MessageCreatedEvent = {
  orderId: string;
  message: ChatMessageResponseDto;
};

export type MessageNotification = {
  id: string;
  orderId: string;
  text: string;
  createdAt: string;
  read: boolean;
};
