import { getOrderStatus } from "../../utils/orderStatus";
import { useId, useState } from "react";
import {
  ClipboardList,
  CreditCard,
  History,
  MapPin,
  MessageSquare,
  Plus,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { MdOutlineTableRestaurant } from "react-icons/md";
import TableDialog from "./TableDialog";
import ProductThumbnail from "./ProductThumbnail";
import {
  formatDeliveryPhone,
  formatMoney,
  getTabItems,
  getTabLabel,
  getTabTotals,
  ORDER_TYPE_LABELS,
  type MockTab,
} from "./mockTables";
import styles from "./Tables.module.css";

type Props = {
  tab: MockTab;
  finalizing: boolean;
  finalizeError: string | null;
  onClose: () => void;
  onAddItems: () => void;
  onFinalize: () => void;
  onNotesChange: (notes: string) => void;
  onViewOrder?: () => void;
};

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TabDetailsModal({
  tab,
  finalizing,
  finalizeError,
  onClose,
  onAddItems,
  onFinalize,
  onNotesChange,
  onViewOrder,
}: Props) {
  const [section, setSection] = useState<"summary" | "history" | "notes">(
    "summary",
  );
  const noteId = useId();
  const items = getTabItems(tab);
  const totals = getTabTotals(tab);
  const finalized = Boolean(tab.closedAt);
  let icon = <MdOutlineTableRestaurant />;
  if (tab.type === "delivery") icon = <Truck />;
  if (tab.type === "pickup") icon = <ShoppingBag />;
  let statusLabel = finalized ? "Finalizada" : "Em aberto";
  if (tab.apiOrder) {
    const labels: Record<string, string> = {
      RECEIVED: "Recebido",
      PREPARING: "Em preparo",
      READY: "Pronto",
      ON_ROUTE: "Em rota",
      DELIVERED: "Entregue",
      CANCELED: "Cancelado",
    };
    statusLabel = labels[getOrderStatus(tab.apiOrder)] ?? tab.apiOrder.status;
  }

  return (
    <TableDialog
      title={getTabLabel(tab)}
      description={`${tab.orders.length} ${tab.orders.length === 1 ? "pedido" : "pedidos"} · Iniciada às ${formatTime(tab.openedAt)}`}
      icon={icon}
      onClose={onClose}
      wide
    >
      <div className={styles.tabMeta}>
        <span
          className={`${styles.statusBadge} ${finalized ? styles.free : styles.occupied}`}
        >
          {statusLabel}
        </span>
        <span>{ORDER_TYPE_LABELS[tab.type]}</span>
        <span className={styles.demoLabel}>
          {tab.apiOrder ? "Pedido salvo" : "Comanda salva"}
        </span>
      </div>
      <div className={styles.categoryTabs} aria-label="Informações da comanda">
        <button
          type="button"
          className={
            section === "summary"
              ? styles.categoryActive
              : styles.categoryButton
          }
          aria-pressed={section === "summary"}
          onClick={() => setSection("summary")}
        >
          <ClipboardList size={18} /> {tab.apiOrder ? "Resumo" : "Comanda"}
        </button>
        <button
          type="button"
          className={
            section === "history"
              ? styles.categoryActive
              : styles.categoryButton
          }
          aria-pressed={section === "history"}
          onClick={() => setSection("history")}
        >
          <History size={18} /> Pedidos ({tab.orders.length})
        </button>
        <button
          type="button"
          className={
            section === "notes" ? styles.categoryActive : styles.categoryButton
          }
          aria-pressed={section === "notes"}
          onClick={() => setSection("notes")}
        >
          <MessageSquare size={18} /> Observações
        </button>
      </div>

      {section === "summary" && (
        <div className={styles.detailsBody}>
          <div className={styles.sectionHeading}>
            <h3>Itens {tab.type === "table" ? "da mesa" : "do pedido"}</h3>
            {!finalized && !tab.apiOrder && (
              <button
                type="button"
                className={styles.outlineButton}
                disabled={finalizing}
                onClick={onAddItems}
              >
                <Plus size={16} /> Adicionar itens
              </button>
            )}
          </div>
          <div className={styles.summaryItems}>
            {items.length === 0 && (
              <p className={styles.emptyState}>
                Nenhum item adicionado à comanda.
              </p>
            )}
            {items.map((item) => (
              <div
                key={`${item.id}-${item.priceInCents}`}
                className={styles.summaryItem}
              >
                <ProductThumbnail product={item} />
                <strong>{item.name}</strong>
                <span className={styles.itemQuantity}>{item.quantity}×</span>
                <span className={styles.itemTotal}>
                  {formatMoney(item.priceInCents * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          {tab.type === "delivery" && tab.deliveryAddress && (
            <section
              className={styles.deliverySummary}
              aria-label="Dados da entrega"
            >
              <h3>
                <MapPin size={17} /> Endereço de entrega
              </h3>
              <strong>{tab.customerName}</strong>
              {tab.customerPhone && (
                <p>{formatDeliveryPhone(tab.customerPhone)}</p>
              )}
              <address>
                <p>
                  {tab.deliveryAddress.street}, {tab.deliveryAddress.number}
                  {tab.deliveryAddress.block &&
                    ` · Quadra ${tab.deliveryAddress.block}`}
                </p>
                {tab.deliveryAddress.lot && (
                  <p>Lote {tab.deliveryAddress.lot}</p>
                )}
                <p>
                  {tab.deliveryAddress.neighborhood} ·{" "}
                  {tab.deliveryAddress.city}/{tab.deliveryAddress.state}
                </p>
                <p>CEP {tab.deliveryAddress.zipCode}</p>
                {tab.deliveryAddress.complement && (
                  <p>Complemento: {tab.deliveryAddress.complement}</p>
                )}
                {tab.deliveryAddress.reference && (
                  <p>Referência: {tab.deliveryAddress.reference}</p>
                )}
              </address>
            </section>
          )}
        </div>
      )}

      {section === "history" && (
        <div className={styles.orderHistory}>
          {tab.orders.map((order, index) => (
            <article className={styles.historyEntry} key={order.id}>
              <div>
                <strong>
                  Pedido {String(index + 1).padStart(2, "0")}
                  {order.cancelled && " · Cancelado"}
                </strong>
                <time dateTime={order.createdAt}>
                  {formatTime(order.createdAt)}
                </time>
              </div>
              {order.items.map((item) => (
                <p key={item.id}>
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <strong>
                    {formatMoney(item.priceInCents * item.quantity)}
                  </strong>
                </p>
              ))}
            </article>
          ))}
        </div>
      )}

      {section === "notes" && (
        <div className={styles.field}>
          <label htmlFor={noteId}>
            {tab.apiOrder ? "Observações do pedido" : "Observações da comanda"}
          </label>
          <textarea
            id={noteId}
            rows={4}
            maxLength={500}
            readOnly={finalized || finalizing}
            value={tab.notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Preferências ou informações sobre o atendimento..."
          />
          <p className={styles.fieldHint}>
            {finalized
              ? "Esta comanda está finalizada."
              : "Observações mantidas apenas nesta tela, sem salvar na API."}{" "}
            {tab.notes.length}/500
          </p>
        </div>
      )}

      <div className={styles.totals}>
        <div>
          <span>Subtotal</span>
          <span>{formatMoney(totals.subtotalInCents)}</span>
        </div>
        {totals.serviceFeeInCents > 0 && (
          <div>
            <span>{tab.apiOrder ? "Taxa de entrega" : "Taxas"}</span>
            <span>{formatMoney(totals.serviceFeeInCents)}</span>
          </div>
        )}
        <div className={styles.grandTotal}>
          <strong>
            Total {tab.type === "table" ? "da mesa" : "do pedido"}
          </strong>
          <strong>{formatMoney(totals.totalInCents)}</strong>
        </div>
      </div>
      {finalizeError && (
        <p role="alert" className={styles.error}>
          {finalizeError}
        </p>
      )}
      <div className={styles.dialogFooter}>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={finalizing}
          onClick={onClose}
        >
          Voltar às mesas
        </button>
        {tab.apiOrder && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onViewOrder}
          >
            Acompanhar pedido
          </button>
        )}
        {!finalized && !tab.apiOrder && (
          <button
            type="button"
            className={styles.primaryButton}
            disabled={finalizing}
            onClick={onFinalize}
          >
            {finalizing ? (
              "Finalizando..."
            ) : (
              <>
                <CreditCard size={18} /> Finalizar comanda
              </>
            )}
          </button>
        )}
      </div>
    </TableDialog>
  );
}
