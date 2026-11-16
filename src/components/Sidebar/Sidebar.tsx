import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiGrid,
  FiShoppingCart,
  FiBox,
  FiUsers,
  FiSettings,
} from "react-icons/fi";
import styles from "./Sidebar.module.css";
import { FileBarChart2Icon, Hamburger } from "lucide-react";
import { IoExitOutline } from "react-icons/io5";
import { useAuth } from "../../contexts/AuthContext";
import { useOrderCount } from "../../contexts/OrderCountContext";
import { UserService } from "../../service/user.service";
import type { UserResponseDto } from "../../dtos/response/user-response.dto";

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || "AD";
}

export function Sidebar() {
  const { logout } = useAuth();
  const { newOrders } = useOrderCount();
  const [adminUser, setAdminUser] = useState<UserResponseDto | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    async function loadAdminUser() {
      try {
        const authenticatedUser = await UserService.me();
        const user = await UserService.findOne(authenticatedUser.id);

        if (active) {
          setAdminUser(user);
        }
      } catch {
        if (active) {
          setAdminUser(null);
        }
      }
    }

    function handleAdminProfileUpdated(event: Event) {
      const updatedUser = (event as CustomEvent<UserResponseDto>).detail;

      if (updatedUser) {
        setAdminUser(updatedUser);
      }
    }

    void loadAdminUser();
    window.addEventListener("admin-profile:updated", handleAdminProfileUpdated);

    return () => {
      active = false;
      window.removeEventListener(
        "admin-profile:updated",
        handleAdminProfileUpdated,
      );
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.brand}>
          <Hamburger className={styles.brandIcon} aria-hidden="true" />
          <div>
            <strong className={styles.brandTitle}>Burguer</strong>
            <span className={styles.brandSubtitle}>Administração</span>
          </div>
        </div>

        <nav className={styles.menu} aria-label="Navegação administrativa">
          <NavLink
            to="/dashboard"
            title="Painel"
            className={({ isActive }) =>
              isActive ? styles.active : styles.link
            }
          >
            <FiGrid className={styles.icon} />
            <span>Painel</span>
          </NavLink>

          <NavLink
            to="/pedidos"
            title="Pedidos"
            className={({ isActive }) =>
              isActive || location.pathname.startsWith("/orders-details") ? styles.active : styles.link
            }
          >
            <FiShoppingCart className={styles.icon} />
            <span>Pedidos</span>
            <span className={styles.badge}>{newOrders}</span>
          </NavLink>

          <NavLink
            to="/produtos"
            title="Produtos"
            className={({ isActive }) =>
              isActive || location.pathname.startsWith("/product-details") ? styles.active : styles.link
            }
          >
            <FiBox className={styles.icon} />
            <span>Produtos</span>
          </NavLink>

          <NavLink
            to="/clientes"
            title="Clientes"
            className={({ isActive }) =>
              isActive ? styles.active : styles.link
            }
          >
            <FiUsers className={styles.icon} />
            <span>Clientes</span>
          </NavLink>

          <NavLink
            to="/relatorios"
            title="Relatórios"
            className={({ isActive }) =>
              isActive ? styles.active : styles.link
            }
          >
            <FileBarChart2Icon className={styles.icon} />
            <span>Relatórios</span>
          </NavLink>
        </nav>
      </div>
      <div className={styles.footer}>
        <NavLink
          to="/configuracoes"
          title="Configurações"
          className={({ isActive }) => (isActive ? styles.active : styles.link)}
        >
          <FiSettings className={styles.icon} />
          <span>Configurações</span>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className={styles.linkButton}
          title="Sair da conta"
        >
          <IoExitOutline className={styles.icon} />
          <span>Sair</span>
        </button>

        <div className={styles.user}>
          <div className={styles.avatar}>
            {getInitials(adminUser?.name ?? "Administrador")}
          </div>
          <div>
            <strong>{adminUser?.name ?? "Administrador"}</strong>
            <span>{adminUser?.role === "admin" ? "Administrador" : "Usuário"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
