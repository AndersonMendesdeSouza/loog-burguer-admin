import { useNavigate } from "react-router-dom";
import styles from "./ProductCard.module.css";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useState } from "react";
import { ProductCategoryEnum } from "../dtos/enums/product-category.enum";
import type { ImageResponse } from "../dtos/response/image-response.dto";
import { ProductStatusEnum } from "../dtos/enums/product-status.enum";
import { ProductService } from "../service/product.service";
import { API_BASE_URL } from "../service/api";
import { toast } from "react-toastify";

type Props = {
  id: string;
  name: string;
  description: string | undefined;
  category: ProductCategoryEnum;
  price: string;
  imageUrl: ImageResponse[];
  stock: number | undefined;
  stockEnabled: boolean;
  available: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleAvailable?: (id: string) => void;
  navigateTo: string;
  isActive: ProductStatusEnum;
};

function currencyBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProductCard({
  id,
  name,
  description,
  category,
  price,
  imageUrl,
  onDelete,
  isActive,
}: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ProductStatusEnum>(isActive);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const primaryImage = imageUrl.find((image) => image.isPrimary) || imageUrl[0];
  const categoryLabels: Record<ProductCategoryEnum, string> = {
    [ProductCategoryEnum.FOOD]: "Comidas",
    [ProductCategoryEnum.DRINK]: "Bebidas",
    [ProductCategoryEnum.ADDON]: "Acompanhamentos",
    [ProductCategoryEnum.DESSERT]: "Sobremesas",
  };

  async function alterationStatus(): Promise<void> {
    if (updatingStatus) return;
    const newStatus =
      status === ProductStatusEnum.ACTIVED
        ? ProductStatusEnum.DISABLED
        : ProductStatusEnum.ACTIVED;

    setUpdatingStatus(true);
    try {
      await ProductService.actived(id, newStatus);
      setStatus(newStatus);
    } catch {
      toast.error("Não foi possível alterar a disponibilidade do produto.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  function resolveImageUrl(url?: string) {
    if (!url) return "/product-placeholder.svg";
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
  }

  return (
    <div className={styles.card}>
      <div className={styles.media}>
        <img
          className={`${styles.image} ${
            status === ProductStatusEnum.DISABLED ? styles.imageDim : ""
          }`}
          src={resolveImageUrl(primaryImage?.imageUrl || primaryImage?.url)}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/product-placeholder.svg";
          }}
        />

        <div className={styles.cardActions}>
          <button
            className={styles.iconBtn}
            type="button"
            aria-label="Editar"
            onClick={() => navigate(`/product-details/${id}`)}
          >
            <FiEdit2 />
          </button>
          <button
            className={styles.iconBtn}
            type="button"
            aria-label="Excluir"
            onClick={() => onDelete?.(id)}
          >
            <FiTrash2 />
          </button>
        </div>

        {status === ProductStatusEnum.DISABLED ? (
          <div className={styles.outOfStock}>INDISPONÍVEL</div>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.category}>{categoryLabels[category] || category}</div>
        <div className={styles.name}>{name}</div>
        <div className={styles.desc}>{description}</div>

        <div className={styles.footer}>
          <div className={styles.price}>{currencyBRL(Number(price))}</div>

          <div className={styles.availability}>
            <button
              type="button"
              className={`${styles.pill} ${status === ProductStatusEnum.ACTIVED ? styles.pillOn : styles.pillOff}`}
              aria-label={`Disponibilidade de ${name}`}
              aria-pressed={status === ProductStatusEnum.ACTIVED}
              disabled={updatingStatus}
              onClick={() => void alterationStatus()}
            >
              <span className={styles.pillDot} />
            </button>
            <span className={styles.disp}>{status === ProductStatusEnum.ACTIVED ? "Ativo" : "Oculto"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
