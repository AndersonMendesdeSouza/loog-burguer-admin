export interface TabOrderItemRequestDto {
  productId: string;
  quantity: number;
}

export interface AddTabOrderRequestDto {
  items: TabOrderItemRequestDto[];
}
