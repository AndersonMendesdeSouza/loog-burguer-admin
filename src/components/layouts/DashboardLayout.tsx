import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../Sidebar/Sidebar";
import { Header } from "../Header/Header";
import styles from "./DashboardLayout.module.css";
import { Suspense } from "react";

function getHeaderTitle(pathname: string) {
  if (pathname.startsWith("/pedidos")) return "Pedidos";
  if (pathname.startsWith("/mesas-comandas")) return "Mesas e Comandas";
  if (pathname.startsWith("/produtos")) return "Produtos";
  if (pathname.startsWith("/clientes")) return "Clientes";
  if (pathname.startsWith("/relatorios")) return "Relatórios";
  if (pathname.startsWith("/configuracoes")) return "Configurações";
  if (pathname === "/product-details") return "Criar produto";
  if (pathname.startsWith("/product-details")) return "Editar produto";
  if (pathname.startsWith("/orders-details")) return "Detalhes do pedido";

  return "Painel";
}

export function DashboardLayout() {
  const location = useLocation();

  return (
    <div className={styles.container}>
      <Sidebar />

      <div className={styles.main}>
        <Header title={getHeaderTitle(location.pathname)} />
        <main key={location.pathname} className={styles.content} data-enter="page">
          <Suspense fallback={<div className={styles.loading} role="status">Carregando tela...</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
