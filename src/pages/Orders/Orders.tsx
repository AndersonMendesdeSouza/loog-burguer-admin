import { getOrderStatus, isTableOrder } from "../../utils/orderStatus";
import { OrderStatusEnum } from "../../dtos/enums/orders-status.enum";
import type { OrderResponseDto } from "../../dtos/response/orders-response.dto";
import type { OrderType } from "../../dtos/enums/order-type.enum";
import { OrderCard } from "../../components/OrderCard";
import { useEffect, useRef, useState } from "react";
import { OrderService } from "../../service/order.service";
import { formatOrderCode } from "../../utils/formatOrderCode";
import { useOrderCount } from "../../contexts/OrderCountContext";
import {
  CheckCircle2,
  ChefHat,
  ShoppingCart,
  Truck,
  UtensilsCrossed,
  ShoppingBag,
  XCircle,
  Zap,
} from "lucide-react";
import styles from "./Orders.module.css";

type OrdersProps = {
  refreshKey: number;
};

type BoardOrder = {
  id: string;
  mesaId?: string | null;
  type?: OrderType;
  number: string;
  customerName: string;
  minutes: number;
  total: number;
  status: OrderStatusEnum;
  requestStatus: OrderStatusEnum;
  items: { name: string; quantity: number }[];
};

type StageFilter = "active" | "finished" | "canceled";
type TypeFilter = "all" | "DELIVERY" | "DINE_IN" | "PICKUP";
type ColumnTone = "yellow" | "blue" | "orange" | "green" | "purple" | "red";

const ACTIVE_COLUMNS: {
  title: string;
  status: OrderStatusEnum;
  tone: ColumnTone;
}[] = [
  { title: "Novos", status: OrderStatusEnum.RECEIVED, tone: "yellow" },
  { title: "Em preparo", status: OrderStatusEnum.PREPARING, tone: "blue" },
  { title: "Prontos", status: OrderStatusEnum.READY, tone: "green" },
  { title: "Em rota", status: OrderStatusEnum.ON_ROUTE, tone: "orange" },
];
const STAGES = [
  { key: "active", label: "Em andamento", icon: Zap },
  { key: "finished", label: "Entregues", icon: CheckCircle2 },
  { key: "canceled", label: "Cancelados", icon: XCircle },
] as const;
const TYPES = [
  { key: "all", label: "Todos", icon: null },
  { key: "DELIVERY", label: "Delivery", icon: Truck },
  { key: "DINE_IN", label: "Mesa", icon: UtensilsCrossed },
  { key: "PICKUP", label: "Retirada", icon: ShoppingBag },
] as const;

function getMinutesAgo(createdAt: Date | string) {
  const createdAtTime = new Date(createdAt).getTime();
  const diff = Date.now() - createdAtTime;

  if (Number.isNaN(createdAtTime) || diff < 0) {
    return 0;
  }

  return Math.floor(diff / 60000);
}

function mapOrderToBoardOrder(order: OrderResponseDto): BoardOrder {
  return {
    id: order.id,
    mesaId:
      order.mesaId || (order.table?.number ? String(order.table.number) : null),
    type: isTableOrder(order) ? "DINE_IN" : order.type,
    number: formatOrderCode(order.code),
    customerName: order.customerName,
    minutes: getMinutesAgo(order.createdAt),
    total: Number(order.total),
    status: getOrderStatus(order),
    requestStatus: order.status,
    items: (order.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
    })),
  };
}

