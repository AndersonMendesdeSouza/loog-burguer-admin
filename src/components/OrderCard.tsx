import { useNavigate } from "react-router-dom";
import {
  Check,
  ChefHat,
  ChevronRight,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { OrderStatusEnum } from "../dtos/enums/orders-status.enum";
import type { OrderType } from "../dtos/enums/order-type.enum";
import styles from "./OrderCard.module.css";

type Props = {
  orderNumber: string;
  mesaId?: string | null;
  orderType?: OrderType;
  customerName: string;
  minutesAgo: number;
  items: { name: string; quantity: number }[];
  total: number;
  onAccept?: () => void;
  status: OrderStatusEnum;
  navigateTo: string;
  isUpdating?: boolean;
};

export function OrderCard({
  orderNumber,
  mesaId,
  orderType,
  customerName,
  minutesAgo,
  items,
  total,
  onAccept,
  status,
  navigateTo,
  isUpdating = false,
}: Props) {
  const navigate = useNavigate();
  const tableNumber = mesaId?.trim();
  const tableOrder = orderType === "DINE_IN" || Boolean(tableNumber);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const price = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  let timeLabel = `Há ${minutesAgo} min`;
  if (minutesAgo < 1) timeLabel = "Agora";
  else if (minutesAgo >= 24 * 60) {
    const days = Math.floor(minutesAgo / (24 * 60));
    timeLabel = `Há ${days} ${days === 1 ? "dia" : "dias"}`;
  } else if (minutesAgo >= 60)
    timeLabel = `Há ${Math.floor(minutesAgo / 60)} h`;

  let actionLabel = "";
  let buttonClass = "";
  if (status === OrderStatusEnum.RECEIVED) {
    actionLabel = "Aceitar";
    buttonClass = styles.buttonReceived;
  } else if (status === OrderStatusEnum.PREPARING) {
    actionLabel =
      tableOrder || orderType === "PICKUP"
        ? "Marcar como pronto"
        : "Finalizar preparo";
    buttonClass = styles.buttonPreparing;
  } else if (status === OrderStatusEnum.ON_ROUTE) {
    actionLabel = "Concluir";
    buttonClass = styles.buttonOnRoute;
  } else if (
    status === OrderStatusEnum.READY &&
    (tableOrder || orderType === "PICKUP")
  ) {
    actionLabel =
      orderType === "PICKUP" ? "Confirmar retirada" : "Confirmar entrega";
    buttonClass = styles.buttonReady;
  }
  let TypeIcon = Truck;
  let typeLabel = "Delivery";
  if (tableOrder) {
    TypeIcon = UtensilsCrossed;
    typeLabel = tableNumber ? `Mesa ${tableNumber}` : "Mesa";
  } else if (orderType === "PICKUP") {
    TypeIcon = ShoppingBag;
    typeLabel = "Retirada";
  }

  return (
    <article className={styles.card} onClick={() => navigate(navigateTo)}>
      <header className={styles.header}>
        <button
          className={styles.orderNumber}
          type="button"
          aria-label={`Ver pedido ${orderNumber}`}
          onClick={(event) => {
            event.stopPropagation();
            navigate(navigateTo);
          }}
        >
          {orderNumber}
        </button>
        <span className={styles.time}>{timeLabel}</span>
      </header>
      <span className={styles.typeBadge}>
        <TypeIcon size={14} aria-hidden="true" />
        {typeLabel}
      </span>
      <h3 className={styles.customerName} title={customerName}>
        {customerName || "Cliente"}
      </h3>
      <div className={styles.summary}>
        <span>
          {itemCount} {itemCount === 1 ? "item" : "itens"}
        </span>
        <span aria-hidden="true">•</span>
        <strong>{price}</strong>
      </div>
      {items.length > 0 && (
        <div className={styles.itemPreview}>
          <ChefHat size={15} aria-hidden="true" />
          <span title={`${items[0].quantity}x ${items[0].name}`}>
            {items[0].quantity}x {items[0].name}
          </span>
          {items.length > 1 && <small>+{items.length - 1}</small>}
        </div>
      )}
      {actionLabel && onAccept && (
        <button
          type="button"
          className={`${styles.actionButton} ${buttonClass}`}
          disabled={isUpdating}
          aria-busy={isUpdating}
          onClick={(event) => {
            event.stopPropagation();
            onAccept();
          }}
        >
          <Check size={17} aria-hidden="true" />
          {isUpdating ? "Atualizando..." : actionLabel}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </article>
  );
}
