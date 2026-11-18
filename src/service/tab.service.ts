import type { AddTabOrderRequestDto } from "../dtos/request/add-tab-order-request.dto";
import type { CreateTabOrderRequestDto } from "../dtos/request/create-tab-order-request.dto";
import type { TabRequestDto } from "../dtos/request/tab-request.dto";
import type { UpdateTabRequestDto } from "../dtos/request/update-tab-request.dto";
import type { TabResponseDto } from "../dtos/response/tab-response.dto";
import api from "./api";

const API_URL = "/tabs";

export const TabService = {
  create: async (dto: TabRequestDto): Promise<TabResponseDto> => {
    const response = await api.post<TabResponseDto>(API_URL, dto);
    return response.data;
  },

  createOrder: async (dto: CreateTabOrderRequestDto): Promise<TabResponseDto> => {
    const response = await api.post<TabResponseDto>(`${API_URL}/orders`, dto);
    return response.data;
  },

  addOrder: async (id: string, dto: AddTabOrderRequestDto): Promise<TabResponseDto> => {
    const response = await api.post<TabResponseDto>(`${API_URL}/${id}/orders`, dto);
    return response.data;
  },

  findAll: async (): Promise<TabResponseDto[]> => {
    const response = await api.get<TabResponseDto[]>(`${API_URL}/find-all`);
    return response.data;
  },

  findOne: async (id: string): Promise<TabResponseDto> => {
    const response = await api.get<TabResponseDto>(`${API_URL}/${id}`);
    return response.data;
  },

  update: async (id: string, dto: UpdateTabRequestDto): Promise<TabResponseDto> => {
    const response = await api.patch<TabResponseDto>(`${API_URL}/${id}`, dto);
    return response.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`${API_URL}/${id}`);
    return response.data;
  },
};
