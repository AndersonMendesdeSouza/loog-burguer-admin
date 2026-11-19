import {
  ArrowRight,
  Bike,
  CircleX,
  MessageSquare,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./NotificationToast.module.css";

type NotificationToastProps = {
  kind: "delivery" | "table" | "pickup" | "message" | "canceled";
  title: string;
  subtitle: string;
  description: string;
  href: string;
  actionLabel: string;
  onClose: () => void;
};

export function NotificationToast({
  kind,
  title,
  subtitle,
  description,
  href,
  actionLabel,
  onClose,
}: NotificationToastProps) {
  const icons = {
    delivery: Bike,
    table: UtensilsCrossed,
    pickup: ShoppingBag,
    message: MessageSquare,
    canceled: CircleX,
  };
  const Icon = icons[kind];

  return (
    <article className={styles.notification}>
      <div className={styles.heading}>
        <span className={styles.icon}>
          <Icon size={23} aria-hidden="true" />
        </span>
        <div className={styles.identity}>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Fechar notificação"
        >
          <X size={19} />
        </button>
      </div>
      <p className={kind === "message" ? styles.preview : styles.description}>
        {description}
      </p>
      <Link to={href} className={styles.action} onClick={onClose}>
        {actionLabel}
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </article>
  );
}
