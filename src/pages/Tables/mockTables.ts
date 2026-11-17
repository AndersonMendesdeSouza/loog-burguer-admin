export type OrderType = "table" | "pickup" | "delivery";
export type ProductCategory = "FOOD" | "DRINK" | "ADDON" | "DESSERT";

export type MockProduct = {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceInCents: number;
  image?: string;
};

export type MockOrderItem = MockProduct & { quantity: number };

export type MockOrder = {
  id: string;
  createdAt: string;
  items: MockOrderItem[];
};

export type DeliveryAddress = {
  street: string;
  number: string;
  block: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement: string;
  reference: string;
};

export type MockTab = {
  id: string;
  type: OrderType;
  tableNumber?: number;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: DeliveryAddress;
  openedAt: string;
  closedAt?: string;
  notes: string;
  orders: MockOrder[];
};

export type NewOrderDetails = {
  type: OrderType;
  tableNumber?: number;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: DeliveryAddress;
};

export const MOCK_TABLE_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);

export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: "FOOD", label: "Sanduíches" },
  { id: "DRINK", label: "Bebidas" },
  { id: "ADDON", label: "Porções" },
  { id: "DESSERT", label: "Sobremesas" },
];

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  table: "Mesa",
  pickup: "Balcão / Retirada",
  delivery: "Delivery",
};

// Preços em centavos evitam diferenças de arredondamento nos totais.
export const MOCK_PRODUCTS: MockProduct[] = [
  { id: "burger-four", name: "Hambúrguer 4 Carnes", description: "Pão brioche, quatro carnes, cheddar e bacon.", category: "FOOD", priceInCents: 5000, image: "/hamburguer.png" },
  { id: "burger-classic", name: "Hambúrguer Clássico", description: "Pão, carne, queijo, alface e tomate.", category: "FOOD", priceInCents: 3200, image: "/hamburguer.png" },
  { id: "burger-house", name: "Hambúrguer da Casa", description: "Carne artesanal, cheddar e cebola caramelizada.", category: "FOOD", priceInCents: 3800, image: "/hamburguer.png" },
  { id: "coke", name: "Coca-Cola Lata", description: "Refrigerante gelado, lata de 350 ml.", category: "DRINK", priceInCents: 500 },
  { id: "water", name: "Água mineral", description: "Garrafa de 500 ml, sem gás.", category: "DRINK", priceInCents: 400 },
  { id: "juice", name: "Suco de laranja", description: "Suco natural, copo de 400 ml.", category: "DRINK", priceInCents: 800 },
  { id: "fries", name: "Batata Frita Grande", description: "Porção de batatas crocantes com molho da casa.", category: "ADDON", priceInCents: 1800 },
  { id: "onion", name: "Anéis de cebola", description: "Porção de cebolas empanadas e crocantes.", category: "ADDON", priceInCents: 2000 },
  { id: "brownie", name: "Brownie de chocolate", description: "Brownie da casa com calda de chocolate.", category: "DESSERT", priceInCents: 1400 },
  { id: "ice-cream", name: "Sorvete", description: "Duas bolas de sorvete de creme.", category: "DESSERT", priceInCents: 1000 },
];

export function formatMoney(amountInCents: number) {
  return (amountInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getTabLabel(tab: MockTab) {
  if (tab.type === "table") return `Mesa ${tab.tableNumber}`;
  if (tab.customerName) return tab.customerName;
  return ORDER_TYPE_LABELS[tab.type];
}

export function formatDeliveryPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  const localNumber = digits.slice(2);
  const prefixLength = localNumber.length > 8 ? 5 : 4;
  let formatted = `(${digits.slice(0, 2)}) ${localNumber.slice(0, prefixLength)}`;
  if (localNumber.length > prefixLength) formatted += `-${localNumber.slice(prefixLength)}`;
  return formatted;
}

export function getDeliveryError(details: NewOrderDetails): string {
  if (details.type !== "delivery") return "";
  if (!details.customerName.trim()) return "Informe o nome completo do cliente.";
  const phone = (details.customerPhone ?? "").replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 11) return "Informe um telefone com DDD válido.";
  const address = details.deliveryAddress;
  if (!address || [address.street, address.number, address.neighborhood, address.city].some((field) => !field.trim())) {
    return "Preencha a rua, o número, o bairro e a cidade da entrega.";
  }
  if (!/^[A-Z]{2}$/.test(address.state)) return "Informe a UF com duas letras.";
  if (address.zipCode.replace(/\D/g, "").length !== 8) return "Informe um CEP com oito dígitos.";
  return "";
}

export function getTabItems(tab: MockTab): MockOrderItem[] {
  const items: MockOrderItem[] = [];
  for (const order of tab.orders) {
    for (const item of order.items) {
      const existing = items.find((current) => current.id === item.id && current.priceInCents === item.priceInCents);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        items.push({ ...item });
      }
    }
  }
  return items;
}

export function getTabTotals(tab: MockTab) {
  const subtotalInCents = getTabItems(tab).reduce((total, item) => total + item.priceInCents * item.quantity, 0);
  const serviceFeeInCents = tab.type === "table" ? Math.round(subtotalInCents * 0.1) : 0;
  return { subtotalInCents, serviceFeeInCents, totalInCents: subtotalInCents + serviceFeeInCents };
}

export function appendMockOrder(tab: MockTab, items: MockOrderItem[]): MockTab {
  if (tab.closedAt || items.length === 0) return tab;
  return {
    ...tab,
    orders: [...tab.orders, {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      items: items.map((item) => ({ ...item })),
    }],
  };
}

export function createMockTabs(): MockTab[] {
  const openedAt = new Date(Date.now() - 24 * 60_000).toISOString();
  const examples = [
    { number: 1, items: [[0, 1], [6, 1], [3, 2]] },
    { number: 2, items: [[1, 1], [3, 1]] },
    { number: 4, items: [[2, 2]] },
    { number: 6, items: [[1, 1], [4, 1]] },
    { number: 9, items: [[0, 1], [6, 1]] },
  ];
  return examples.map((example) => ({
    id: `demo-table-${example.number}`,
    type: "table",
    tableNumber: example.number,
    customerName: "",
    openedAt,
    notes: example.number === 1 ? "Cliente pediu os molhos à parte." : "",
    orders: example.items.map(([productIndex, quantity], index) => ({
      id: `demo-${example.number}-${index}`,
      createdAt: new Date(new Date(openedAt).getTime() + index * 5 * 60_000).toISOString(),
      items: [{ ...MOCK_PRODUCTS[productIndex], quantity }],
    })),
  }));
}