export function Orders({ refreshKey }: OrdersProps) {
  const [orders, setOrders] = useState<BoardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [stage, setStage] = useState<StageFilter>("active");
  const [type, setType] = useState<TypeFilter>("all");
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const pendingUpdates = useRef(new Set<string>());
  const { refreshOrderCount } = useOrderCount();
  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const data = await OrderService.findAll();
        if (!active) return;

        const sortedOrders = [...data].sort((first, second) => {
          const firstDate = new Date(first.createdAt).getTime() || 0;
          const secondDate = new Date(second.createdAt).getTime() || 0;
          return secondDate - firstDate || second.code - first.code;
        });
        setOrders(sortedOrders.map(mapOrderToBoardOrder));
        setLoadError(null);
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        if (active)
          setLoadError(
            "Não foi possível atualizar os pedidos. Tentaremos novamente em instantes.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOrders();
    const intervalId = window.setInterval(loadOrders, 10000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [refreshKey]);

  async function alterStatus(
    id: string,
    status: OrderStatusEnum,
  ): Promise<void> {
    if (pendingUpdates.current.has(id)) return;
    pendingUpdates.current.add(id);
    setUpdatingIds((current) => [...current, id]);
    setActionError("");
    try {
      const updatedOrder = await OrderService.alterStatus(id, status);
      const boardOrder = mapOrderToBoardOrder(updatedOrder);
      setOrders((current) =>
        current.map((order) => (order.id === id ? boardOrder : order)),
      );
      void refreshOrderCount();
    } catch {
      setActionError(
        "Não foi possível atualizar o pedido. Confira a atualização automática e tente novamente.",
      );
    } finally {
      pendingUpdates.current.delete(id);
      setUpdatingIds((current) => current.filter((orderId) => orderId !== id));
    }
  }

  const typeOrders = orders.filter((order) => {
    if (type === "all") return true;
    return order.type === type;
  });
  const summary = [
    {
      label: "Novos",
      count: typeOrders.filter(
        (order) => order.status === OrderStatusEnum.RECEIVED,
      ).length,
      tone: "yellow",
      icon: ShoppingCart,
    },
    {
      label: "Em preparo",
      count: typeOrders.filter(
        (order) => order.status === OrderStatusEnum.PREPARING,
      ).length,
      tone: "blue",
      icon: ChefHat,
    },
    {
      label: "Prontos",
      count: typeOrders.filter(
        (order) => order.status === OrderStatusEnum.READY,
      ).length,
      tone: "green",
      icon: CheckCircle2,
    },
    {
      label: "Em rota",
      count: typeOrders.filter(
        (order) => order.status === OrderStatusEnum.ON_ROUTE,
      ).length,
      tone: "orange",
      icon: Truck,
    },
    {
      label: "Entregues",
      count: typeOrders.filter(
        (order) => order.status === OrderStatusEnum.DELIVERED,
      ).length,
      tone: "purple",
      icon: CheckCircle2,
    },
  ];
  let stageOrders = typeOrders.filter(
    (order) => order.status === OrderStatusEnum.DELIVERED,
  );
  let stageTitle = "Pedidos entregues";
  let stageTone: ColumnTone = "purple";
  if (stage === "canceled") {
    stageOrders = typeOrders.filter(
      (order) => order.status === OrderStatusEnum.CANCELED,
    );
    stageTitle = "Pedidos cancelados";
    stageTone = "red";
  }

  function renderOrder(order: BoardOrder, tone: ColumnTone) {
    return (
      <div
        key={order.id}
        className={`${styles.cardWrapper} ${styles[`cardWrapper_${tone}`]}`}
      >
        <OrderCard
          navigateTo={`/orders-details/${order.id}`}
          mesaId={order.mesaId}
          orderType={order.type}
          status={order.status}
          orderNumber={order.number}
          customerName={order.customerName}
          minutesAgo={order.minutes}
          items={order.items}
          total={order.total}
          isUpdating={updatingIds.includes(order.id)}
          onAccept={() => void alterStatus(order.id, order.requestStatus)}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.summaryCards} aria-label="Resumo dos pedidos">
        {summary.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className={`${styles.metric} ${styles[`metric_${metric.tone}`]}`}
              aria-label={`${metric.label}: ${metric.count}`}
            >
              <span className={styles.metricIcon}>
                <Icon size={23} aria-hidden="true" />
              </span>
              <div>
                <strong>{loading ? "—" : metric.count}</strong>
                <span>{metric.label}</span>
              </div>
            </article>
          );
        })}
      </div>
      <div className={styles.toolbar}>
        <div
          className={styles.stageTabs}
          role="tablist"
          aria-label="Etapa dos pedidos"
        >
          {STAGES.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                id={`orders-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={stage === tab.key}
                aria-controls="orders-view"
                className={
                  stage === tab.key ? styles.stageActive : styles.stageButton
                }
                onClick={() => setStage(tab.key)}
              >
                <Icon size={16} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div
          className={styles.typeFilters}
          role="group"
          aria-label="Tipo do pedido"
        >
          {TYPES.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={type === filter.key}
                className={
                  type === filter.key ? styles.typeActive : styles.typeButton
                }
                onClick={() => setType(filter.key)}
              >
                {Icon && <Icon size={15} aria-hidden="true" />}
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
      {(loadError || actionError) && (
        <p className={styles.alert} role="alert">
          {actionError || loadError}
        </p>
      )}
      <div
        id="orders-view"
        role="tabpanel"
        aria-labelledby={`orders-tab-${stage}`}
        className={stage === "active" ? styles.board : styles.results}
        key={`${stage}-${type}`}
      >
        {stage === "active" ? (
          ACTIVE_COLUMNS.map((column) => {
            const columnOrders = typeOrders.filter(
              (order) => order.status === column.status,
            );
            return (
              <section
                key={column.status}
                className={styles.column}
                aria-label={column.title}
              >
                <header className={styles.columnHeader}>
                  <h2>
                    <span
                      className={`${styles.dot} ${styles[`dot_${column.tone}`]}`}
                    />
                    {column.title}
                  </h2>
                  <span
                    className={`${styles.count} ${styles[`count_${column.tone}`]}`}
                  >
                    {columnOrders.length}
                  </span>
                </header>
                <div className={styles.list}>
                  {columnOrders.length === 0 && (
                    <p className={styles.empty}>
                      {loading
                        ? "Carregando pedidos..."
                        : "Nenhum pedido por aqui."}
                    </p>
                  )}
                  {columnOrders.map((order) => renderOrder(order, column.tone))}
                </div>
              </section>
            );
          })
        ) : (
          <>
            <div className={styles.resultsHeader}>
              <h2>{stageTitle}</h2>
              <span>
                {stageOrders.length}{" "}
                {stageOrders.length === 1 ? "pedido" : "pedidos"}
              </span>
            </div>
            {stageOrders.length === 0 && (
              <p className={styles.empty}>
                {loading ? "Carregando pedidos..." : "Nenhum pedido por aqui."}
              </p>
            )}
            <div className={styles.resultsGrid}>
              {stageOrders.map((order) => renderOrder(order, stageTone))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
