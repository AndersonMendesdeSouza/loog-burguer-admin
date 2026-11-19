import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { Orders } from "./pages/Orders/Orders";
import { Products } from "./pages/Product/Products";
import { ProductsDetails } from "./pages/Product/ProductsDetails";
import OrderDetails from "./pages/Orders/OrdersDetails";
import Login from "./pages/Login/Login";
import { Customers } from "./pages/Customers/Customers";
import { useAuth } from "./contexts/AuthContext";
import { useOrderCount } from "./contexts/OrderCountContext";
import { Config } from "./pages/Config/Config";
import { lazy, useCallback, useEffect, useState } from "react";
import { NotificationToast } from "./components/NotificationToast/NotificationToast";
import { toast, ToastContainer, type ToastContentProps, type ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { OrderService } from "./service/order.service";
import type { OrderResponseDto } from "./dtos/response/orders-response.dto";
import {
  playNotificationSound,
  unlockNotificationSound,
} from "./utils/notificationSound";
import { socket } from "./service/gatway";
import { ChatMessageSenderType } from "./dtos/enums/chat-message-sender-type.enum";
import type {
  MessageCreatedEvent,
  MessageNotification,
} from "./types/chat-notifications";

const Dashboard = lazy(() =>
  import("./pages/Dashboard/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);
const Reports = lazy(() =>
  import("./pages/Reports/Reports").then((module) => ({
    default: module.Reports,
  })),
);
const Tables = lazy(() => import("./pages/Tables/Tables"));

const MESSAGE_TOAST_ID = "new-message-alert";

const notificationToastOptions: ToastOptions = {
  position: "top-center",
  autoClose: 8000,
  hideProgressBar: true,
  closeButton: false,
  closeOnClick: false,
  pauseOnHover: true,
  icon: false,
  theme: "dark",
  style: {
    padding: 0,
    background: "transparent",
    boxShadow: "none",
    width: "100%",
  },
};

function showNewOrderAlert(order: OrderResponseDto) {
  const tableNumber = order.table?.number ?? order.mesaId;
  const isTable = order.type === "DINE_IN";
  const isPickup = order.type === "PICKUP";
  const code = `Pedido #${String(order.code).padStart(4, "0")}`;
  const tableLabel = tableNumber
    ? `Mesa ${String(tableNumber).padStart(2, "0")}`
    : "Mesa";
  let kind: "delivery" | "table" | "pickup" = "delivery";
  let title = "Novo pedido de delivery!";
  let subtitle = code;
  let description = "Um cliente acabou de realizar um pedido para entrega.";
  let href = `/orders-details/${encodeURIComponent(order.id)}`;
  let actionLabel = "Ver pedido";
  if (isTable) {
    kind = "table";
    title = "Novo pedido na mesa!";
    subtitle = `${tableLabel} · ${code}`;
    description = `${tableLabel} acabou de realizar um novo pedido.`;
    href = `/mesas-comandas?orderId=${encodeURIComponent(order.id)}`;
    actionLabel = "Ver comanda";
  } else if (isPickup) {
    kind = "pickup";
    title = "Novo pedido para retirada!";
    description = "Um cliente realizou um pedido para retirar no balcão.";
  }
  toast(
    ({ closeToast }) => (
      <NotificationToast
        kind={kind}
        title={title}
        subtitle={subtitle}
        description={description}
        href={href}
        actionLabel={actionLabel}
        onClose={closeToast}
      />
    ),
    { ...notificationToastOptions, toastId: `order-${order.id}` },
  );
}

function getNotificationStorageKey(): string | null {
  try {
    const userId = localStorage.getItem("userId");
    return userId ? `loog-burguer:message-notifications:${userId}` : null;
  } catch (error) {
    console.error("Erro ao acessar o armazenamento de notificações:", error);
    return null;
  }
}

function loadMessageNotifications(
  storageKey: string | null,
): MessageNotification[] {
  if (!storageKey) return [];

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];

    const notifications: unknown = JSON.parse(stored);
    if (!Array.isArray(notifications)) return [];

    return notifications.filter(
      (notification: unknown): notification is MessageNotification => {
        if (typeof notification !== "object" || notification === null) {
          return false;
        }

        return (
          "id" in notification &&
          typeof notification.id === "string" &&
          "orderId" in notification &&
          typeof notification.orderId === "string" &&
          "text" in notification &&
          typeof notification.text === "string" &&
          "createdAt" in notification &&
          typeof notification.createdAt === "string" &&
          !Number.isNaN(Date.parse(notification.createdAt)) &&
          "read" in notification &&
          typeof notification.read === "boolean" &&
          (!("customerName" in notification) ||
            typeof notification.customerName === "string")
        );
      },
    );
  } catch (error) {
    console.error("Erro ao carregar notificações salvas:", error);
    return [];
  }
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const { refreshOrderCount } = useOrderCount();
  const notificationStorageKey =
    isAuthenticated && !loading ? getNotificationStorageKey() : null;
  const [ordersVersion, setOrdersVersion] = useState(0);
  const [messageVersions, setMessageVersions] = useState<
    Record<string, number>
  >({});
  const [connectionVersion, setConnectionVersion] = useState(0);
  const [notificationStore, setNotificationStore] = useState(() => {
    const storageKey = getNotificationStorageKey();
    return { storageKey, items: loadMessageNotifications(storageKey) };
  });
  const messageNotifications =
    notificationStore.storageKey === notificationStorageKey
      ? notificationStore.items
      : [];

  useEffect(() => {
    if (
      !isAuthenticated ||
      loading ||
      notificationStore.storageKey === notificationStorageKey
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotificationStore({
        storageKey: notificationStorageKey,
        items: loadMessageNotifications(notificationStorageKey),
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    isAuthenticated,
    loading,
    notificationStorageKey,
    notificationStore.storageKey,
  ]);

  useEffect(() => {
    if (
      !notificationStorageKey ||
      notificationStore.storageKey !== notificationStorageKey
    ) {
      return;
    }

    try {
      if (notificationStore.items.length === 0) {
        localStorage.removeItem(notificationStorageKey);
      } else {
        localStorage.setItem(
          notificationStorageKey,
          JSON.stringify(notificationStore.items),
        );
      }
    } catch (error) {
      console.error("Erro ao salvar notificações:", error);
    }
  }, [notificationStorageKey, notificationStore]);

  const clearMessageNotifications = useCallback(() => {
    setNotificationStore((current) => ({ ...current, items: [] }));
  }, []);

  const markMessagesRead = useCallback(
    (orderId: string, messageIds: string[]) => {
      const loadedIds = new Set(messageIds);
      setNotificationStore((current) => {
        const hasUnread = current.items.some(
          (notification) =>
            notification.orderId === orderId &&
            !notification.read &&
            loadedIds.has(notification.id),
        );
        if (!hasUnread) return current;
        return {
          ...current,
          items: current.items.map((notification) =>
            notification.orderId === orderId && loadedIds.has(notification.id)
              ? { ...notification, read: true }
              : notification,
          ),
        };
      });
    },
    [],
  );
  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const unlockSound = () => {
      void unlockNotificationSound();
    };

    window.addEventListener("pointerdown", unlockSound, { once: true });
    window.addEventListener("keydown", unlockSound, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockSound);
      window.removeEventListener("keydown", unlockSound);
    };
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      loading ||
      notificationStore.storageKey !== notificationStorageKey
    ) {
      socket.disconnect();
      return;
    }

    let active = true;
    let initialLoadFinished = false;
    let isCheckingOrders = false;
    let latestMessageToastSequence = 0;
    const knownOrderIds = new Set<string>();
    const knownMessageIds = new Set(
      loadMessageNotifications(notificationStorageKey).map((message) => message.id),
    );

    function notifyNewOrders(orders: OrderResponseDto[]) {
      void playNotificationSound();
      orders.forEach(showNewOrderAlert);
      setOrdersVersion((version) => version + 1);
    }

    function handleNewOrder(order: OrderResponseDto) {
      if (!active || !order?.id || knownOrderIds.has(order.id)) return;

      knownOrderIds.add(order.id);
      notifyNewOrders([order]);
      void refreshOrderCount();
    }

    function handleConnectionError(error: Error) {
      console.error("Erro ao conectar às notificações de pedidos:", error);
    }

    async function handleNewMessage(event: MessageCreatedEvent) {
      if (!active || !event?.orderId || !event.message?.id) return;
      const message = event.message;
      if (knownMessageIds.has(message.id)) return;
      knownMessageIds.add(message.id);

      setMessageVersions((current) => ({
        ...current,
        [event.orderId]: (current[event.orderId] ?? 0) + 1,
      }));
      if (message.senderType !== ChatMessageSenderType.CUSTOMER) return;
      void playNotificationSound();
      const messageToastSequence = ++latestMessageToastSequence;

      let customerName = event.customerName?.trim();
      let orderType = event.orderType;
      let mesaId = event.mesaId;

      if (!customerName) {
        try {
          const order = await OrderService.findById(event.orderId);
          customerName = order.customerName?.trim();
          orderType = order.type;
          mesaId = order.mesaId;
        } catch (error) {
          console.error("Erro ao buscar o cliente da mensagem:", error);
        }
      }

      if (!active) return;

      setNotificationStore((current) => ({
        storageKey: notificationStorageKey,
        items: [
          {
            id: message.id,
            orderId: event.orderId,
            customerName,
            text: message.text,
            createdAt: message.createdAt,
            read: false,
          },
          ...current.items,
        ],
      }));

      if (messageToastSequence !== latestMessageToastSequence) return;

      const time = new Date(message.createdAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit", minute: "2-digit",
      });
      let sender = customerName || "Cliente";
      if (!customerName && orderType === "DINE_IN" && mesaId) {
        sender = `Mesa ${mesaId.padStart(2, "0")}`;
      }
      const renderMessage = ({ closeToast }: ToastContentProps) => (
        <NotificationToast
          kind="message" title="Nova mensagem recebida!"
          subtitle={`${sender} · ${time}`} description={message.text}
          href={`/orders-details/${encodeURIComponent(event.orderId)}#order-chat`}
          actionLabel="Ver conversa" onClose={closeToast}
        />
      );
      const messageToastOptions: ToastOptions = {
        ...notificationToastOptions,
        toastId: MESSAGE_TOAST_ID,
        autoClose: 5000,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
      };

      if (toast.isActive(MESSAGE_TOAST_ID)) {
        toast.update(MESSAGE_TOAST_ID, {
          ...messageToastOptions,
          render: renderMessage,
        });
      } else {
        toast(renderMessage, messageToastOptions);
      }
    }

    function handleConnect() {
      setConnectionVersion((version) => version + 1);
      void checkForNewOrders();
    }

    async function checkForNewOrders() {
      if (isCheckingOrders) return;
      isCheckingOrders = true;

      try {
        const orders = await OrderService.findAll();
        if (!active) return;

        const newOrders: OrderResponseDto[] = [];
        for (const order of orders) {
          if (!knownOrderIds.has(order.id)) {
            // A primeira consulta carrega o histórico sem notificar pedidos antigos.
            if (initialLoadFinished) newOrders.push(order);
            knownOrderIds.add(order.id);
          }
        }

        initialLoadFinished = true;
        if (newOrders.length > 0) notifyNewOrders(newOrders);
        void refreshOrderCount();
      } catch (error) {
        if (active) console.error("Erro ao verificar novos pedidos:", error);
      } finally {
        isCheckingOrders = false;
      }
    }

    socket.on("order.created", handleNewOrder);
    socket.on("message.created", handleNewMessage);
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectionError);
    socket.connect();
    void checkForNewOrders();

    return () => {
      active = false;
      socket.off("order.created", handleNewOrder);
      socket.off("message.created", handleNewMessage);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectionError);
      socket.disconnect();
      toast.dismiss(MESSAGE_TOAST_ID);
      setMessageVersions({});
    };
  }, [
    isAuthenticated,
    loading,
    refreshOrderCount,
    notificationStorageKey,
    notificationStore.storageKey,
  ]);

  if (loading) {
    return null;
  }

  return (
    <>
      <ToastContainer style={{ width: "min(420px, calc(100vw - 24px))" }} />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          element={
            isAuthenticated ? (
              <DashboardLayout
                messageNotifications={messageNotifications}
                onClearNotifications={clearMessageNotifications}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route
            path="/dashboard"
            element={<Dashboard refreshKey={ordersVersion} />}
          />
          <Route
            path="/pedidos"
            element={<Orders refreshKey={ordersVersion} />}
          />
          <Route
            path="/mesas-comandas"
            element={<Tables refreshKey={ordersVersion} />}
          />
          <Route path="/produtos" element={<Products />} />
          <Route path="/clientes" element={<Customers />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/configuracoes" element={<Config />} />
          <Route path="/product-details/:id?" element={<ProductsDetails />} />
          <Route
            path="/orders-details/:id"
            element={
              <OrderDetails
                messageVersions={messageVersions}
                connectionVersion={connectionVersion}
                onMessagesRead={markMessagesRead}
              />
            }
          />
        </Route>
      </Routes>
    </>
  );
}
