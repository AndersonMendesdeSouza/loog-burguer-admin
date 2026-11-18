import type { TableResponseDto } from "./table-response.dto";
import type { TableTabResponseDto } from "./table-tab-response.dto";

export interface TabResponseDto extends TableTabResponseDto {
  table: TableResponseDto;
}
