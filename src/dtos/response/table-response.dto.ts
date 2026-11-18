import type { TableStatus } from "../enums/table-status.enum";
import type { TableTabResponseDto } from "./table-tab-response.dto";

export interface TableResponseDto {
  id: string;
  number: number;
  isActive: boolean;
  status?: TableStatus;
  tabs?: TableTabResponseDto[];
}
