import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Header.module.css";
import { FiArrowRight, FiBell, FiMessageSquare, FiX } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { SystemSettingsService } from "../../service/system-settings.service";
import type { SystemSettingsResponse } from "../../dtos/response/system-settings-response.dto";
import type { MessageNotification } from "../../types/chat-notifications";

type HeaderProps = {
  title: string;
  messageNotifications: MessageNotification[];
  onClearNotifications: () => void;
};

const STATUS_REFRESH_INTERVAL_MS = 60_000;

export function Header({
  title,
  messageNotifications,
  onClearNotifications,
}: HeaderProps) {
  const location = useLocation();
  const [settings, setSettings] = useState<SystemSettingsResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const unreadCount = messageNotifications.filter(
    (message) => !message.read,
  ).length;

  useEffect(() => {
    if (!notificationsOpen) return;

    function handleOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !notificationRef.current?.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        notificationButtonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notificationsOpen]);

  const statusText = useMemo(() => {
    if (loadingStatus && !settings) return "CARREGANDO";
    if (statusError && !settings) return "INDISPONÍVEL";
    return settings?.available ? "ABERTA" : "FECHADA";
  }, [loadingStatus, settings, statusError]);

  const statusClassName = useMemo(() => {
    if (statusError && !settings) {
      return `${styles.badge} ${styles.badgeUnavailable}`;
    }

    if (loadingStatus && !settings) {
      return `${styles.badge} ${styles.badgeLoading}`;
    }

    if (!settings?.available) {
      return `${styles.badge} ${styles.badgeClosed}`;
    }

    return styles.badge;
  }, [loadingStatus, settings, statusError]);

  useEffect(() => {
    let active = true;

    async function loadStoreStatus() {
      try {
        const data = await SystemSettingsService.findSettings();

        if (!active) return;

        setSettings(data);
        setStatusError(false);
      } catch {
        if (!active) return;

        setStatusError(true);
      } finally {
        if (active) {
          setLoadingStatus(false);
        }
      }
    }

    function handleSettingsUpdated(event: Event) {
      const updatedSettings = (event as CustomEvent<SystemSettingsResponse>)
        .detail;

      if (updatedSettings) {
        setSettings(updatedSettings);
        setStatusError(false);
        setLoadingStatus(false);
        return;
      }

      void loadStoreStatus();
    }

    void loadStoreStatus();

    const refreshInterval = window.setInterval(
      loadStoreStatus,
      STATUS_REFRESH_INTERVAL_MS,
    );

    window.addEventListener("focus", loadStoreStatus);
    window.addEventListener("system-settings:updated", handleSettingsUpdated);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", loadStoreStatus);
      window.removeEventListener(
        "system-settings:updated",
        handleSettingsUpdated,
      );
    };
  }, []);

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.right}>
        <div className={styles.notificationArea} ref={notificationRef}>
          <button
            ref={notificationButtonRef}
            type="button"
            className={styles.notification}
            aria-label={`Mensagens: ${unreadCount} não lidas`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            aria-controls="message-notifications"
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <FiBell aria-hidden="true" />
            {unreadCount > 0 && (
              <span key={unreadCount} className={styles.notificationCount}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <section
              id="message-notifications"
              className={styles.notificationPanel}
              role="dialog"
              aria-label="Notificações de mensagens"
            >
              <div className={styles.notificationHeader}>
                <div>
                  <strong>Mensagens</strong>
                  <span>{unreadCount} não lidas</span>
                </div>
                <div className={styles.notificationActions}>
                  <button
                    type="button"
                    className={styles.clearNotifications}
                    onClick={onClearNotifications}
                    disabled={messageNotifications.length === 0}
                  >
                    Apagar todas
                  </button>
                  <button
                    type="button"
                    className={styles.closeNotifications}
                    aria-label="Fechar notificações"
                    onClick={() => {
                      setNotificationsOpen(false);
                      notificationButtonRef.current?.focus();
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              </div>
              {messageNotifications.length === 0 ? (
                <p className={styles.notificationEmpty}>
                  <FiMessageSquare size={22} />
                  Nenhuma mensagem recebida.
                </p>
              ) : (
                <ul className={styles.notificationList}>
                  {messageNotifications.map((message) => (
                    <li
                      key={message.id}
                      className={
                        message.read ? styles.messageRead : styles.messageUnread
                      }
                    >
                      <div className={styles.messageHeading}>
                        <strong>
                          {message.customerName?.trim() ||
                            (message.read
                              ? "Mensagem do cliente"
                              : "Nova mensagem")}
                        </strong>
                        <time dateTime={message.createdAt}>
                          {new Date(message.createdAt).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </time>
                      </div>
                      <p>{message.text}</p>
                      <Link
                        to={`/orders-details/${encodeURIComponent(message.orderId)}#order-chat`}
                        className={styles.openConversation}
                        onClick={() => {
                          setNotificationsOpen(false);
                          if (
                            location.pathname ===
                            `/orders-details/${message.orderId}`
                          ) {
                            document
                              .getElementById("order-chat")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }
                        }}
                      >
                        Abrir conversa <FiArrowRight aria-hidden="true" />
                      </Link>
                      {message.read && (
                        <span className={styles.readLabel}>Lida</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <div className={styles.status}>
          <span>Status da Loja:</span>
          <span className={statusClassName}>{statusText}</span>
        </div>
      </div>
    </header>
  );
}
