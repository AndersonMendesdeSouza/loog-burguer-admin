import type { TableRequestDto } from "../dtos/request/table-request.dto";
import type { TableResponseDto } from "../dtos/response/table-response.dto";
import api from "./api";

const API_URL = "/tables";

export const TableService = {
  create: async (dto: TableRequestDto): Promise<TableResponseDto> => {
    const response = await api.post<TableResponseDto>(API_URL, dto);
    return response.data;
  },

  findAll: async (): Promise<TableResponseDto[]> => {
    const response = await api.get<TableResponseDto[]>(`${API_URL}/find-all`);
    return response.data;
  },

  findOne: async (id: string): Promise<TableResponseDto> => {
    const response = await api.get<TableResponseDto>(`${API_URL}/${id}`);
    return response.data;
  },

  update: async (id: string, dto: TableRequestDto): Promise<TableResponseDto> => {
    const response = await api.put<TableResponseDto>(`${API_URL}/${id}`, dto);
    return response.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`${API_URL}/${id}`);
    return response.data;
  },
};
