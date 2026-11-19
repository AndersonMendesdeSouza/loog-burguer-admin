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
import { lazy, useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { OrderService } from "./service/order.service";
import type { OrderResponseDto } from "./dtos/response/orders-response.dto";
import {
  playNotificationSound,
  unlockNotificationSound,
} from "./utils/notificationSound";
import { socket } from "./service/gatway";

const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard").then((module) => ({ default: module.Dashboard })));
const Reports = lazy(() => import("./pages/Reports/Reports").then((module) => ({ default: module.Reports })));
const Tables = lazy(() => import("./pages/Tables/Tables"));

function showNewOrderAlert(newOrdersCount: number) {
  toast.success(
    newOrdersCount > 1
      ? `${newOrdersCount} novos pedidos recebidos`
      : "Novo pedido recebido",
    {
      toastId: "new-order-alert",
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      theme: "dark",
    },
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const { refreshOrderCount } = useOrderCount();
  const [ordersVersion, setOrdersVersion] = useState(0);
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
    if (!isAuthenticated || loading) {
      socket.disconnect();
      return;
    }

    let active = true;
    let initialLoadFinished = false;
    let isCheckingOrders = false;
    const knownOrderIds = new Set<string>();

    function notifyNewOrders(count: number) {
      void playNotificationSound();
      showNewOrderAlert(count);
      setOrdersVersion((version) => version + 1);
    }

    function handleNewOrder(order: OrderResponseDto) {
      if (!active || !order?.id || knownOrderIds.has(order.id)) return;

      knownOrderIds.add(order.id);
      notifyNewOrders(1);
      void refreshOrderCount();
    }

    function handleConnectionError(error: Error) {
      console.error("Erro ao conectar às notificações de pedidos:", error);
    }

    async function checkForNewOrders() {
      if (isCheckingOrders) return;
      isCheckingOrders = true;

      try {
        const orders = await OrderService.findAll();
        if (!active) return;

        let newOrdersCount = 0;
        for (const order of orders) {
          if (!knownOrderIds.has(order.id)) {
            // A primeira consulta carrega o histórico sem notificar pedidos antigos.
            if (initialLoadFinished) newOrdersCount += 1;
            knownOrderIds.add(order.id);
          }
        }

        initialLoadFinished = true;
        if (newOrdersCount > 0) notifyNewOrders(newOrdersCount);
        void refreshOrderCount();
      } catch (error) {
        if (active) console.error("Erro ao verificar novos pedidos:", error);
      } finally {
        isCheckingOrders = false;
      }
    }

    socket.on("order.created", handleNewOrder);
    socket.on("connect", checkForNewOrders);
    socket.on("connect_error", handleConnectionError);
    socket.connect();
    void checkForNewOrders();

    return () => {
      active = false;
      socket.off("order.created", handleNewOrder);
      socket.off("connect", checkForNewOrders);
      socket.off("connect_error", handleConnectionError);
      socket.disconnect();
    };
  }, [isAuthenticated, loading, refreshOrderCount]);

  if (loading) {
    return null;
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          element={
            isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pedidos" element={<Orders refreshKey={ordersVersion} />} />
          <Route path="/mesas-comandas" element={<Tables refreshKey={ordersVersion} />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/clientes" element={<Customers />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/configuracoes" element={<Config />} />
          <Route path="/product-details/:id?" element={<ProductsDetails />} />
          <Route path="/orders-details/:id" element={<OrderDetails />} />
        </Route>
      </Routes>
    </>
  );
}
