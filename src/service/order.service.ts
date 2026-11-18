import type { OrderStatusEnum } from "../dtos/enums/orders-status.enum";
import type { OrderResponseDto } from "../dtos/response/orders-response.dto";
import api from "./api";
import type { CreateAdminOrderRequestDto } from "../dtos/request/create-admin-order-request.dto";

export const OrderService = {
  createAdmin: async (dto: CreateAdminOrderRequestDto): Promise<OrderResponseDto> => {
    const response = await api.post<OrderResponseDto>("/orders/admin", dto);
    return response.data;
  },

  findAll: async (): Promise<OrderResponseDto[]> => {
    const response = await api.get<OrderResponseDto[]>("/orders/find-all");
    return response.data;
  },

  findById: async (id: string): Promise<OrderResponseDto> => {
    const response = await api.get<OrderResponseDto>(`/orders/${id}`);
    return response.data;
  },

  alterStatus: async (
    id: string,
    status: OrderStatusEnum,
  ): Promise<OrderResponseDto> => {
    const response = await api.patch<OrderResponseDto>(`/orders/${id}`, {
      status,
    });
    return response.data;
  },
};
